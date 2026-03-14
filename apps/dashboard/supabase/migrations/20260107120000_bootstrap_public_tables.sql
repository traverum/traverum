-- Bootstrap: create base tables that later migrations expect.
-- These tables were never created in migration files (legacy setup).
-- Required so 20260107120026 (storage/media) and 20260107121650 (users/partners) can run on a fresh DB.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Partners (referenced by users, and by 121650 trigger)
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  partner_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users (referenced by storage policies in 120026 and by 121650)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_id_key ON public.users(auth_id);

-- Media (120026 enables RLS and creates policies on it)
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  url text NOT NULL,
  experience_id uuid,
  media_type text,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- Experiences (20260108132803 and later add RLS / columns)
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  experience_status text NOT NULL DEFAULT 'active',
  price_cents integer NOT NULL DEFAULT 0,
  allows_requests boolean DEFAULT true,
  location_address text,
  location geography(POINT, 4326),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Experience sessions (20260108132803 adds RLS)
CREATE TABLE IF NOT EXISTS public.experience_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  spots_total integer NOT NULL DEFAULT 0,
  spots_available integer NOT NULL DEFAULT 0,
  session_status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reservations and bookings (20260113115201, 20260113115708 add RLS)
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.experience_sessions(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  participants integer NOT NULL,
  total_cents integer NOT NULL,
  reservation_status text NOT NULL DEFAULT 'pending',
  response_deadline timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.experience_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hotel configs (20260209000002+ add RLS; 20260209000003 alters)
CREATE TABLE IF NOT EXISTS public.hotel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hotel_configs_partner_unique ON public.hotel_configs(partner_id);

-- Distributions (20260209000002+ add RLS; 20260209000003 adds hotel_config_id)
CREATE TABLE IF NOT EXISTS public.distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  commission_supplier integer NOT NULL DEFAULT 80,
  commission_platform integer NOT NULL DEFAULT 8,
  commission_hotel integer NOT NULL DEFAULT 12,
  created_at timestamptz DEFAULT now()
);

-- user_partners (20260209000002 get_user_partner_ids() needs it; 20260210000000 enables RLS)
CREATE TABLE IF NOT EXISTS public.user_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_user_partners_user_id ON public.user_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_user_partners_partner_id ON public.user_partners(partner_id);
