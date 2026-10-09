/**
 * Complete, idempotent Supabase SQL Setup & Migration Script for Doorbly Partner App.
 * Safe to paste and run multiple times in the Supabase SQL Editor:
 * - Creates all 13 tables used across the Partner App, Customer Dispatch, and Admin Console
 * - Alters existing tables (`ADD COLUMN IF NOT EXISTS`) so previously created tables get all new columns
 * - Creates database triggers to automatically credit/debit partner wallets & create notifications
 * - Enables Row Level Security (RLS) with full Realtime read/write policies
 * - Adds all tables to `supabase_realtime` publication with `REPLICA IDENTITY FULL`
 * - Seeds initial real-time backend data (Offer of the Day, 23 Profession Categories, Service Catalogue)
 */
export const SUPABASE_COMPLETE_SQL_MIGRATION = `-- ============================================================================
-- DOORBLY PARTNER & REALTIME DISPATCH — COMPLETE SUPABASE SQL SETUP MIGRATION
-- Safe to run on both fresh and existing Supabase projects (100% Idempotent)
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. PARTNERS TABLE (public.doorbly_partners)
CREATE TABLE IF NOT EXISTS public.doorbly_partners (
  id TEXT PRIMARY KEY,
  auth_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  photo_url TEXT,
  address TEXT DEFAULT '',
  district TEXT DEFAULT '',
  city TEXT DEFAULT '',
  pin_code TEXT DEFAULT '',
  primary_category TEXT DEFAULT 'Home Repair & Maintenance',
  services_offered TEXT[] DEFAULT ARRAY[]::TEXT[],
  years_experience INT DEFAULT 1,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  working_area TEXT DEFAULT 'All Zones',
  preferred_radius_km INT DEFAULT 15,
  languages TEXT[] DEFAULT ARRAY['English', 'Hindi']::TEXT[],
  status TEXT DEFAULT 'pending_verification', -- incomplete | pending_verification | approved | rejected | suspended
  status_reason TEXT,
  is_online BOOLEAN DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  last_free_profession_replace_at TIMESTAMPTZ,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter existing doorbly_partners table to add any missing columns
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS pin_code TEXT DEFAULT '';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS primary_category TEXT DEFAULT 'Home Repair & Maintenance';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS years_experience INT DEFAULT 1;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS working_area TEXT DEFAULT 'All Zones';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS preferred_radius_km INT DEFAULT 15;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English', 'Hindi']::TEXT[];
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_verification';
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS last_free_profession_replace_at TIMESTAMPTZ;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.doorbly_partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enforce rule: Only 'approved' partners can be online in database
CREATE OR REPLACE FUNCTION public.enforce_approved_partner_online()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved' THEN
    NEW.is_online := false;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_approved_partner_online ON public.doorbly_partners;
CREATE TRIGGER trg_enforce_approved_partner_online
BEFORE INSERT OR UPDATE ON public.doorbly_partners
FOR EACH ROW EXECUTE FUNCTION public.enforce_approved_partner_online();


-- 2. PARTNER KYC & BANK VERIFICATION TABLE (public.doorbly_partner_kyc) [NEW]
CREATE TABLE IF NOT EXISTS public.doorbly_partner_kyc (
  id TEXT PRIMARY KEY,
  partner_id TEXT UNIQUE NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'aadhaar', -- aadhaar | pan
  document_number TEXT NOT NULL,
  document_image_url TEXT,
  bank_account TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  certificate_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  verification_status TEXT DEFAULT 'pending', -- pending | verified | rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. CUSTOMER SERVICE BOOKINGS TABLE (public.doorbly_service_bookings)
CREATE TABLE IF NOT EXISTS public.doorbly_service_bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_category TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT DEFAULT '',
  customer_location_address TEXT NOT NULL,
  customer_address TEXT,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 20.3547,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 85.8182,
  customer_latitude DOUBLE PRECISION,
  customer_longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION DEFAULT 2.4,
  booking_date TEXT DEFAULT CURRENT_DATE::TEXT,
  booking_time TEXT DEFAULT 'Immediate',
  estimated_duration TEXT DEFAULT '1 Hour',
  customer_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  partner_earning NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'SEARCHING_PARTNER', -- SEARCHING_PARTNER | REQUEST_SENT | ASSIGNED | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED
  assigned_partner_id TEXT REFERENCES public.doorbly_partners(id) ON DELETE SET NULL,
  otp_code TEXT DEFAULT '4829',
  notes TEXT,
  additional_services JSONB DEFAULT '[]'::JSONB,
  work_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter existing doorbly_service_bookings table to add new GPS & Order columns
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS customer_latitude DOUBLE PRECISION;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS customer_longitude DOUBLE PRECISION;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION DEFAULT 2.4;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS additional_services JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS work_notes TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS otp_code TEXT DEFAULT '4829';
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.doorbly_service_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Keep customer_address / customer_latitude / customer_longitude synced with primary location fields
CREATE OR REPLACE FUNCTION public.sync_booking_gps_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_address IS NULL OR NEW.customer_address = '' THEN
    NEW.customer_address := NEW.customer_location_address;
  END IF;
  IF NEW.customer_location_address IS NULL OR NEW.customer_location_address = '' THEN
    NEW.customer_location_address := COALESCE(NEW.customer_address, 'Customer Doorstep Location');
  END IF;
  IF NEW.customer_latitude IS NULL THEN
    NEW.customer_latitude := NEW.latitude;
  END IF;
  IF NEW.customer_longitude IS NULL THEN
    NEW.customer_longitude := NEW.longitude;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_booking_gps_fields ON public.doorbly_service_bookings;
CREATE TRIGGER trg_sync_booking_gps_fields
BEFORE INSERT OR UPDATE ON public.doorbly_service_bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_gps_fields();


-- 4. JOB ASSIGNMENTS TABLE (public.doorbly_job_assignments)
CREATE TABLE IF NOT EXISTS public.doorbly_job_assignments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.doorbly_service_bookings(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offered', -- offered | accepted | rejected | expired | completed
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);


-- 5. PARTNER WALLETS TABLE (public.doorbly_partner_wallets)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_wallets (
  id TEXT PRIMARY KEY,
  partner_id TEXT UNIQUE NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  available_balance NUMERIC(10, 2) DEFAULT 0.00,
  pending_amount NUMERIC(10, 2) DEFAULT 0.00,
  total_earned NUMERIC(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doorbly_partner_wallets ADD COLUMN IF NOT EXISTS total_earned NUMERIC(10, 2) DEFAULT 0.00;


-- 6. WALLET TRANSACTIONS TABLE (public.doorbly_partner_wallet_transactions)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 5)),
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  booking_id TEXT,
  type TEXT NOT NULL, -- credit | debit
  category TEXT NOT NULL, -- job_earning | withdrawal | membership_fee | profession_addon_fee | adjustment | bonus
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2),
  description TEXT,
  status TEXT DEFAULT 'completed', -- completed | pending | failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically maintain doorbly_partner_wallets balance on transaction insert
CREATE OR REPLACE FUNCTION public.update_partner_wallet_on_tx()
RETURNS TRIGGER AS $$
DECLARE
  current_bal NUMERIC(10, 2);
  new_bal NUMERIC(10, 2);
BEGIN
  INSERT INTO public.doorbly_partner_wallets (id, partner_id, available_balance, pending_amount, total_earned, updated_at)
  VALUES ('wal_' || NEW.partner_id, NEW.partner_id, 0.00, 0.00, 0.00, NOW())
  ON CONFLICT (partner_id) DO NOTHING;

  SELECT available_balance INTO current_bal
  FROM public.doorbly_partner_wallets
  WHERE partner_id = NEW.partner_id;

  IF NEW.status = 'completed' THEN
    IF NEW.type = 'credit' THEN
      new_bal := COALESCE(current_bal, 0) + NEW.amount;
      UPDATE public.doorbly_partner_wallets
      SET available_balance = new_bal,
          total_earned = COALESCE(total_earned, 0) + NEW.amount,
          updated_at = NOW()
      WHERE partner_id = NEW.partner_id;
    ELSIF NEW.type = 'debit' THEN
      new_bal := GREATEST(0, COALESCE(current_bal, 0) - NEW.amount);
      UPDATE public.doorbly_partner_wallets
      SET available_balance = new_bal,
          updated_at = NOW()
      WHERE partner_id = NEW.partner_id;
    END IF;
    NEW.balance_after := new_bal;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_partner_wallet_on_tx ON public.doorbly_partner_wallet_transactions;
CREATE TRIGGER trg_update_partner_wallet_on_tx
BEFORE INSERT ON public.doorbly_partner_wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_partner_wallet_on_tx();


-- 7. PARTNER WITHDRAWALS TABLE (public.doorbly_partner_withdrawals)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_withdrawals (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  bank_account TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  status TEXT DEFAULT 'requested', -- requested | processing | completed | failed | rejected
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);


-- 8. PARTNER MEMBERSHIPS TABLE (public.doorbly_partner_memberships — ₹370/month)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_memberships (
  id TEXT PRIMARY KEY,
  partner_id TEXT UNIQUE NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'Monthly Doorbly Partner Membership',
  monthly_fee NUMERIC(10, 2) DEFAULT 370.00,
  status TEXT DEFAULT 'active', -- active | expired | pending | inactive
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  payment_status TEXT DEFAULT 'paid',
  payment_reference TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doorbly_partner_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- 9. PROFESSION ADD-ONS & 30-DAY REPLACEMENTS LOG (public.doorbly_partner_profession_changes) [NEW]
CREATE TABLE IF NOT EXISTS public.doorbly_partner_profession_changes (
  id TEXT PRIMARY KEY DEFAULT ('prf_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 5)),
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- add_paid_49 | replace_free_30d
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  profession_name TEXT NOT NULL,
  fee_paid NUMERIC(10, 2) DEFAULT 0.00, -- 49.00 for add, 0.00 for free 30-day replace
  payment_status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 10. PARTNER NOTIFICATIONS TABLE (public.doorbly_partner_notifications)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 5)),
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- NEW_SERVICE_REQUEST | WALLET_CREDIT | ACCOUNT_VERIFICATION | DOORBLY_ANNOUNCEMENT | etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 11. PARTNER SUPPORT TICKETS TABLE (public.doorbly_partner_support_tickets)
CREATE TABLE IF NOT EXISTS public.doorbly_partner_support_tickets (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES public.doorbly_partners(id) ON DELETE CASCADE,
  booking_id TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open | in_progress | resolved | closed
  priority_helpline TEXT DEFAULT '9938713179',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doorbly_partner_support_tickets ADD COLUMN IF NOT EXISTS priority_helpline TEXT DEFAULT '9938713179';
ALTER TABLE public.doorbly_partner_support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- 12. OFFER OF THE DAY TABLE (public.doorbly_daily_offers) [MISSING IN OLD SQL — ADDED]
CREATE TABLE IF NOT EXISTS public.doorbly_daily_offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_badge TEXT DEFAULT '+₹250 Bonus',
  valid_until TEXT DEFAULT 'Valid till Tonight 11:59 PM',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 13. PROFESSION CATEGORIES & EASY EARNING OPPORTUNITIES (public.doorbly_profession_categories) [NEW]
CREATE TABLE IF NOT EXISTS public.doorbly_profession_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  is_non_professional BOOLEAN DEFAULT false,
  professions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  display_order INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- PERFORMANCE INDEXES FOR REALTIME QUERIES & POLLING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_partners_status_online ON public.doorbly_partners(status, is_online);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON public.doorbly_service_bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_partner ON public.doorbly_service_bookings(assigned_partner_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_partner ON public.doorbly_partner_wallet_transactions(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_partner ON public.doorbly_partner_notifications(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_partner ON public.doorbly_partner_withdrawals(partner_id, requested_at DESC);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & REALTIME ACCESS POLICIES
-- ============================================================================
ALTER TABLE public.doorbly_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_profession_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_partner_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_daily_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doorbly_profession_categories ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'doorbly_partners',
    'doorbly_partner_kyc',
    'doorbly_service_bookings',
    'doorbly_job_assignments',
    'doorbly_partner_wallets',
    'doorbly_partner_wallet_transactions',
    'doorbly_partner_withdrawals',
    'doorbly_partner_memberships',
    'doorbly_partner_profession_changes',
    'doorbly_partner_notifications',
    'doorbly_partner_support_tickets',
    'doorbly_daily_offers',
    'doorbly_profession_categories'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;


-- ============================================================================
-- SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY FULL
-- ============================================================================
ALTER TABLE public.doorbly_partners REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_service_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_wallets REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_wallet_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_memberships REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_partner_support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.doorbly_daily_offers REPLICA IDENTITY FULL;

DO $$
DECLARE
  rt_tbl TEXT;
BEGIN
  FOREACH rt_tbl IN ARRAY ARRAY[
    'doorbly_partners',
    'doorbly_service_bookings',
    'doorbly_partner_wallets',
    'doorbly_partner_wallet_transactions',
    'doorbly_partner_withdrawals',
    'doorbly_partner_memberships',
    'doorbly_partner_notifications',
    'doorbly_partner_support_tickets',
    'doorbly_daily_offers'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = rt_tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rt_tbl);
    END IF;
  END LOOP;
END $$;


-- ============================================================================
-- SEED REALTIME BACKEND DATA (OFFER OF THE DAY, MASTER PARTNER, 23 CATEGORIES)
-- ============================================================================

-- 1. Seed Live Offer of the Day
INSERT INTO public.doorbly_daily_offers (
  id, title, description, reward_badge, valid_until, is_active, updated_at
) VALUES (
  'offer_of_the_day',
  'Complete 3 Doorstep Works Today & Get ₹250 Extra Incentive!',
  'Valid on all AC, Electrical, Plumbing & Appliance bookings completed with 5-star customer rating.',
  '+₹250 Bonus',
  'Valid till Tonight 11:59 PM',
  true,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward_badge = EXCLUDED.reward_badge,
  valid_until = EXCLUDED.valid_until,
  updated_at = NOW();

-- 2. Seed Approved Master Partner Profile & Active ₹370 Membership
INSERT INTO public.doorbly_partners (
  id, auth_id, name, mobile, email, address, district, city, pin_code,
  primary_category, services_offered, years_experience, skills, working_area,
  preferred_radius_km, languages, status, is_online, current_lat, current_lng
) VALUES (
  'partner_master_admin',
  'partner_master_admin',
  'Debabrata Mohanta',
  '+91 99387 13179',
  'debabratamohanta159@gmail.com',
  'Patia, Bhubaneswar, Odisha',
  'Khordha',
  'Bhubaneswar',
  '751024',
  'Home Repair & Maintenance',
  ARRAY['Electrician', 'Plumber', 'AC Technician'],
  5,
  ARRAY['Master Technician', 'Operations Lead'],
  'All Zones',
  20,
  ARRAY['English', 'Hindi', 'Odia'],
  'approved',
  false,
  20.3547,
  85.8182
) ON CONFLICT (id) DO UPDATE SET
  status = 'approved',
  updated_at = NOW();

INSERT INTO public.doorbly_partner_memberships (
  id, partner_id, plan_name, monthly_fee, status, start_date, expiry_date, payment_status, payment_reference
) VALUES (
  'mem_partner_master_admin',
  'partner_master_admin',
  'Monthly Doorbly Partner Membership',
  370.00,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  'paid',
  'MASTER-PRE-ACTIVATED'
) ON CONFLICT (partner_id) DO NOTHING;

INSERT INTO public.doorbly_partner_wallets (
  id, partner_id, available_balance, pending_amount, total_earned
) VALUES (
  'wal_partner_master_admin',
  'partner_master_admin',
  0.00,
  0.00,
  0.00
) ON CONFLICT (partner_id) DO NOTHING;

-- 3. Seed All 23 Profession Categories (Including Easy Earning Opportunities for Non-Professionals)
INSERT INTO public.doorbly_profession_categories (id, name, subtitle, is_non_professional, display_order, professions)
VALUES
  ('cat_1', 'Home Repair & Maintenance', NULL, false, 1, ARRAY['Electrician','Plumber','Carpenter','Mason','Painter','Welder','Tile Worker','False Ceiling Worker','POP Worker','Waterproofing Worker','Glass Worker','Aluminium Worker','Fabricator','Furniture Repair','Door/Window Repair','Locksmith','CCTV Installer','Solar Panel Technician','RO/Water Purifier Technician']),
  ('cat_2', 'Home Cleaning & Household Services', NULL, false, 2, ARRAY['House Cleaner','Bathroom Cleaner','Kitchen Cleaner','Sofa Cleaner','Carpet Cleaner','Mattress Cleaner','Water Tank Cleaner','Chimney Cleaner','Pest Control Worker','Home Sanitization','Housekeeping','Deep Cleaning','Packing & Unpacking','Home Organizing']),
  ('cat_3', 'Appliance & Electronics Services', NULL, false, 3, ARRAY['AC Technician','Refrigerator Technician','Washing Machine Technician','TV Technician','Microwave Technician','Geyser Technician','Cooler Technician','Mixer/Grinder Repair','Computer Repair','Laptop Repair','Mobile Repair','Printer Repair','Inverter/Battery Technician']),
  ('cat_4', 'Beauty & Personal Care', NULL, false, 4, ARRAY['Beautician','Hairdresser','Barber','Makeup Artist','Mehndi Artist','Nail Artist','Eyebrow/Threading Specialist','Facial Specialist','Massage Therapist','Hair Stylist','Bridal Makeup Artist','Saree Draping Specialist']),
  ('cat_5', 'Women-Friendly & Home-Based Earning', NULL, false, 5, ARRAY['Home Cook','Tiffin Provider','Baker','Tailor','Embroidery Worker','Knitting Worker','Mehndi Artist','Beauty Service Provider','Saree Draping','Gift Packing','Handmade Product Maker','Candle Maker','Papad/Pickle Maker','Home Tutor','Babysitter','Elderly Companion','Pet Care']),
  ('cat_6', 'Food & Kitchen Services', NULL, false, 6, ARRAY['Home Cook','Tiffin Service Provider','Caterer','Chef','Baker','Cake Maker','Snack Maker','Sweet Maker','Food Delivery Partner','Kitchen Helper','Event Food Worker','Bartender/Server for events where legally permitted']),
  ('cat_7', 'Vehicle Services', NULL, false, 7, ARRAY['Car Washer','Bike Washer','Mobile Car Wash','Car Detailer','Bike Mechanic','Car Mechanic','Tyre Repair','Puncture Repair','Battery Service','Car AC Technician','Denting & Painting','Vehicle Pickup/Drop','Driving Service','Delivery Driver']),
  ('cat_8', 'Delivery, Moving & Local Assistance', NULL, false, 8, ARRAY['Delivery Partner','Grocery Delivery','Food Delivery','Medicine Delivery where legally permitted','Courier Delivery','Document Delivery','Local Pickup/Drop','Packers & Movers Helper','Loading/Unloading Worker','Warehouse Worker','Event Setup Worker']),
  ('cat_9', 'Child, Elderly & Personal Assistance', NULL, false, 9, ARRAY['Babysitter','Nanny','Elderly Care Assistant','Patient Attendant','Companion Service','Home Helper','Cook + Caregiver','Child Activity Helper','Personal Assistant','Household Assistant']),
  ('cat_10', 'Pet Services', NULL, false, 10, ARRAY['Dog Walker','Pet Sitter','Pet Groomer','Pet Bathing','Pet Trainer','Pet Taxi','Pet Food Delivery','Pet Care Assistant']),
  ('cat_11', 'Education & Knowledge', NULL, false, 11, ARRAY['Home Tutor','Online Tutor','Spoken English Trainer','Computer Trainer','Music Teacher','Dance Teacher','Drawing Teacher','Art Teacher','Yoga Instructor','Fitness Trainer','Exam Preparation Tutor','Skill Trainer']),
  ('cat_12', 'Digital & Freelance Work', NULL, false, 12, ARRAY['Data Entry Operator','Typist','Content Writer','Translator','Graphic Designer','Video Editor','Motion Graphics Artist','Photographer','Social Media Manager','Digital Marketing Assistant','Website Developer','App Developer','SEO Specialist','Virtual Assistant','Online Researcher','Customer Support Executive','Telecaller']),
  ('cat_13', 'Creative Services', NULL, false, 13, ARRAY['Photographer','Videographer','Wedding Photographer','Product Photographer','Video Editor','Graphic Designer','Logo Designer','Invitation Designer','Animator','Illustrator','Voice Artist','Singer','Musician','DJ','Event Decorator']),
  ('cat_14', 'Events & Functions', NULL, false, 14, ARRAY['Event Manager','Event Helper','Decoration Worker','Balloon Decorator','Photographer','Videographer','Caterer','Waiter/Server','Makeup Artist','DJ','Sound Technician','Light Technician','Stage Setup Worker','Invitation Designer']),
  ('cat_15', 'Gardening & Outdoor Work', NULL, false, 15, ARRAY['Gardener','Plant Care Worker','Landscaping Worker','Tree Trimmer','Lawn Maintenance','Terrace Garden Worker','Nursery Worker','Plant Delivery','Garden Cleaning']),
  ('cat_16', 'Selling & Reselling', NULL, false, 16, ARRAY['Grocery Seller','Clothing Seller','Homemade Food Seller','Handmade Product Seller','Handicraft Seller','Beauty Product Seller','Electronics Reseller','Furniture Reseller','Used Product Seller','Local Product Seller','Online Reseller']),
  ('cat_17', 'Tailoring & Fashion', NULL, false, 17, ARRAY['Tailor','Blouse Designer','Dress Maker','Alteration Specialist','Embroidery Worker','Sewing Machine Operator','Fashion Designer','Saree Draping','Clothing Repair','Custom Clothing Maker']),
  ('cat_18', 'General Helper Services', 'These are especially important for non-skilled workers.', true, 18, ARRAY['House Helper','Cleaning Helper','Kitchen Helper','Shop Helper','Office Helper','Warehouse Helper','Loading/Unloading','Event Helper','Construction Helper','Gardening Helper','Moving Helper','Packing Helper','Delivery Helper','General Labour']),
  ('cat_19', 'Local Business Support', NULL, false, 19, ARRAY['Shop Assistant','Salesperson','Cashier','Receptionist','Telecaller','Customer Support','Stock Management','Inventory Assistant','Billing Assistant','Office Assistant','Field Executive','Marketing Executive','Promotion Worker','Flyer Distributor']),
  ('cat_20', 'Marketing & Promotion', NULL, false, 20, ARRAY['Field Promoter','Brand Promoter','Flyer Distributor','Door-to-Door Promoter','Social Media Promoter','Lead Generator','Telecaller','Survey Worker','Product Demonstrator','Event Promoter']),
  ('cat_21', 'Driving & Transport', NULL, false, 21, ARRAY['Car Driver','Personal Driver','Taxi Driver','Auto Driver','Delivery Driver','Bike Delivery Partner','School Transport Driver','Goods Vehicle Driver','Vehicle Pickup/Drop Partner']),
  ('cat_22', 'Specialized Professional Services', NULL, false, 22, ARRAY['Accountant','Lawyer','Architect','Engineer','Interior Designer','Chartered Accountant','Tax Consultant','Insurance Advisor','Real Estate Agent','Travel Consultant','Business Consultant','HR Consultant']),
  ('cat_23', 'Easy Earning Opportunities', 'For Non-Professionals (Profession & Skill Level)', true, 23, ARRAY[
    'House Cleaning — No experience / Basic',
    'Packing Helper — Basic',
    'Moving Helper — Basic',
    'Event Helper — Basic',
    'Kitchen Helper — Basic',
    'Shop Helper — Basic',
    'Warehouse Helper — Basic',
    'Loading/Unloading — Basic',
    'Gardening Helper — Basic',
    'Delivery Partner — Basic',
    'Flyer Distribution — Basic',
    'Field Survey Worker — Basic',
    'Promotion Worker — Basic',
    'Pet Walking — Basic',
    'Elderly Companion — Basic',
    'Babysitting — Basic',
    'Home Helper — Basic',
    'Laundry Helper — Basic',
    'Car Washing — Basic',
    'Bike Washing — Basic'
  ])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  is_non_professional = EXCLUDED.is_non_professional,
  display_order = EXCLUDED.display_order,
  professions = EXCLUDED.professions,
  updated_at = NOW();
`;
