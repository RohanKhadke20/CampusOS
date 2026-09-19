-- ============================================================================
-- CampusOS Seed Data Migration (Idempotent)
-- 00002_seed_data.sql
-- Seeds:
--  - 3 students (Alex Chen, Liam Patel, Maya Lin)
--  - 2 organizers (Sarah Jenkins, David Kim)
--  - 1 admin (Dr. Marcus Vance)
--  - 3 clubs (ACM Student Chapter, Autonomous Robotics Lab, Campus Design Collective)
--  - 6 events (CampusHack 2026, RoboCamp, Quantum Seminar, OSS Summit, Algo Trading, UI/UX Jam)
--  - tickets & event registrations
--  - tasks
--  - resources
--  - sample payments
--  - notifications
--  - attendance records & audit logs
-- ============================================================================

-- 1. SEED USERS (3 Students, 2 Organizers, 1 Admin)
INSERT INTO users (id, email, encrypted_password, role, is_active)
VALUES
    ('a1111111-1111-4111-8111-111111111111', 'student@campusos.edu', crypt('Student@2026', gen_salt('bf')), 'STUDENT', TRUE),
    ('a2222222-2222-4222-8222-222222222222', 'liam.student@campusos.edu', crypt('Student@2026', gen_salt('bf')), 'STUDENT', TRUE),
    ('a3333333-3333-4333-8333-333333333333', 'maya.student@campusos.edu', crypt('Student@2026', gen_salt('bf')), 'STUDENT', TRUE),
    ('b1111111-1111-4111-8111-111111111111', 'organizer@campusos.edu', crypt('Organizer@2026', gen_salt('bf')), 'ORGANIZER', TRUE),
    ('b2222222-2222-4222-8222-222222222222', 'david.lead@campusos.edu', crypt('Organizer@2026', gen_salt('bf')), 'ORGANIZER', TRUE),
    ('c1111111-1111-4111-8111-111111111111', 'admin@campusos.edu', crypt('Admin@2026', gen_salt('bf')), 'ADMIN', TRUE)
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = NOW();

-- 2. SEED PROFILES
INSERT INTO profiles (id, user_id, full_name, avatar_url, student_id, department, year_of_study, phone, bio)
VALUES
    (
        'f1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'Alex Chen',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'CS-2024-042',
        'Computer Science & Engineering',
        3,
        '+1 (555) 234-5678',
        'Junior CSE student specializing in autonomous agents, cloud runtimes, and distributed campus tooling.'
    ),
    (
        'f2222222-2222-4222-8222-222222222222',
        'a2222222-2222-4222-8222-222222222222',
        'Liam Patel',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        'ME-2025-088',
        'Mechanical Engineering',
        2,
        '+1 (555) 345-6789',
        'Sophomore Mechanical Engineering student passionate about robotics hardware, CAD modeling, and rapid 3D prototyping.'
    ),
    (
        'f3333333-3333-4333-8333-333333333333',
        'a3333333-3333-4333-8333-333333333333',
        'Maya Lin',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        'DS-2023-019',
        'Data Science & AI',
        4,
        '+1 (555) 456-7890',
        'Senior undergraduate specializing in LLM evaluation benchmarks, multi-modal computer vision, and neural search.'
    ),
    (
        'f4444444-4444-4444-8444-444444444444',
        'b1111111-1111-4111-8111-111111111111',
        'Sarah Jenkins',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        'EE-2023-118',
        'Robotics & Automation Society',
        4,
        '+1 (555) 567-8901',
        'Lead coordinator for university engineering symposiums and President of Autonomous Robotics Lab.'
    ),
    (
        'f5555555-5555-4555-8555-555555555555',
        'b2222222-2222-4222-8222-222222222222',
        'David Kim',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        'CS-2023-054',
        'Computer Science & Engineering',
        3,
        '+1 (555) 678-9012',
        'Vice Chair of ACM Student Chapter, lead organizer for CampusHack 2026, and full-stack systems engineer.'
    ),
    (
        'f6666666-6666-4666-8666-666666666666',
        'c1111111-1111-4111-8111-111111111111',
        'Dr. Marcus Vance',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        'FAC-901',
        'Dean of Academic & Student Affairs',
        NULL,
        '+1 (555) 789-0123',
        'Dean of Academic & Student Affairs overseeing registered student organizations, campus safety, and academic innovation.'
    )
