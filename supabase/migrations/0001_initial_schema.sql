-- ============================================================================
-- TERRA — Property Investment Modelling Platform
-- Migration 0001 — Initial schema
--
-- Target: Supabase / PostgreSQL 17  (region: ap-southeast-2 / Sydney)
--
-- Design principles baked in (reviewed with Kate):
--   1. Multi-tenant from the ground up: org -> membership(role) -> client ->
--      entity -> property, enforced by row-level security.
--   2. Inputs are the source of truth; engine OUTPUTS are not stored (they are
--      recomputable). The one exception is report_snapshots: immutable, for
--      Best Interests Duty evidence + reproducibility.
--   3. Reference data (tax blocks, property types, geo levels, metric and driver
--      definitions) lives as DATA, not code — extend by inserting rows.
--   4. Tax constants live in a single effective-dated, versioned block.
--   5. Append-only audit log (no update/delete at the DB level).
--   6. Suburb/market data lives on the GEOGRAPHY layer (entered once, shared),
--      with per-property overrides retained.
--   7. "Build only what the engine needs now, structured to extend": core
--      columns are explicit; an `extras jsonb` hatch on major entities absorbs
--      new fields without a migration, and each module's full field list is
--      expanded as that module is built.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";        -- case-insensitive text (emails)

-- ---------------------------------------------------------------------------
-- 0. Shared helpers
-- ---------------------------------------------------------------------------

-- updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS helpers (security definer so they can read memberships under RLS)
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and org_id = p_org
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and org_id = p_org and role::text = any(p_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Enumerated types (fixed sets only — extensible sets use reference tables)
-- ---------------------------------------------------------------------------

create type membership_role as enum
  ('owner','admin','adviser','broker','consultant','member','client','viewer');

create type modelling_class as enum
  ('residential','commercial','sda','land','agricultural');
  -- the calc path the engine takes. NEW display types reuse an existing class
  -- with zero engine change; a genuinely new class is one new engine branch.

create type property_status as enum
  ('pipeline','appraised','under_offer','owned','under_development','listed','sold');

create type entity_type as enum
  ('individual','joint','company','trust','smsf');

create type cash_frequency as enum
  ('weekly','fortnightly','monthly','bimonthly','quarterly','halfyearly','annual','oneoff');

create type scenario_band as enum ('bear','base','bull');

-- ---------------------------------------------------------------------------
-- 2. Tenancy & access
-- ---------------------------------------------------------------------------

create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext unique,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mirrors auth.users; one row per person.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       citext,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        membership_role not null default 'member',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on memberships (user_id);
create index on memberships (org_id);

-- ---------------------------------------------------------------------------
-- 3. Reference / definition tables  (extend by INSERT, no code change)
-- ---------------------------------------------------------------------------

-- Property taxonomy: category + type, each mapped to the engine's modelling_class.
create table property_types (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,            -- 'Residential','Disability (NDIS/SDA)','Commercial','Land','Rural/Agricultural', ...
  type         text not null,            -- 'House','SDA - High Physical Support','Warehouse','Cropping', ...
  class        modelling_class not null, -- which engine path
  sort_order   int not null default 0,
  active        boolean not null default true,
  extras       jsonb not null default '{}',
  unique (category, type)
);

-- Geography levels (country, region, state/province, locality, suburb, ... add more anytime)
create table geo_levels (
  code   text primary key,   -- 'country','region','state_province','locality','suburb'
  label  text not null,
  rank   int not null        -- 0 = broadest; larger = finer
);

-- Analytics metric definitions — add a new metric by adding a row.
create table geo_metric_definitions (
  id      uuid primary key default gen_random_uuid(),
  code    text unique not null,       -- 'population_growth','median_price','rental_demand_index', ...
  label   text not null,
  scope   text not null,              -- 'macro' | 'micro' | 'market'
  unit    text,                       -- '%','AUD','index','weeks', ...
  active  boolean not null default true
);

-- Growth-driver catalogue (the 22; three flagged auto-derived).
create table growth_driver_definitions (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  label       text not null,
  "group"     text not null,          -- 'macro','micro_location','planning_supply','asset_quality','rental_demand'
  is_auto     boolean not null default false,  -- the 3 derived from data, not hand-scored
  sort_order  int not null default 0
);

-- Effective-dated, versioned tax constants. Replaced wholesale; history retained.
create table tax_data_blocks (
  id             uuid primary key default gen_random_uuid(),
  jurisdiction   text not null default 'AU',   -- pluggable: 'AU','NZ','UK','US','custom'
  version        text not null,                -- e.g. 'AU-2025-26'
  effective_from date not null,
  effective_to   date,
  payload        jsonb not null,               -- duty schedules, thresholds, brackets, CGT, Div40 lives, ...
  created_at     timestamptz not null default now(),
  unique (jurisdiction, version)
);
create index on tax_data_blocks (jurisdiction, effective_from);

-- ---------------------------------------------------------------------------
-- 4. Geography & analytics  (shared market/demographic layer)
-- ---------------------------------------------------------------------------

create table geographies (
  id          uuid primary key default gen_random_uuid(),
  level       text not null references geo_levels(code),
  parent_id   uuid references geographies(id) on delete cascade,
  name        text not null,
  code        text,                 -- postcode / LGA code / ABS SA code / ISO country, etc.
  country     text,                 -- denormalised ISO country for quick filtering
  extras      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index on geographies (parent_id);
create index on geographies (level);
create index on geographies (country);

-- Time-stamped metric values per geography (macro at state/country, micro at suburb).
create table geo_metric_values (
  id             uuid primary key default gen_random_uuid(),
  geography_id   uuid not null references geographies(id) on delete cascade,
  metric_id      uuid not null references geo_metric_definitions(id),
  as_at          date not null,
  value          numeric,
  source         text,              -- provenance
  created_at     timestamptz not null default now(),
  unique (geography_id, metric_id, as_at)
);
create index on geo_metric_values (geography_id, metric_id, as_at desc);

-- ---------------------------------------------------------------------------
-- 5. Clients & people  (tenant-scoped)
-- ---------------------------------------------------------------------------

create table clients (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organisations(id) on delete cascade,
  name                 text not null,
  date_of_birth        date,
  phone                text,
  email                citext,
  address              text,
  residency_status     text,
  buyer_status         text,            -- first home buyer, investor, ...
  dependants           int default 0,
  consent_given        boolean default false,
  consent_at           timestamptz,
  declared_living_exp  numeric,         -- monthly
  weekly_cash_capacity numeric,         -- the survivability test figure
  goal_num_properties  int,
  goal_timeframe_years int,
  goal_retirement_income numeric,
  notes                text,
  extras               jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on clients (org_id);

-- Seven income types held separately (lenders shade each differently).
create table client_income (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  kind       text not null,     -- 'base_salary','overtime','bonus','commission','self_employed','dividends','other'
  label      text,
  amount     numeric not null default 0,
  frequency  cash_frequency not null default 'annual',
  is_partner boolean not null default false,
  extras     jsonb not null default '{}'
);
create index on client_income (client_id);

create table client_liabilities (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  client_id      uuid not null references clients(id) on delete cascade,
  kind           text not null,   -- 'credit_card','car_loan','personal_loan','hecs','bnpl','mortgage','other'
  limit_amount   numeric,         -- cards assessed on LIMIT, not balance
  balance        numeric,
  rate           numeric,
  monthly_repay  numeric,
  lender         text,
  extras         jsonb not null default '{}'
);
create index on client_liabilities (client_id);

create table client_assets (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  kind       text not null,       -- 'cash','shares','superannuation','vehicle','other'
  label      text,
  value      numeric not null default 0,
  extras     jsonb not null default '{}'
);
create index on client_assets (client_id);

-- ---------------------------------------------------------------------------
-- 6. Ownership entities
-- ---------------------------------------------------------------------------

create table entities (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organisations(id) on delete cascade,
  client_id             uuid references clients(id) on delete set null,
  name                  text not null,
  type                  entity_type not null default 'individual',
  state_of_registration text,
  other_taxable_income  numeric default 0,
  foreign_owned         boolean not null default false,
  deed_excludes_foreign boolean,          -- drives NSW trust land-tax threshold loss
  extras                jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on entities (org_id);

-- Owners + ownership % (marginal rates blended by actual share, not even split).
create table entity_owners (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  entity_id      uuid not null references entities(id) on delete cascade,
  owner_name     text not null,
  ownership_pct  numeric not null default 100,
  other_income   numeric default 0,
  extras         jsonb not null default '{}'
);
create index on entity_owners (entity_id);

-- ---------------------------------------------------------------------------
-- 7. Properties  (each row = one modelled scenario; duplicate = deep copy)
-- ---------------------------------------------------------------------------

-- Groups duplicated scenarios of the same real purchase, for side-by-side compare.
create table scenario_groups (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index on scenario_groups (org_id);

create table properties (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organisations(id) on delete cascade,
  scenario_group_id  uuid references scenario_groups(id) on delete set null,
  client_id          uuid references clients(id) on delete set null,
  entity_id          uuid references entities(id) on delete set null,
  suburb_geo_id      uuid references geographies(id) on delete set null,  -- inherits chain upward
  property_type_id   uuid references property_types(id),
  label              text not null,
  status             property_status not null default 'pipeline',
  is_ppor            boolean not null default false,
  active_scenario    scenario_band not null default 'base',
  holding_years      int,
  hurdle_irr         numeric,
  agent_fee_pct      numeric,
  sale_legal_costs   numeric,
  extras             jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on properties (org_id);
create index on properties (scenario_group_id);
create index on properties (client_id);
create index on properties (suburb_geo_id);

-- 1:1 physical detail (the 19 fields; full set expanded as the module is built)
create table property_physical (
  property_id   uuid primary key references properties(id) on delete cascade,
  year_built    int,
  bedrooms      int,
  bathrooms     int,
  car_spaces    int,
  living_areas  int,
  internal_area numeric,
  land_size     numeric,
  frontage      numeric,
  depth         numeric,
  orientation   text,
  construction_type text,
  roof_type     text,
  has_pool      boolean,
  has_solar     boolean,
  extras        jsonb not null default '{}'
);

create table room_schedule (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  name         text not null,
  length_m     numeric,
  width_m      numeric
);
create index on room_schedule (property_id);

-- 1:1 title (feeds zoning driver automatically)
create table property_title (
  property_id     uuid primary key references properties(id) on delete cascade,
  title_reference text,
  lot_plan        text,
  zoning          text,
  heritage_status text,
  heritage_note   text,
  extras          jsonb not null default '{}'
);

create table title_easements (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references properties(id) on delete cascade,
  type           text,
  beneficiary    text,
  width          numeric,
  affected_area  numeric,
  note           text
);
create index on title_easements (property_id);

create table title_encumbrances (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  type         text,
  detail       text,
  use_impact   text,
  note         text
);
create index on title_encumbrances (property_id);

-- 1:1 property-specific market data (SUBURB stats live on geo_metric_values;
-- these are the per-property figures + overrides + provenance).
create table property_market (
  property_id        uuid primary key references properties(id) on delete cascade,
  purchase_price     numeric,
  purchase_date      date,
  rent_growth        numeric,
  blend_weight       numeric,       -- suburb CAGR vs long-run anchor; defaults from suburb, override here
  provenance_flags   jsonb not null default '{}',  -- typed/imported/verified per key figure
  overrides          jsonb not null default '{}',  -- any suburb figure overridden for this property
  extras             jsonb not null default '{}'
);

create table comparable_sales (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references properties(id) on delete cascade,
  address         text,
  sale_date       date,
  price           numeric,
  bedrooms        int,
  bathrooms       int,
  car_spaces      int,
  land_size       numeric,
  internal_area   numeric,
  condition_score int,                         -- -2 .. +2
  adjustments     jsonb not null default '{}',  -- the seven exposed, itemised weights
  time_adjust     boolean not null default true
);
create index on comparable_sales (property_id);

create table sale_events (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  event_date    date,
  price         numeric,
  method        text,
  days_on_market int,
  note          text
);
create index on sale_events (property_id);

-- ---------------------------------------------------------------------------
-- 8. Category-specific detail  (one table per modelling_class that differs)
-- ---------------------------------------------------------------------------

create table residential_income (
  property_id     uuid primary key references properties(id) on delete cascade,
  weekly_rent     numeric,
  other_income    numeric,
  other_income_label text,
  management_fee_pct numeric,
  letting_fee_weeks numeric,
  gst_inclusive   boolean default false,
  vacancy_weeks_override numeric,
  extras          jsonb not null default '{}'
);

create table commercial_terms (
  property_id         uuid primary key references properties(id) on delete cascade,
  net_lease           boolean,
  outgoings_recovery_pct numeric,
  cap_rate            numeric,
  cap_rate_drift      numeric,
  annual_rent         numeric,
  review_type         text,            -- 'fixed','cpi','market'
  review_pct          numeric,
  cpi_floor           numeric,
  lease_years_remaining numeric,
  wale                numeric,          -- weighted average lease expiry
  reletting_void_months numeric,
  reletting_incentive_months numeric,
  makegood_cost       numeric,
  gst_registered      boolean,
  extras              jsonb not null default '{}'
);

-- NEW: Specialist Disability Accommodation (NDIS)
create table sda_details (
  property_id        uuid primary key references properties(id) on delete cascade,
  design_category    text,            -- 'Improved Liveability','Fully Accessible','Robust','High Physical Support'
  building_type      text,            -- apartment, villa, house, group home
  dwellings          int,
  sda_payment_basis  text,            -- how the SDA price point is derived
  rrc_amount         numeric,         -- Reasonable Rent Contribution
  cra_amount         numeric,         -- Commonwealth Rent Assistance
  onsite_overnight   boolean,         -- OOA allowance applicable
  enrolled           boolean,
  extras             jsonb not null default '{}'
);

-- NEW: Rural / Agricultural
create table agricultural_details (
  property_id        uuid primary key references properties(id) on delete cascade,
  land_area_ha       numeric,
  arable_ha          numeric,
  water_entitlements numeric,         -- ML
  water_rights_note  text,
  carrying_capacity  numeric,         -- DSE or head
  primary_use        text,            -- cropping, grazing, horticulture, dairy, ...
  annual_ag_income   numeric,
  extras             jsonb not null default '{}'
);

-- ---------------------------------------------------------------------------
-- 9. Expenses, loan & acquisition
-- ---------------------------------------------------------------------------

create table expenses (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  name          text not null,
  amount        numeric not null default 0,
  frequency     cash_frequency not null default 'annual',
  month_due     int,                 -- 1..12 for lumpy items
  escalation_pct numeric,            -- per-line escalation
  deductible    boolean not null default true
);
create index on expenses (property_id);

create table loans (
  property_id        uuid primary key references properties(id) on delete cascade,
  lender             text,
  repayment_type     text,           -- 'pi','io','io_then_pi'
  interest_only_years int,
  term_years         int,
  rate_structure     text,           -- 'variable','split'
  variable_rate      numeric,
  fixed_rate         numeric,
  fixed_period_years int,
  fixed_portion_pct  numeric,
  offset_balance     numeric,
  monthly_offset_add numeric,
  extra_repayments   numeric,
  annual_package_fee numeric,
  monthly_account_fee numeric,
  discharge_fee      numeric,
  purpose_investment_pct numeric default 100,  -- deductibility follows PURPOSE, flagged if < 100
  extras             jsonb not null default '{}'
);

create table loan_rate_path (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  year         int not null,
  rate         numeric not null
);
create index on loan_rate_path (property_id, year);

create table acquisition (
  property_id        uuid primary key references properties(id) on delete cascade,
  deposit_pct        numeric,
  duty_mode          text,            -- 'auto' | 'manual'
  manual_duty        numeric,
  foreign_buyer      boolean default false,
  first_home_buyer   boolean default false,
  capitalise_lmi     boolean default false,
  extras             jsonb not null default '{}'
);

create table acquisition_costs (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  name         text not null,       -- conveyancing, B&P, registration, loan estab, valuation, QS report, initial repairs, ...
  amount       numeric not null default 0
);
create index on acquisition_costs (property_id);

-- ---------------------------------------------------------------------------
-- 10. Depreciation & property tax settings
-- ---------------------------------------------------------------------------

create table depreciation (
  property_id       uuid primary key references properties(id) on delete cascade,
  mode              text,            -- 'assumed' | 'schedule'
  construction_cost numeric,
  plant_eligible    boolean,
  plant_value       numeric,
  scrapping_year    int,
  scrapped_residual numeric,
  extras            jsonb not null default '{}'
);

create table div43_lines (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  name          text not null,
  amount        numeric not null default 0,
  years_claimed int default 0
);
create index on div43_lines (property_id);

create table div40_items (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references properties(id) on delete cascade,
  asset          text not null,
  value          numeric not null default 0,
  effective_life numeric,
  method         text             -- 'prime_cost' | 'diminishing_value'
);
create index on div40_items (property_id);

create table property_tax_settings (
  property_id        uuid primary key references properties(id) on delete cascade,
  land_tax_mode      text,            -- 'aggregated' | 'manual'
  manual_land_tax    numeric,
  land_value_override numeric,
  payg_variation     boolean default false,
  extras             jsonb not null default '{}'
);

-- ---------------------------------------------------------------------------
-- 11. The journey: value-add & infrastructure
-- ---------------------------------------------------------------------------

create table value_add_events (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references properties(id) on delete cascade,
  year           int,
  type           text,
  name           text,
  cost           numeric,
  capital_uplift_pct numeric,
  rent_uplift    numeric,
  status         text
);
create index on value_add_events (property_id);

create table infrastructure_projects (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  name          text,
  year          int,
  growth_impact numeric,
  funded        boolean          -- announced vs funded are not the same thing
);
create index on infrastructure_projects (property_id);

-- ---------------------------------------------------------------------------
-- 12. Growth-driver scores per property  (references the catalogue)
-- ---------------------------------------------------------------------------

create table property_driver_scores (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  driver_id   uuid not null references growth_driver_definitions(id),
  score       int,               -- -2 .. +2 (auto drivers computed, not entered)
  unique (property_id, driver_id)
);
create index on property_driver_scores (property_id);

-- ---------------------------------------------------------------------------
-- 13. Lender templates  (org-scoped, admin-configured — NOT any lender's policy)
-- ---------------------------------------------------------------------------

create table lender_templates (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references organisations(id) on delete cascade,
  name                    text not null,
  assessment_buffer       numeric,
  assessment_floor        numeric,
  actual_rate             numeric,
  shading                 jsonb not null default '{}',   -- rental/overtime/bonus/commission/self-employed shading
  negative_gearing_addback boolean,
  hem_monthly             numeric,                       -- household expenditure measure
  per_dependant_amount    numeric,
  income_scaling          numeric,
  credit_card_assess_pct  numeric,
  assess_hecs             boolean,
  existing_debt_at_actual boolean,                       -- vs buffered rate
  max_lvr                 numeric,
  max_dti                 numeric,
  establishment_fee       numeric,
  valuation_fee           numeric,
  annual_fee              numeric,
  notes                   text,
  extras                  jsonb not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index on lender_templates (org_id);

-- ---------------------------------------------------------------------------
-- 14. Feasibility (value-add & development)
-- ---------------------------------------------------------------------------

create table feasibility (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organisations(id) on delete cascade,
  property_id        uuid references properties(id) on delete set null,
  name               text not null,
  type               text,            -- 'value_add' | 'development'
  state              text,
  land_cost          numeric,
  acquisition_cost_pct numeric,
  demolition         numeric,
  contingency        numeric,
  marketing          numeric,
  selling_costs      numeric,
  build_duration_months int,
  selling_duration_months int,
  debt_limit_value_pct numeric,
  debt_limit_cost_pct  numeric,
  debt_rate          numeric,
  line_fee           numeric,
  gst_applies        boolean,
  margin_scheme      boolean,
  target_margin      numeric,
  annual_holding_costs numeric,
  extras             jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on feasibility (org_id);

create table feasibility_product_mix (
  id            uuid primary key default gen_random_uuid(),
  feasibility_id uuid not null references feasibility(id) on delete cascade,
  name          text not null,
  unit_count    int,
  gross_floor_area numeric,
  build_rate    numeric,
  sale_price    numeric
);
create index on feasibility_product_mix (feasibility_id);

-- ---------------------------------------------------------------------------
-- 15. Audit, documents, report snapshots
-- ---------------------------------------------------------------------------

-- Append-only. No update/delete policy is created, so both are denied under RLS.
create table audit_log (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  actor_id       uuid references auth.users(id),
  acting_role    text,
  action         text not null,
  detail         jsonb not null default '{}',
  engine_version text,
  app_version    text,
  created_at     timestamptz not null default now()
);
create index on audit_log (org_id, created_at desc);

create table documents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  property_id   uuid references properties(id) on delete cascade,
  type          text,              -- contract, floor plan, B&P, strata report, 10.7, QS schedule, title, valuation, lease, ...
  filename      text not null,
  storage_path  text not null,     -- Supabase Storage object path (Sydney bucket)
  byte_size     bigint,
  added_at      timestamptz not null default now()
);
create index on documents (property_id);
create index on documents (org_id);

-- Immutable report evidence (Best Interests Duty + reproducibility).
create table report_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organisations(id) on delete cascade,
  property_id        uuid references properties(id) on delete set null,
  scenario_group_id  uuid references scenario_groups(id) on delete set null,
  kind               text,            -- 'property' | 'portfolio'
  tax_block_id       uuid references tax_data_blocks(id),
  engine_version     text,
  app_version        text,
  assumptions        jsonb not null,  -- full assumption record at time of report
  outputs            jsonb not null,  -- the numbers as produced
  generated_by       uuid references auth.users(id),
  generated_at       timestamptz not null default now()
);
create index on report_snapshots (org_id, generated_at desc);

-- ============================================================================
-- 16. Row-level security
-- ============================================================================

-- 16a. Tenant tables: members of the owning org have full CRUD.
do $$
declare t text;
begin
  foreach t in array array[
    'organisations','clients','client_income','client_liabilities','client_assets',
    'entities','entity_owners','scenario_groups','properties','property_physical',
    'room_schedule','property_title','title_easements','title_encumbrances',
    'property_market','comparable_sales','sale_events','residential_income',
    'commercial_terms','sda_details','agricultural_details','expenses','loans',
    'loan_rate_path','acquisition','acquisition_costs','depreciation','div43_lines',
    'div40_items','property_tax_settings','value_add_events','infrastructure_projects',
    'property_driver_scores','lender_templates','feasibility','feasibility_product_mix',
    'documents','report_snapshots','memberships','audit_log'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Helper note: child tables carry org_id directly (denormalised) so every policy
-- is a single membership check. The few that reach a parent for org are handled
-- explicitly below.

-- Generic org-scoped policies for tables that HAVE an org_id column.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','client_income','client_liabilities','client_assets',
    'entities','entity_owners','scenario_groups','properties',
    'lender_templates','feasibility','documents','report_snapshots'
  ]
  loop
    execute format($f$
      create policy %1$I_sel on %1$I for select using (public.is_org_member(org_id));
      create policy %1$I_ins on %1$I for insert with check (public.is_org_member(org_id));
      create policy %1$I_upd on %1$I for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
      create policy %1$I_del on %1$I for delete using (public.is_org_member(org_id));
    $f$, t);
  end loop;
end $$;

-- organisations: visible/editable to its members (membership drives access).
create policy organisations_sel on organisations for select using (public.is_org_member(id));
create policy organisations_upd on organisations for update using (public.has_org_role(id, array['owner','admin'])) with check (public.has_org_role(id, array['owner','admin']));

-- memberships: a user sees rows for orgs they belong to; owners/admins manage them.
create policy memberships_sel on memberships for select using (public.is_org_member(org_id));
create policy memberships_mod on memberships for all
  using (public.has_org_role(org_id, array['owner','admin']))
  with check (public.has_org_role(org_id, array['owner','admin']));

-- profiles: a user sees/edits only their own.
alter table profiles enable row level security;
create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- Child tables WITHOUT an org_id of their own reach their parent property's org.
-- (These carry property_id; the property holds org_id.)
do $$
declare t text;
begin
  foreach t in array array[
    'property_physical','room_schedule','property_title','title_easements',
    'title_encumbrances','property_market','comparable_sales','sale_events',
    'residential_income','commercial_terms','sda_details','agricultural_details',
    'expenses','loans','loan_rate_path','acquisition','acquisition_costs',
    'depreciation','div43_lines','div40_items','property_tax_settings',
    'value_add_events','infrastructure_projects','property_driver_scores'
  ]
  loop
    execute format($f$
      create policy %1$I_all on %1$I for all
      using (exists (select 1 from public.properties p where p.id = %1$I.property_id and public.is_org_member(p.org_id)))
      with check (exists (select 1 from public.properties p where p.id = %1$I.property_id and public.is_org_member(p.org_id)));
    $f$, t);
  end loop;
end $$;

-- feasibility_product_mix reaches feasibility for org.
create policy fpm_all on feasibility_product_mix for all
  using (exists (select 1 from public.feasibility f where f.id = feasibility_product_mix.feasibility_id and public.is_org_member(f.org_id)))
  with check (exists (select 1 from public.feasibility f where f.id = feasibility_product_mix.feasibility_id and public.is_org_member(f.org_id)));

-- audit_log: members may INSERT and SELECT only. No update/delete policies -> denied (append-only).
create policy audit_sel on audit_log for select using (public.is_org_member(org_id));
create policy audit_ins on audit_log for insert with check (public.is_org_member(org_id));

-- 16b. Shared reference data: readable by any authenticated user; writes are
-- done by the platform via the service role (which bypasses RLS). No write
-- policies are created, so normal users cannot modify shared reference data.
do $$
declare t text;
begin
  foreach t in array array[
    'property_types','geo_levels','geo_metric_definitions','growth_driver_definitions',
    'tax_data_blocks','geographies','geo_metric_values'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('create policy %1$I_read on %1$I for select to authenticated using (true);', t);
  end loop;
end $$;

-- ============================================================================
-- 17. updated_at triggers
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'organisations','profiles','clients','entities','properties',
    'lender_templates','feasibility'
  ]
  loop
    execute format('create trigger %1$I_touch before update on %1$I for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 18. Seed data  (taxonomy, geo levels, driver & metric catalogues, AU starter)
-- ============================================================================

insert into geo_levels(code,label,rank) values
  ('country','Country',0),
  ('region','Region',1),
  ('state_province','State / Province',2),
  ('locality','Locality / LGA',3),
  ('suburb','Suburb',4);

-- Property taxonomy (extend by inserting rows; each maps to an engine class).
insert into property_types(category,type,class,sort_order) values
  ('Residential','House','residential',10),
  ('Residential','Unit / Apartment','residential',20),
  ('Residential','Townhouse','residential',30),
  ('Residential','Dual Occupancy','residential',40),
  ('Residential','Villa','residential',50),
  ('Disability (NDIS/SDA)','SDA - Improved Liveability','sda',110),
  ('Disability (NDIS/SDA)','SDA - Fully Accessible','sda',120),
  ('Disability (NDIS/SDA)','SDA - Robust','sda',130),
  ('Disability (NDIS/SDA)','SDA - High Physical Support','sda',140),
  ('Commercial','Retail','commercial',210),
  ('Commercial','Office','commercial',220),
  ('Commercial','Warehouse / Industrial','commercial',230),
  ('Commercial','Medical','commercial',240),
  ('Commercial','Mixed Use','commercial',250),
  ('Land','Vacant Residential Land','land',310),
  ('Land','Development Site','land',320),
  ('Rural/Agricultural','Cropping','agricultural',410),
  ('Rural/Agricultural','Grazing / Livestock','agricultural',420),
  ('Rural/Agricultural','Horticulture','agricultural',430),
  ('Rural/Agricultural','Dairy','agricultural',440);

-- The 22 growth drivers (three auto-derived).
insert into growth_driver_definitions(code,label,"group",is_auto,sort_order) values
  ('pop_growth','Population growth','macro',false,10),
  ('employment_growth','Employment growth','macro',false,20),
  ('income_growth','Income growth','macro',false,30),
  ('credit_availability','Credit availability','macro',false,40),
  ('access_employment','Access to employment','micro_location',false,50),
  ('public_transport','Public transport','micro_location',false,60),
  ('school_catchment','School catchment','micro_location',false,70),
  ('amenity_walkability','Amenity & walkability','micro_location',false,80),
  ('lifestyle_premium','Lifestyle premium','micro_location',false,90),
  ('safety_street','Safety & street quality','micro_location',false,100),
  ('hazard_nuisance','Hazard & nuisance','micro_location',false,110),
  ('dwelling_pipeline','Dwelling pipeline','planning_supply',false,120),
  ('committed_infrastructure','Committed infrastructure','planning_supply',false,130),
  ('zoning_uplift','Zoning & uplift potential','planning_supply',true,140),
  ('land_scarcity','Land scarcity','planning_supply',false,150),
  ('land_to_asset','Land-to-asset ratio','asset_quality',true,160),
  ('floorplan','Floorplan functionality','asset_quality',false,170),
  ('condition_age','Condition against age','asset_quality',false,180),
  ('improvement_upside','Improvement upside','asset_quality',false,190),
  ('config_fit','Configuration fit vs suburb demand','asset_quality',false,200),
  ('size_vs_norm','Size against suburb norm','asset_quality',false,210),
  ('rental_demand_index','Rental demand index','rental_demand',true,220);

-- Geo analytics metric catalogue (extend any time).
insert into geo_metric_definitions(code,label,scope,unit) values
  ('pop_growth','Population growth','macro','%'),
  ('employment_growth','Employment growth','macro','%'),
  ('income_growth','Income growth','macro','%'),
  ('interest_rate_direction','Interest-rate direction','macro','index'),
  ('credit_availability','Credit availability','macro','index'),
  ('median_price','Median price','market','AUD'),
  ('median_rent','Median rent','market','AUD/wk'),
  ('suburb_cagr','Suburb CAGR','market','%'),
  ('vacancy_rate','Vacancy rate','market','%'),
  ('days_on_market','Days on market','market','days'),
  ('rentals_pct_stock','Rentals as % of stock','market','%'),
  ('rental_demand_index','Rental demand index','micro','index');

-- A minimal AU starter geography (country -> state) to anchor the tree.
insert into geographies(level,name,code,country) values ('country','Australia','AU','AU');
insert into geographies(level,parent_id,name,code,country)
select 'state_province', g.id, s.name, s.code, 'AU'
from geographies g,
  (values ('New South Wales','NSW'),('Victoria','VIC'),('Queensland','QLD'),
          ('South Australia','SA'),('Western Australia','WA'),('Tasmania','TAS'),
          ('Australian Capital Territory','ACT'),('Northern Territory','NT')) as s(name,code)
where g.level='country' and g.code='AU';

-- NOTE: tax_data_blocks is intentionally NOT seeded here. The AU-2025-26 block
-- is loaded from the engine's existing tax data in a follow-up data migration,
-- so the figures come from your verified source, not hand-typed here.
