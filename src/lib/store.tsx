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
  duplicateProperty: (id: string) => void;
  deleteProperty: (id: string) => void;
  addProperty: () => void;
  clientId: string | null;
  setClientId: (id: string | null) => void;
  updateClient: (id: string, mut: (c: any) => void) => void;
  addClient: () => void;
  bump: number;
}

let _uid = 0;
const uid = (p = "id") => `${p}_${Date.now().toString(36)}${(_uid++).toString(36)}`;

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data] = useState<EngineContext>(() => seedContext());
  const [role, setRole] = useState<Role>("admin");
  const [view, setView] = useState<View>("portfolio");
  const [propertyId, setPropertyId] = useState<string | null>(() => data.properties[0]?.id ?? null);
  const [clientId, setClientId] = useState<string | null>(() => data.clients[0]?.id ?? null);
  const [bump, setBump] = useState(0);

  const updateProperty = useCallback((id: string, mut: (p: any) => void) => {
    const p = data.properties.find((x) => x.id === id);
    if (p) { mut(p); setBump((b) => b + 1); }
  }, [data]);

  const duplicateProperty = useCallback((id: string) => {
    const p = data.properties.find((x) => x.id === id);
    if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = uid("prop");
    copy.label = (p.label || "Property") + " (copy)";
    copy.status = "Appraised";
    data.properties.push(copy);
    setPropertyId(copy.id);
    setBump((b) => b + 1);
  }, [data]);

  const deleteProperty = useCallback((id: string) => {
    const i = data.properties.findIndex((x) => x.id === id);
    if (i < 0 || data.properties.length <= 1) return;
    data.properties.splice(i, 1);
    setPropertyId(data.properties[0]?.id ?? null);
    setBump((b) => b + 1);
  }, [data]);

  const addProperty = useCallback(() => {
    const base = data.properties[0];
    const fresh = JSON.parse(JSON.stringify(base));
    fresh.id = uid("prop");
    fresh.label = "New property";
    fresh.status = "Pipeline";
    data.properties.push(fresh);
    setPropertyId(fresh.id);
    setBump((b) => b + 1);
  }, [data]);

  const updateClient = useCallback((id: string, mut: (c: any) => void) => {
    const c = data.clients.find((x) => x.id === id);
    if (c) { mut(c); setBump((b) => b + 1); }
  }, [data]);

  const addClient = useCallback(() => {
    const base = data.clients[0];
    const fresh = JSON.parse(JSON.stringify(base));
    fresh.id = uid("cli");
    fresh.name = "New client";
    data.clients.push(fresh);
    setClientId(fresh.id);
    setBump((b) => b + 1);
  }, [data]);

  const value = useMemo<StoreValue>(() => ({
    ctx: data, role, setRole, view, setView, propertyId, setPropertyId,
    updateProperty, duplicateProperty, deleteProperty, addProperty,
    clientId, setClientId, updateClient, addClient, bump,
  }), [data, role, view, propertyId, updateProperty, duplicateProperty, deleteProperty, addProperty, clientId, updateClient, addClient, bump]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
