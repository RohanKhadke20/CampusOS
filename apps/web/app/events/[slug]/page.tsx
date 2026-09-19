import React from "react";
import { AppProvider } from "@/components/AppContext";
import { StitchShell } from "@/components/layout/StitchShell";
import { EventDetailsClient } from "./EventDetailsClient";

export default async function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <AppProvider>
      <StitchShell>
        <EventDetailsClient slug={slug} />
      </StitchShell>
    </AppProvider>
  );
}
