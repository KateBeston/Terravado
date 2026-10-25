"use client";
/* ===========================================================================
   TERRAVADO — application store.
   Holds the engine data context + UI state (role, current view, selected
   records). Seeded in-memory for now; the shape is a clean seam for Supabase:
   swap `seedContext()` for a loader that reads the tenant's rows, and the
   `update` calls for writes, without touching the views.
   =========================================================================== */
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { EngineContext } from "./engine/engine";
import { seedContext } from "./engine/seeds";

export type Role = "admin" | "advisor" | "broker" | "client" | "public";
export const ROLES: Record<Role, { label: string; rank: number }> = {
  admin: { label: "Admin / principal", rank: 5 },
  advisor: { label: "Property investment advisor", rank: 4 },
  broker: { label: "Mortgage broker", rank: 3 },
  client: { label: "Client (investor)", rank: 2 },
  public: { label: "Public / prospect", rank: 1 },
};

export type View =
  | "portfolio" | "property" | "clients" | "serviceability"
  | "equity" | "lenders" | "feasibility" | "contacts" | "audit";

interface StoreValue {
  ctx: EngineContext;
  role: Role;
  setRole: (r: Role) => void;
  view: View;
  setView: (v: View) => void;
  propertyId: string | null;
  setPropertyId: (id: string | null) => void;
  /** Mutate a property by id with a producer, triggering a re-render. */
  updateProperty: (id: string, mut: (p: any) => void) => void;
  bump: number;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data] = useState<EngineContext>(() => seedContext());
  const [role, setRole] = useState<Role>("admin");
  const [view, setView] = useState<View>("portfolio");
  const [propertyId, setPropertyId] = useState<string | null>(() => data.properties[0]?.id ?? null);
  const [bump, setBump] = useState(0);

  const updateProperty = useCallback((id: string, mut: (p: any) => void) => {
    const p = data.properties.find((x) => x.id === id);
    if (p) { mut(p); setBump((b) => b + 1); }
  }, [data]);

  const value = useMemo<StoreValue>(() => ({
    ctx: data, role, setRole, view, setView, propertyId, setPropertyId, updateProperty, bump,
  }), [data, role, view, propertyId, updateProperty, bump]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
