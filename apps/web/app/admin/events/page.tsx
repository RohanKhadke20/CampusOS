import React from "react";
import { AppProvider } from "@/components/AppContext";
import { StitchShell } from "@/components/layout/StitchShell";
import { EventsView } from "@/components/events/EventsView";

export const metadata = {
  title: "Admin Command - Event Moderation | CampusOS",
  description: "Campus-wide event moderation, status overrides, and global registration inspection.",
};

export default function AdminEventsPage() {
  return (
    <AppProvider>
      <StitchShell>
        <div className="space-y-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
            <span>
              <strong>Admin Command Active</strong>: Full campus authority over event moderation, status deactivation, and global audit logging.
            </span>
          </div>
          <EventsView />
        </div>
      </StitchShell>
    </AppProvider>
  );
}
