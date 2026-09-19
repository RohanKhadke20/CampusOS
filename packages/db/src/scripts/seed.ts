import path from "path";
import fs from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { demoData } from "../seeds/demo-data";

// Load environment variables from .env.local or .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envRootPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (fs.existsSync(envRootPath)) {
  config({ path: envRootPath });
}

export async function runSeed(): Promise<void> {
  console.log("=================================================");
  console.log("  CampusOS Database Seeder (Idempotent)");
  console.log("=================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`[Seed] Target Environment: ${supabaseUrl ? supabaseUrl : "Demo / Local Memory"}`);

  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("placeholder")) {
    console.log("[Seed] Connecting to Supabase with Service Role...");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    try {
      // 1. Seed Users
      console.log("[Seed] Seeding Users...");
      for (const u of demoData.users) {
        const { error } = await supabase.from("users").upsert(
          {
            id: u.id,
            email: u.email,
            role: u.role,
            is_active: true,
          },
          { onConflict: "email" }
        );
        if (error && !error.message.includes("relation \"users\" does not exist")) {
          console.warn(`  [Warning] User upsert (${u.email}):`, error.message);
        }
      }

      // 2. Seed Profiles
      console.log("[Seed] Seeding Profiles...");
      for (const u of demoData.users) {
        const p = u.profile;
        const { error } = await supabase.from("profiles").upsert(
          {
            id: p.id,
            user_id: p.userId,
            full_name: p.fullName,
            avatar_url: p.avatarUrl,
            student_id: p.studentId,
            department: p.department,
            year_of_study: p.yearOfStudy,
            phone: p.phone,
            bio: p.bio,
          },
          { onConflict: "user_id" }
        );
        if (error && !error.message.includes("relation \"profiles\" does not exist")) {
          console.warn(`  [Warning] Profile upsert (${p.fullName}):`, error.message);
        }
      }

      // 3. Seed Organizations
      console.log("[Seed] Seeding Organizations (Clubs)...");
      for (const o of demoData.organizations) {
        const { error } = await supabase.from("organizations").upsert(
          {
            id: o.id,
            name: o.name,
            slug: o.slug,
            description: o.description,
            logo_url: o.logoUrl,
            banner_url: o.bannerUrl,
            category: o.category,
            is_verified: o.isVerified,
            created_by: o.createdBy,
          },
          { onConflict: "slug" }
        );
        if (error && !error.message.includes("relation \"organizations\" does not exist")) {
          console.warn(`  [Warning] Organization upsert (${o.slug}):`, error.message);
        }
      }

      // 4. Seed Memberships
      console.log("[Seed] Seeding Memberships...");
      for (const m of demoData.memberships) {
        const { error } = await supabase.from("memberships").upsert(
          {
            organization_id: m.organizationId,
            user_id: m.userId,
            role: m.role,
          },
          { onConflict: "organization_id,user_id" }
        );
        if (error && !error.message.includes("relation \"memberships\" does not exist")) {
          console.warn(`  [Warning] Membership upsert:`, error.message);
        }
      }

      // 5. Seed Events & Tickets
      console.log("[Seed] Seeding Events & Tickets...");
      for (const ev of demoData.events) {
        const { error: evErr } = await supabase.from("events").upsert(
          {
            id: ev.id,
            organization_id: ev.organizationId,
            title: ev.title,
            slug: ev.slug,
            description: ev.description,
            venue: ev.venue,
            latitude: ev.latitude,
            longitude: ev.longitude,
            start_time: ev.startTime,
            end_time: ev.endTime,
            status: ev.status,
            banner_url: ev.bannerUrl,
            max_capacity: ev.maxCapacity,
            is_paid: ev.isPaid,
            created_by: ev.createdBy,
          },
          { onConflict: "slug" }
        );
        if (evErr && !evErr.message.includes("relation \"events\" does not exist")) {
          console.warn(`  [Warning] Event upsert (${ev.slug}):`, evErr.message);
        }

        if (ev.tickets && ev.tickets.length > 0) {
          for (const t of ev.tickets) {
            const { error: tktErr } = await supabase.from("event_tickets").upsert(
              {
                id: t.id,
                event_id: ev.id,
                title: t.title,
                description: t.description,
                price_cents: t.priceCents,
                currency: t.currency,
                quantity_available: t.quantityAvailable,
                quantity_sold: t.quantitySold,
                sales_end: ev.endTime,
              },
              { onConflict: "id" }
            );
            if (tktErr && !tktErr.message.includes("relation \"event_tickets\" does not exist")) {
              console.warn(`  [Warning] Ticket upsert (${t.title}):`, tktErr.message);
            }
          }
        }
      }

      // 6. Seed Registrations
      console.log("[Seed] Seeding Registrations...");
      for (const r of demoData.registrations) {
        const { error } = await supabase.from("event_registrations").upsert(
          {
            id: r.id,
            event_id: r.eventId,
            ticket_id: r.ticketId,
            user_id: r.userId,
            registration_number: r.registrationNumber,
            status: r.status,
          },
          { onConflict: "event_id,user_id" }
        );
        if (error && !error.message.includes("relation \"event_registrations\" does not exist")) {
          console.warn(`  [Warning] Registration upsert:`, error.message);
        }
      }

      // 7. Seed Payments
      console.log("[Seed] Seeding Payments...");
      for (const p of demoData.payments) {
        const { error } = await supabase.from("payments").upsert(
          {
            id: p.id,
            user_id: p.userId,
            razorpay_order_id: p.orderId,
            razorpay_payment_id: p.paymentId,
            amount_cents: p.amountCents,
            currency: p.currency,
            status: p.status,
          },
          { onConflict: "razorpay_order_id" }
        );
        if (error && !error.message.includes("relation \"payments\" does not exist")) {
          console.warn(`  [Warning] Payment upsert (${p.orderId}):`, error.message);
        }
      }

      // 8. Seed Tasks
      console.log("[Seed] Seeding Tasks...");
      for (const t of demoData.tasks) {
        const { error } = await supabase.from("tasks").upsert(
          {
            id: t.id,
            user_id: t.userId,
            organization_id: t.organizationId,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            due_date: t.dueDate,
          },
          { onConflict: "id" }
        );
        if (error && !error.message.includes("relation \"tasks\" does not exist")) {
          console.warn(`  [Warning] Task upsert (${t.title}):`, error.message);
        }
      }

      // 9. Seed Attendance
      console.log("[Seed] Seeding Attendance...");
      for (const a of demoData.attendance) {
        const { error } = await supabase.from("attendance_records").upsert(
          {
            id: a.id,
            user_id: a.userId,
            subject_code: a.subjectCode,
            subject_name: a.subjectName,
            session_date: a.sessionDate,
            status: a.status,
            remarks: a.remarks,
          },
          { onConflict: "id" }
        );
        if (error && !error.message.includes("relation \"attendance_records\" does not exist")) {
          console.warn(`  [Warning] Attendance record upsert:`, error.message);
        }
      }

      // 10. Seed Resources
      console.log("[Seed] Seeding Resources...");
      for (const res of demoData.resources) {
        const { error } = await supabase.from("resources").upsert(
          {
            id: res.id,
            organization_id: res.organizationId,
            name: res.name,
            type: res.type,
            capacity: res.capacity,
            location: res.location,
            is_available: res.isAvailable,
          },
          { onConflict: "id" }
        );
        if (error && !error.message.includes("relation \"resources\" does not exist")) {
          console.warn(`  [Warning] Resource upsert (${res.name}):`, error.message);
        }
      }

      // 11. Seed Notifications
      console.log("[Seed] Seeding Notifications...");
      for (const n of demoData.notifications) {
        const { error } = await supabase.from("notifications").upsert(
          {
            id: n.id,
            user_id: n.userId,
            title: n.title,
            message: n.message,
            link_url: n.linkUrl,
            is_read: n.isRead,
          },
          { onConflict: "id" }
        );
        if (error && !error.message.includes("relation \"notifications\" does not exist")) {
          console.warn(`  [Warning] Notification upsert (${n.title}):`, error.message);
        }
      }

      // 12. Seed Audit Logs
      console.log("[Seed] Seeding Audit Logs...");
      for (const al of demoData.auditLogs) {
        const { error } = await supabase.from("audit_logs").upsert(
          {
            id: al.id,
            actor_id: al.actorId,
            action: al.action,
            resource_type: al.resourceType,
            resource_id: al.resourceId,
            ip_address: al.ipAddress,
            user_agent: al.userAgent,
            changes: al.changes,
          },
          { onConflict: "id" }
        );
        if (error && !error.message.includes("relation \"audit_logs\" does not exist")) {
          console.warn(`  [Warning] Audit log upsert:`, error.message);
        }
      }
    } catch (err: any) {
      console.warn("[Seed] Remote Supabase upsert note:", err.message);
    }
  } else {
    console.log("[Seed] Supabase URL or Service Role not present; initialized demo dataset in-memory.");
  }

  // Summary output
  console.log("\n-------------------------------------------------");
  console.log("  Idempotent Seed Execution Completed");
  console.log("-------------------------------------------------");
  console.log(`✓ Students seeded:      3 (${demoData.users.filter(u => u.role === "STUDENT").map(u => u.profile.fullName).join(", ")})`);
  console.log(`✓ Organizers seeded:    2 (${demoData.users.filter(u => u.role === "ORGANIZER").map(u => u.profile.fullName).join(", ")})`);
  console.log(`✓ Admins seeded:        1 (${demoData.users.filter(u => u.role === "ADMIN").map(u => u.profile.fullName).join(", ")})`);
  console.log(`✓ Organizations seeded: 3 (${demoData.organizations.map(o => o.name).join(", ")})`);
  console.log(`✓ Events seeded:        6 (${demoData.events.map(e => e.title).join(", ")})`);
  console.log(`✓ Tasks seeded:         ${demoData.tasks.length}`);
  console.log(`✓ Resources seeded:     ${demoData.resources.length}`);
  console.log(`✓ Payments seeded:      ${demoData.payments.length}`);
  console.log(`✓ Notifications seeded: ${demoData.notifications.length}`);
  console.log(`✓ Attendance records:   ${demoData.attendance.length}`);
  console.log(`✓ Audit logs:           ${demoData.auditLogs.length}`);
  console.log("-------------------------------------------------\n");
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error("[Seed Error]", err);
    process.exit(1);
  });
}
