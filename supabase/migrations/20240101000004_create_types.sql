-- Create custom types and enums
-- Migration: create_types

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'canceled', 'past_due', 'unpaid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
