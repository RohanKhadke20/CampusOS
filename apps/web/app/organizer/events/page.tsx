import React from "react";
import { AppProvider } from "@/components/AppContext";
import { StitchShell } from "@/components/layout/StitchShell";
import { EventsView } from "@/components/events/EventsView";

export const metadata = {
  title: "Organizer Portal - Events | CampusOS",
  description: "Host, edit, configure tickets, view participant rosters, and monitor analytics.",
};

export default function OrganizerEventsPage() {
  return (
    <AppProvider>
      <StitchShell>
        <div className="space-y-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
            <span>
              <strong>Organizer Console Active</strong>: You have direct management privileges over club events, ticketing tiers, and participant rosters.
            </span>
          </div>
          <EventsView />
        </div>
      </StitchShell>
    </AppProvider>
  );
}