ON CONFLICT (user_id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    student_id = EXCLUDED.student_id,
    department = EXCLUDED.department,
    year_of_study = EXCLUDED.year_of_study,
    bio = EXCLUDED.bio,
    updated_at = NOW();

-- 3. SEED ORGANIZATIONS (3 Clubs)
INSERT INTO organizations (id, name, slug, description, logo_url, banner_url, category, is_verified, created_by)
VALUES
    (
        'd1111111-1111-4111-8111-111111111111',
        'ACM Student Chapter',
        'acm-student-chapter',
        'Premier computing society hosting hackathons, developer seminars, open source cohorts, and competitive programming contests.',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200',
        'Technology & Coding',
        TRUE,
        'b2222222-2222-4222-8222-222222222222'
    ),
    (
        'd2222222-2222-4222-8222-222222222222',
        'Autonomous Robotics Lab',
        'robotics-lab',
        'Designing autonomous ground rovers, inspection drones, and competing in collegiate defense and robotics challenges.',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
        'Hardware & AI',
        TRUE,
        'b1111111-1111-4111-8111-111111111111'
    ),
    (
        'd3333333-3333-4333-8333-333333333333',
        'Campus Design Collective',
        'design-collective',
        'Fostering user experience craft, typography, 3D industrial prototyping, and digital brand design across campus initiatives.',
        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=100',
        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200',
        'Creative Arts & UI/UX',
        TRUE,
        'b1111111-1111-4111-8111-111111111111'
    )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- 4. SEED MEMBERSHIPS
INSERT INTO memberships (organization_id, user_id, role)
VALUES
    ('d1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'LEAD'),
    ('d1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'MEMBER'),
    ('d2222222-2222-4222-8222-222222222222', 'b1111111-1111-4111-8111-111111111111', 'LEAD'),
    ('d2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'MEMBER'),
    ('d3333333-3333-4333-8333-333333333333', 'b1111111-1111-4111-8111-111111111111', 'OFFICER'),
    ('d3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 'MEMBER')
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- 5. SEED EVENTS (6 Events)
INSERT INTO events (id, organization_id, title, slug, description, venue, latitude, longitude, start_time, end_time, status, banner_url, max_capacity, is_paid, created_by)
VALUES
    (
        'e1111111-1111-4111-8111-111111111111',
        'd1111111-1111-4111-8111-111111111111',
        'CampusHack 2026: AI & Edge Systems',
        'campushack-2026',
        '36-hour flagship campus hackathon focusing on Gemini agent workflows, autonomous campus tooling, and IoT hardware prototypes.',
        'Turing Innovation Hall & Labs',
        37.4275,
        -122.1697,
        '2026-10-15 09:00:00+00',
        '2026-10-16 21:00:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        250,
        TRUE,
        'b2222222-2222-4222-8222-222222222222'
    ),
    (
        'e2222222-2222-4222-8222-222222222222',
        'd2222222-2222-4222-8222-222222222222',
        'RoboCamp & Drone Showcase',
        'robocamp-drone-showcase',
        'Live obstacle course trials, open telemetry demonstrations, and hands-on ROS2 autonomous navigation workshop.',
        'Main Quadrangle Arena',
        37.4282,
        -122.1688,
        '2026-10-22 14:00:00+00',
        '2026-10-22 18:30:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
        400,
        FALSE,
        'b1111111-1111-4111-8111-111111111111'
    ),
    (
        'e3333333-3333-4333-8333-333333333333',
        'd1111111-1111-4111-8111-111111111111',
        'Quantum Computing & Cryptography Seminar',
        'quantum-computing-seminar',
        'Keynote addresses on post-quantum cryptographic primitives, lattice schemes, and quantum error mitigation architectures.',
        'Turing Seminar Hall 101',
        37.4278,
        -122.1702,
        '2026-11-04 10:00:00+00',
        '2026-11-04 13:00:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        120,
        FALSE,
        'b2222222-2222-4222-8222-222222222222'
    ),
    (
        'e4444444-4444-4444-8444-444444444444',
        'd1111111-1111-4111-8111-111111111111',
        'Open Source Campus Summit 2026',
        'open-source-summit-2026',
        'Connecting students with industry maintainers, Linux Foundation contributors, and hands-on Git & CI/CD deployment workshops.',
        'Grand Auditorium',
        37.4290,
        -122.1710,
        '2026-11-12 09:30:00+00',
        '2026-11-12 17:00:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        300,
        FALSE,
        'b2222222-2222-4222-8222-222222222222'
    ),
    (
        'e5555555-5555-4555-8555-555555555555',
        'd1111111-1111-4111-8111-111111111111',
        'Algorithmic Trading & FinTech Symposium',
        'algorithmic-trading-symposium',
        'Deep dive into high-frequency market microstructure, order matching engines, risk management, and algorithmic backtesting.',
        'Alan Turing Computer Science Block, Room 304',
        37.4276,
        -122.1695,
        '2026-11-20 13:00:00+00',
        '2026-11-20 18:00:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        150,
        TRUE,
        'b2222222-2222-4222-8222-222222222222'
    ),
    (
        'e6666666-6666-4666-8666-666666666666',
        'd3333333-3333-4333-8333-333333333333',
        'UI/UX Design Sprint & Prototyping Jam',
        'design-sprint-prototyping-jam',
        '8-hour collaborative sprint crafting accessible design tokens, micro-interactions, Figma design systems, and rapid user research.',
        'Makerspace Design Hub, West Wing',
        37.4265,
        -122.1720,
        '2026-11-28 10:00:00+00',
        '2026-11-28 18:00:00+00',
        'PUBLISHED',
        'https://images.unsplash.com/photo-1581291518655-9523c932deb4?w=800',
        80,
        FALSE,
        'b1111111-1111-4111-8111-111111111111'
    )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    venue = EXCLUDED.venue,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    status = EXCLUDED.status,
    is_paid = EXCLUDED.is_paid,
    max_capacity = EXCLUDED.max_capacity,
    banner_url = EXCLUDED.banner_url,
    updated_at = NOW();

-- 6. SEED EVENT TICKETS
INSERT INTO event_tickets (id, event_id, title, description, price_cents, currency, quantity_available, quantity_sold, sales_start, sales_end)
VALUES
    (
        't1111111-1111-4111-8111-111111111111',
        'e1111111-1111-4111-8111-111111111111',
        'Student Developer Pass',
        'Includes hackathon admission, 36-hour meal passes, GPU cluster computing quota, and official hacker swag kit.',
        49900,
        'INR',
        150,
        82,
        '2026-09-01 00:00:00+00',
        '2026-10-14 23:59:59+00'
    ),
    (
        't2222222-2222-4222-8222-222222222222',
        'e1111111-1111-4111-8111-111111111111',
        'Team Squad Pass (4x)',
        'Full team registration for 4 developers with reserved team workspace and hardware lab access.',
        159900,
        'INR',
        25,
        14,
        '2026-09-01 00:00:00+00',
        '2026-10-14 23:59:59+00'
    ),
    (
        't3333333-3333-4333-8333-333333333333',
        'e2222222-2222-4222-8222-222222222222',
        'Free General Campus RSVP',
        'Access to drone showcase arena, flight simulator demos, and live obstacle trials.',
        0,
        'INR',
        400,
        245,
        '2026-09-10 00:00:00+00',
        '2026-10-22 13:00:00+00'
    ),
    (
        't4444444-4444-4444-8444-444444444444',
        'e3333333-3333-4333-8333-333333333333',
        'Seminar Attendance Pass',
        'Reserved auditorium seating and access to digital lecture notes and reference bibliography.',
        0,
        'INR',
        120,
        98,
        '2026-09-15 00:00:00+00',
        '2026-11-04 09:00:00+00'
    ),
    (
        't5555555-5555-4555-8555-555555555555',
        'e4444444-4444-4444-8444-444444444444',
        'Summit All-Access Badge',
        'Access to keynotes, workshops, and contributor roundtables with industry partners.',
        0,
        'INR',
        300,
        180,
        '2026-09-15 00:00:00+00',
        '2026-11-12 08:30:00+00'
    ),
    (
        't6666666-6666-4666-8666-666666666666',
        'e5555555-5555-4555-8555-555555555555',
        'Delegate Pass & Trading Lab License',
        'Includes symposium pass and 30-day paper-trading terminal sandbox license.',
        79900,
        'INR',
        150,
        64,
        '2026-09-20 00:00:00+00',
        '2026-11-19 23:59:59+00'
    ),
    (
        't7777777-7777-4777-8777-777777777777',
        'e6666666-6666-4666-8666-666666666666',
        'Design Jam Participant Pass',
        'Includes prototyping supplies, design sprint workbook, and critique showcase entry.',
        0,
        'INR',
        80,
        60,
        '2026-09-20 00:00:00+00',
        '2026-11-28 09:00:00+00'
    )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    price_cents = EXCLUDED.price_cents,
    quantity_available = EXCLUDED.quantity_available,
    quantity_sold = EXCLUDED.quantity_sold;

-- 7. SEED EVENT REGISTRATIONS
INSERT INTO event_registrations (id, event_id, ticket_id, user_id, registration_number, status, check_in_time)
VALUES
    (
        'g1111111-1111-4111-8111-111111111111',
        'e1111111-1111-4111-8111-111111111111',
        't1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'CAMPUS-HACK-849201',
        'CONFIRMED',
        NULL
    ),
    (
        'g2222222-2222-4222-8222-222222222222',
        'e2222222-2222-4222-8222-222222222222',
        't3333333-3333-4333-8333-333333333333',
        'a1111111-1111-4111-8111-111111111111',
        'CAMPUS-ROBO-194820',
        'CONFIRMED',
        NULL
    ),
    (
        'g3333333-3333-4333-8333-333333333333',
        'e2222222-2222-4222-8222-222222222222',
        't3333333-3333-4333-8333-333333333333',
        'a2222222-2222-4222-8222-222222222222',
        'CAMPUS-ROBO-382910',
        'CONFIRMED',
        NULL
    ),
    (
        'g4444444-4444-4444-8444-444444444444',
        'e6666666-6666-4666-8666-666666666666',
        't7777777-7777-4777-8777-777777777777',
        'a3333333-3333-4333-8333-333333333333',
        'CAMPUS-DSGN-551934',
        'CONFIRMED',
        NULL
    ),
    (
        'g5555555-5555-4555-8555-555555555555',
        'e4444444-4444-4444-8444-444444444444',
        't5555555-5555-4555-8555-555555555555',
        'a2222222-2222-4222-8222-222222222222',
        'CAMPUS-OSS-771923',
        'CONFIRMED',
        NULL
    )
ON CONFLICT (event_id, user_id) DO UPDATE
SET status = EXCLUDED.status,
    ticket_id = EXCLUDED.ticket_id,
    updated_at = NOW();

-- 8. SEED SAMPLE PAYMENTS
INSERT INTO payments (id, user_id, registration_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_cents, currency, status, idempotency_key, metadata)
VALUES
    (
        'p1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'g1111111-1111-4111-8111-111111111111',
        'order_campus_98124',
        'pay_campus_34571',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        49900,
        'INR',
        'CAPTURED',
        'idemp_campus_hack_alex_01',
        '{"eventTitle": "CampusHack 2026: AI & Edge Systems", "ticket": "Student Developer Pass"}'::jsonb
    ),
    (
        'p2222222-2222-4222-8222-222222222222',
        'a3333333-3333-4333-8333-333333333333',
        NULL,
        'order_campus_77492',
        'pay_campus_66281',
        'c4ca4238a0b923820dcc509a6f75849b27ae41e4649b934ca495991b7852b855',
        79900,
        'INR',
        'CAPTURED',
        'idemp_campus_fintech_maya_01',
        '{"eventTitle": "Algorithmic Trading & FinTech Symposium", "ticket": "Delegate Pass"}'::jsonb
    )
ON CONFLICT (razorpay_order_id) DO UPDATE
SET status = EXCLUDED.status,
    amount_cents = EXCLUDED.amount_cents,
    updated_at = NOW();

-- 9. SEED TASKS
INSERT INTO tasks (id, user_id, organization_id, title, description, priority, status, due_date)
VALUES
    (
        'k1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'd1111111-1111-4111-8111-111111111111',
        'Submit Machine Learning Lab Report 4',
        'Complete convolutional network benchmark analysis and upload compiled PDF documentation to Google Drive.',
        'HIGH',
        'IN_PROGRESS',
        '2026-09-24 23:59:59+00'
    ),
    (
        'k2222222-2222-4222-8222-222222222222',
        'a1111111-1111-4111-8111-111111111111',
        'd1111111-1111-4111-8111-111111111111',
        'Confirm Hackathon Mentorship Schedule',
        'Sync workshop timings with Professor Vance and mentor room reservations on Google Calendar.',
        'MEDIUM',
        'TODO',
        '2026-09-28 17:00:00+00'
    ),
    (
        'k3333333-3333-4333-8333-333333333333',
        'a2222222-2222-4222-8222-222222222222',
        'd2222222-2222-4222-8222-222222222222',
        'Calibrate LiDAR Sensors for Obstacle Rover',
        'Perform field tests at Autonomous Robotics Arena and record point cloud drift metrics.',
        'URGENT',
        'IN_PROGRESS',
        '2026-09-25 18:00:00+00'
    ),
    (
        'k4444444-4444-4444-8444-444444444444',
        'a3333333-3333-4333-8333-333333333333',
        'd3333333-3333-4333-8333-333333333333',
        'Finalize Design Sprint Workbook',
        'Export Figma tokens and review slide deck for student participant onboarding.',
        'MEDIUM',
        'TODO',
        '2026-09-30 12:00:00+00'
    ),
    (
        'k5555555-5555-4555-8555-555555555555',
        'b1111111-1111-4111-8111-111111111111',
        'd2222222-2222-4222-8222-222222222222',
        'Submit Quadrangle Arena Safety Permit',
        'File drone flight corridor authorization with Campus Security and Dean Vance.',
        'HIGH',
        'REVIEW',
        '2026-09-23 15:00:00+00'
    ),
    (
        'k6666666-6666-4666-8666-666666666666',
        'b2222222-2222-4222-8222-222222222222',
        'd1111111-1111-4111-8111-111111111111',
        'Finalize Razorpay Payment Gateway Webhooks',
        'Verify production webhook signatures for CampusHack 2026 ticket registration pipeline.',
        'HIGH',
        'DONE',
        '2026-09-18 19:00:00+00'
    )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date,
    updated_at = NOW();

-- 10. SEED ATTENDANCE RECORDS
INSERT INTO attendance_records (id, user_id, subject_code, subject_name, session_date, status, remarks)
VALUES
    ('l1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'CS601', 'Distributed Systems', '2026-09-18', 'PRESENT', 'Attended Paxos and Raft consensus algorithms discussion'),
    ('l2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', 'CS602', 'Artificial Intelligence & Robotics', '2026-09-18', 'PRESENT', 'Completed SLAM filter demonstration in lab'),
    ('l3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', 'CS603', 'Cloud Architecture & Security', '2026-09-17', 'PRESENT', 'Configured Kubernetes network policies'),
    ('l4444444-4444-4444-8444-444444444444', 'a2222222-2222-4222-8222-222222222222', 'ME301', 'Kinematics of Machinery', '2026-09-18', 'PRESENT', 'Gearbox dynamics practical exam'),
    ('l5555555-5555-4555-8555-555555555555', 'a3333333-3333-4333-8333-333333333333', 'DS402', 'Deep Learning & Neural Architectures', '2026-09-18', 'PRESENT', 'Transformer attention head visualization')
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    remarks = EXCLUDED.remarks;

-- 11. SEED RESOURCES
INSERT INTO resources (id, organization_id, name, type, capacity, location, is_available)
VALUES
    (
        'r1111111-1111-4111-8111-111111111111',
        'd1111111-1111-4111-8111-111111111111',
        'NVIDIA GPU Cluster Lab (Room 304)',
        'LAB',
        30,
        'Alan Turing Computer Science Block, 3rd Floor',
        TRUE
    ),
    (
        'r2222222-2222-4222-8222-222222222222',
        NULL,
        'Grand Auditorium',
        'HALL',
        800,
        'Central Campus Arts & Convention Complex',
        TRUE
    ),
    (
        'r3333333-3333-4333-8333-333333333333',
        'd3333333-3333-4333-8333-333333333333',
        'Prototyping 3D Printing Station',
        'EQUIPMENT',
        5,
        'Makerspace Hub, West Wing',
        TRUE
    ),
    (
        'r4444444-4444-4444-8444-444444444444',
        'd1111111-1111-4111-8111-111111111111',
        'Turing Seminar Hall 101',
        'ROOM',
        120,
        'Alan Turing Computer Science Block, 1st Floor',
        TRUE
    ),
    (
        'r5555555-5555-4555-8555-555555555555',
        'd2222222-2222-4222-8222-222222222222',
        'Autonomous Robotics Testing Field',
        'LAB',
        40,
        'Robotics Research Annex, South Gate',
        TRUE
    )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    location = EXCLUDED.location,
    is_available = EXCLUDED.is_available;

-- 12. SEED NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, link_url, is_read)
VALUES
    (
        'n1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'CampusHack 2026 Registration Confirmed',
        'Your registration ticket for CampusHack 2026: AI & Edge Systems has been verified. Check your ticket details on the event dashboard.',
        '/events/campushack-2026',
        FALSE
    ),
    (
        'n2222222-2222-4222-8222-222222222222',
        'a1111111-1111-4111-8111-111111111111',
        'New Assignment Posted: CS601 Distributed Systems',
        'Dr. Vance published Assignment 4 on Byzantine Fault Tolerance due September 24 at 11:59 PM.',
        '/tasks',
        FALSE
    ),
    (
        'n3333333-3333-4333-8333-333333333333',
        'a2222222-2222-4222-8222-222222222222',
        'RoboCamp & Drone Showcase Hardware Briefing',
        'RoboCamp telemetry setup begins at 1:30 PM tomorrow at the Main Quadrangle Arena. Bring your transmitter kits.',
        '/events/robocamp-drone-showcase',
        FALSE
    ),
    (
        'n4444444-4444-4444-8444-444444444444',
        'b1111111-1111-4111-8111-111111111111',
        'Facility Booking Approved',
        'Your reservation request for Grand Auditorium on October 22 has been formally approved by Dean Vance.',
        '/resources',
        TRUE
    ),
    (
        'n5555555-5555-4555-8555-555555555555',
        'b2222222-2222-4222-8222-222222222222',
        'Sponsorship Received: Razorpay',
        'Razorpay confirmed Gold sponsorship for CampusHack 2026 developer swag kit distribution.',
        '/events/campushack-2026',
        FALSE
    ),
    (
        'n6666666-6666-4666-8666-666666666666',
        'c1111111-1111-4111-8111-111111111111',
        'New Organization Charter Submitted',
        'Campus Design Collective submitted annual student society re-verification documents for review.',
        '/organizations',
        FALSE
    )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    message = EXCLUDED.message,
    is_read = EXCLUDED.is_read;

-- 13. SEED GOOGLE CONNECTIONS, CALENDAR & DRIVE
INSERT INTO google_connections (id, user_id, google_user_id, email, encrypted_refresh_token, scope, token_expiry)
VALUES
    (
        'm1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'goog_sub_9918231',
        'student@campusos.edu',
        'enc_oauth_refresh_token_mock_alex',
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file',
        '2026-12-31 23:59:59+00'
    )
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
    token_expiry = EXCLUDED.token_expiry,
    updated_at = NOW();

INSERT INTO calendar_events (id, user_id, google_event_id, event_id, title, description, start_time, end_time, is_synced)
VALUES
    (
        's1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'gcal_ev_campushack_2026',
        'e1111111-1111-4111-8111-111111111111',
        'CampusHack 2026: AI & Edge Systems',
        'Hacking session at Turing Innovation Hall',
        '2026-10-15 09:00:00+00',
        '2026-10-16 21:00:00+00',
        TRUE
    )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

INSERT INTO drive_files (id, user_id, google_file_id, file_name, mime_type, web_view_link, entity_type, entity_id)
VALUES
    (
        'w1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'gdrive_file_ml_report_4',
        'ML_Lab_Report_4_Convolutional_Benchmark.pdf',
        'application/pdf',
        'https://drive.google.com/file/d/gdrive_file_ml_report_4/view',
        'SYLLABUS',
        'k1111111-1111-4111-8111-111111111111'
    )
ON CONFLICT (id) DO UPDATE
SET file_name = EXCLUDED.file_name,
    web_view_link = EXCLUDED.web_view_link;

-- 14. SEED AI CONVERSATION, MESSAGES & ACTIONS
INSERT INTO ai_conversations (id, user_id, title)
VALUES
    (
        'x1111111-1111-4111-8111-111111111111',
        'a1111111-1111-4111-8111-111111111111',
        'CampusHack Registration & Lab Booking Assistance'
    )
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    updated_at = NOW();

INSERT INTO ai_messages (id, conversation_id, role, content, tool_calls, tool_results)
VALUES
    (
        'y1111111-1111-4111-8111-111111111111',
        'x1111111-1111-4111-8111-111111111111',
        'user',
        'Can you check if my CampusHack ticket is confirmed and find an available GPU lab for testing?',
        NULL,
        NULL
    ),
    (
        'y2222222-2222-4222-8222-222222222222',
        'x1111111-1111-4111-8111-111111111111',
        'assistant',
        'Yes Alex! Your registration for **CampusHack 2026: AI & Edge Systems** is confirmed (Registration # CAMPUS-HACK-849201). Also, the **NVIDIA GPU Cluster Lab (Room 304)** is available on the 3rd floor of the Turing Building.',
        '[{"name": "check_registration", "args": {"eventId": "campushack-2026"}}, {"name": "query_resources", "args": {"type": "LAB"}}]'::jsonb,
        '[{"status": "CONFIRMED"}, {"available": true, "name": "NVIDIA GPU Cluster Lab"}]'::jsonb
    )
ON CONFLICT (id) DO UPDATE
SET content = EXCLUDED.content;

INSERT INTO ai_actions (id, conversation_id, tool_name, parameters, is_mutating, confirmation_status, executed_at, result)
VALUES
    (
        'z1111111-1111-4111-8111-111111111111',
        'x1111111-1111-4111-8111-111111111111',
        'book_campus_resource',
        '{"resourceId": "r1111111-1111-4111-8111-111111111111", "timeSlot": "2026-10-15T10:00:00Z"}'::jsonb,
        TRUE,
        'APPROVED',
        NOW(),
        '{"success": true, "bookingId": "bk_819201"}'::jsonb
    )
ON CONFLICT (id) DO UPDATE
SET confirmation_status = EXCLUDED.confirmation_status;

-- 15. SEED AUDIT LOGS
INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, ip_address, user_agent, changes)
VALUES
    (
        '01111111-1111-4111-8111-111111111111',
        'c1111111-1111-4111-8111-111111111111',
        'ORGANIZATION_VERIFIED',
        'organization',
        'd1111111-1111-4111-8111-111111111111',
        '192.168.1.100',
        'CampusOS Admin Portal / Dean Console v1.0',
        '{"isVerified": true, "verifiedBy": "Dr. Marcus Vance"}'::jsonb
    ),
    (
        '02222222-2222-4222-8222-222222222222',
        'b2222222-2222-4222-8222-222222222222',
        'EVENT_PUBLISHED',
        'event',
        'e1111111-1111-4111-8111-111111111111',
        '192.168.1.102',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '{"status": "PUBLISHED", "ticketsAvailable": 175}'::jsonb
    ),
    (
        '03333333-3333-4333-8333-333333333333',
        'a1111111-1111-4111-8111-111111111111',
        'PAYMENT_CAPTURED',
        'payment',
        'p1111111-1111-4111-8111-111111111111',
        '192.168.1.105',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        '{"amountCents": 49900, "orderId": "order_campus_98124"}'::jsonb
    )
ON CONFLICT (id) DO UPDATE
SET action = EXCLUDED.action,
    changes = EXCLUDED.changes;
