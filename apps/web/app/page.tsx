"use client";

import React from "react";
import { AppProvider, useApp } from "../components/AppContext";
import { StitchShell } from "../components/layout/StitchShell";
import { StitchStudentDashboard } from "../components/dashboard/StitchStudentDashboard";
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
    <div className="w-full">
      {activeTab === "dashboard" && <StitchStudentDashboard />}
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
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <StitchShell>
        <MainContent />
      </StitchShell>
    </AppProvider>
  );
}
