"use client";

import { StoreProvider, useStore } from "@/lib/store";
import Masthead from "@/components/Masthead";
import Portfolio from "@/components/Portfolio";
import PropertyWorkspace from "@/components/PropertyWorkspace";

function comingSoon(label: string) {
  return (
    <div className="empty">
      <strong>{label}</strong> is part of the clean rebuild and lands in an upcoming increment.<br />
      The Portfolio module is live now; the calculation engine behind every module is already ported and verified.
    </div>
  );
}

function Shell() {
  const { view } = useStore();
  return (
    <>
      <Masthead />
      <div className="wrap">
        {view === "portfolio" ? <Portfolio />
          : view === "property" ? <PropertyWorkspace />
          : comingSoon(
            ({
              clients: "Clients", serviceability: "Serviceability",
              equity: "The equity chain", lenders: "Lenders", feasibility: "Feasibility",
              contacts: "Contacts", audit: "Audit & data",
            } as Record<string, string>)[view] || "This module",
          )}
        <div className="disclaimer">
          Terravado models Australian property investments. Tax outputs are indicative and must be verified against
          the relevant revenue office before being represented to a client. Authentication and role gating shown here
          are presentation-level; the production build enforces them server-side with row-level security.
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
