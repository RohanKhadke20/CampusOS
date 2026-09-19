-- ============================================================================
-- CampusOS Initial PostgreSQL Schema Migration
-- 00001_initial_schema.sql
-- Implements all 19 relational entities specified in docs/DATABASE.md
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumeration Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'ORGANIZER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_role AS ENUM ('MEMBER', 'OFFICER', 'LEAD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('LAB', 'HALL', 'EQUIPMENT', 'ROOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Table Definitions
-- ============================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    role user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    student_id VARCHAR(50),
    department VARCHAR(100),
    year_of_study INT CHECK (year_of_study IS NULL OR (year_of_study >= 1 AND year_of_study <= 6)),
    phone VARCHAR(30),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. organizations (Clubs, Societies, Departments)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    category VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. memberships (Tenant Boundary & Role inside Organizations)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_org_user ON memberships(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships(organization_id);

-- 5. events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    venue VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    banner_url TEXT,
    max_capacity INT NOT NULL DEFAULT 100 CHECK (max_capacity > 0),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_event_dates CHECK (end_time >= start_time)
);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. event_tickets
CREATE TABLE IF NOT EXISTS event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    quantity_available INT NOT NULL DEFAULT 100 CHECK (quantity_available >= 0),
    quantity_sold INT NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
    sales_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sales_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON event_tickets(event_id);

-- 7. event_registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_number VARCHAR(64) UNIQUE NOT NULL,
    status registration_status NOT NULL DEFAULT 'CONFIRMED',
    check_in_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reg_event_user ON event_registrations(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reg_ticket_id ON event_registrations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reg_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_status ON event_registrations(status);

DROP TRIGGER IF EXISTS trg_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    registration_id UUID REFERENCES event_registrations(id) ON DELETE SET NULL,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount_cents INT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'CREATED',
    idempotency_key VARCHAR(128) UNIQUE,
    error_code VARCHAR(100),
    error_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reg_id ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    status task_status NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. attendance_records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    session_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_subject ON attendance_records(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON attendance_records(session_date);

-- 11. resources (Facilities, Labs, Equipment)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LAB', 'HALL', 'EQUIPMENT', 'ROOM')),
    capacity INT CHECK (capacity IS NULL OR capacity > 0),
    location VARCHAR(200),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_org_id ON resources(organization_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(id) WHERE deleted_at IS NULL;

-- 12. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 13. google_connections
CREATE TABLE IF NOT EXISTS google_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_user_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_google_connections_user_id ON google_connections(user_id);

DROP TRIGGER IF EXISTS trg_google_connections_updated_at ON google_connections;
CREATE TRIGGER trg_google_connections_updated_at
    BEFORE UPDATE ON google_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. calendar_events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_synced BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_calendar_dates CHECK (end_time >= start_time)
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_id ON calendar_events(event_id);

-- 15. drive_files
CREATE TABLE IF NOT EXISTS drive_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_file_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    web_view_link TEXT NOT NULL,
    entity_type VARCHAR(50), -- 'EVENT_ATTACHMENT', 'SYLLABUS', 'CLUB_DOC'
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_entity ON drive_files(entity_type, entity_id);

-- 16. ai_conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 17. ai_messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at);

-- 18. ai_actions
CREATE TABLE IF NOT EXISTS ai_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_mutating BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (confirmation_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    executed_at TIMESTAMPTZ,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_actions_conv ON ai_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_actions(confirmation_status);

-- 19. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- 5. Row Level Security (RLS) & Role-Aware Authorization
-- ============================================================================

-- Role helper function
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
    SELECT role::text FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS across all 19 tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. users policies
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
    FOR SELECT USING (
        auth.uid() = id
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
    FOR UPDATE USING (
        auth.uid() = id
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

-- 2. profiles policies
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT USING (true); -- Public/authenticated directory reading

DROP POLICY IF EXISTS profiles_modify_policy ON profiles;
CREATE POLICY profiles_modify_policy ON profiles
    FOR ALL USING (
        auth.uid() = user_id
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

-- 3. organizations policies
DROP POLICY IF EXISTS organizations_select_policy ON organizations;
CREATE POLICY organizations_select_policy ON organizations
    FOR SELECT USING (deleted_at IS NULL OR public.current_user_role() = 'ADMIN' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS organizations_modify_policy ON organizations;
CREATE POLICY organizations_modify_policy ON organizations
    FOR ALL USING (
        public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

-- 4. memberships policies
DROP POLICY IF EXISTS memberships_select_policy ON memberships;
CREATE POLICY memberships_select_policy ON memberships
    FOR SELECT USING (true);

DROP POLICY IF EXISTS memberships_modify_policy ON memberships;
CREATE POLICY memberships_modify_policy ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.organization_id = memberships.organization_id
            AND m.user_id = auth.uid()
            AND m.role = 'LEAD'
        )
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

-- 5. events policies
DROP POLICY IF EXISTS events_select_policy ON events;
CREATE POLICY events_select_policy ON events
    FOR SELECT USING (
        (status = 'PUBLISHED' AND deleted_at IS NULL)
        OR created_by = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS events_modify_policy ON events;
CREATE POLICY events_modify_policy ON events
    FOR ALL USING (
        created_by = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

-- 6. event_tickets policies
DROP POLICY IF EXISTS tickets_select_policy ON event_tickets;
CREATE POLICY tickets_select_policy ON event_tickets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS tickets_modify_policy ON event_tickets;
CREATE POLICY tickets_modify_policy ON event_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_tickets.event_id
            AND (e.created_by = auth.uid() OR public.current_user_role() IN ('ORGANIZER', 'ADMIN'))
        )
        OR auth.role() = 'service_role'
    );

-- 7. event_registrations policies
DROP POLICY IF EXISTS reg_select_policy ON event_registrations;
CREATE POLICY reg_select_policy ON event_registrations
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS reg_insert_policy ON event_registrations;
CREATE POLICY reg_insert_policy ON event_registrations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS reg_update_policy ON event_registrations;
CREATE POLICY reg_update_policy ON event_registrations
    FOR UPDATE USING (
        user_id = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

-- 8. payments policies
DROP POLICY IF EXISTS payments_select_policy ON payments;
CREATE POLICY payments_select_policy ON payments
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS payments_modify_policy ON payments;
CREATE POLICY payments_modify_policy ON payments
    FOR ALL USING (
        user_id = auth.uid()
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

-- 9. tasks policies
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
CREATE POLICY tasks_select_policy ON tasks
    FOR SELECT USING (
        (user_id = auth.uid() AND deleted_at IS NULL)
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS tasks_modify_policy ON tasks;
CREATE POLICY tasks_modify_policy ON tasks
    FOR ALL USING (
        user_id = auth.uid()
        OR public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

-- 10. attendance_records policies
DROP POLICY IF EXISTS attendance_select_policy ON attendance_records;
CREATE POLICY attendance_select_policy ON attendance_records
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS attendance_modify_policy ON attendance_records;
CREATE POLICY attendance_modify_policy ON attendance_records
    FOR ALL USING (
        public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

-- 11. resources policies
DROP POLICY IF EXISTS resources_select_policy ON resources;
CREATE POLICY resources_select_policy ON resources
    FOR SELECT USING (deleted_at IS NULL OR public.current_user_role() = 'ADMIN' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS resources_modify_policy ON resources;
CREATE POLICY resources_modify_policy ON resources
    FOR ALL USING (
        public.current_user_role() IN ('ORGANIZER', 'ADMIN')
        OR auth.role() = 'service_role'
    );

-- 12. notifications policies
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS notifications_modify_policy ON notifications;
CREATE POLICY notifications_modify_policy ON notifications
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 13. google_connections policies
DROP POLICY IF EXISTS google_connections_policy ON google_connections;
CREATE POLICY google_connections_policy ON google_connections
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 14. calendar_events policies
DROP POLICY IF EXISTS calendar_events_policy ON calendar_events;
CREATE POLICY calendar_events_policy ON calendar_events
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 15. drive_files policies
DROP POLICY IF EXISTS drive_files_policy ON drive_files;
CREATE POLICY drive_files_policy ON drive_files
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 16. ai_conversations policies
DROP POLICY IF EXISTS ai_conversations_policy ON ai_conversations;
CREATE POLICY ai_conversations_policy ON ai_conversations
    FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- 17. ai_messages policies
DROP POLICY IF EXISTS ai_messages_policy ON ai_messages;
CREATE POLICY ai_messages_policy ON ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- 18. ai_actions policies
DROP POLICY IF EXISTS ai_actions_policy ON ai_actions;
CREATE POLICY ai_actions_policy ON ai_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_conversations c
            WHERE c.id = ai_actions.conversation_id
            AND c.user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- 19. audit_logs policies
DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT USING (
        public.current_user_role() = 'ADMIN'
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT WITH CHECK (true); -- Any authenticated or system client can write an audit event
