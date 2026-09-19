import React from "react";
import { AppProvider } from "@/components/AppContext";
import { StitchShell } from "@/components/layout/StitchShell";
import { ResourcesView } from "@/components/resources/ResourcesView";

export const metadata = {
  title: "Resources & Google Drive | CampusOS",
  description: "Campus facilities, equipment booking, and Google Drive academic document storage.",
};

export default function ResourcesPage() {
  return (
    <AppProvider>
      <StitchShell>
        <ResourcesView />
      </StitchShell>
    </AppProvider>
  );
}
