"use client";

import React from "react";
import { AppProvider, useApp } from "../components/AppContext";
import { Sidebar } from "../components/layout/Sidebar";
import { DashboardView } from "../components/dashboard/DashboardView";
import { EventsView } from "../components/events/EventsView";
import { ClubsView } from "../components/clubs/ClubsView";
import { TasksView } from "../components/tasks/TasksView";
import { TimetableView } from "../components/timetable/TimetableView";
import { AttendanceView } from "../components/attendance/AttendanceView";
import { ResourcesView } from "../components/resources/ResourcesView";
import { PaymentsView } from "../components/payments/PaymentsView";
import { AIAssistantView } from "../components/ai/AIAssistantView";
import { IntegrationsView } from "../components/integrations/IntegrationsView";
import { AdminView } from "../components/admin/AdminView";
import { AuditLogsView } from "../components/audit/AuditLogsView";

function MainContent() {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "events" && <EventsView />}
      {activeTab === "clubs" && <ClubsView />}
      {activeTab === "tasks" && <TasksView />}
      {activeTab === "timetable" && <TimetableView />}
      {activeTab === "attendance" && <AttendanceView />}
      {activeTab === "resources" && <ResourcesView />}
      {activeTab === "payments" && <PaymentsView />}
      {activeTab === "ai" && <AIAssistantView />}
      {activeTab === "integrations" && <IntegrationsView />}
      {activeTab === "admin" && <AdminView />}
      {activeTab === "audit" && <AuditLogsView />}
    </main>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  );
}
