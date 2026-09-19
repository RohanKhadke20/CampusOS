import React from "react";
import { AppProvider } from "@/components/AppContext";
import { StitchShell } from "@/components/layout/StitchShell";
import { EventsView } from "@/components/events/EventsView";

export const metadata = {
  title: "Events & Hackathons | CampusOS",
  description: "Browse campus hackathons, workshops, symposiums, and competitions.",
};

export default function EventsPage() {
  return (
    <AppProvider>
      <StitchShell>
        <EventsView />
      </StitchShell>
    </AppProvider>
  );
}
