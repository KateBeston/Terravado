/* The base persisted-record shape. Every stored record is an Entity (id +
   tenant + created timestamp); the data-layer Repository contract and the
   domain model build on it. Lives in the shared domain package so both the
   engine and the apps reference one definition. */
export interface Entity {
  id: string;
  tenantId: string;
  createdAt: string;
}
