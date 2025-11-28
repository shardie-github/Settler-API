-- Enable RLS and create policies
-- Migration: enable_rls
-- Description: Row Level Security policies for all tables

BEGIN;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations policies
DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;
CREATE POLICY "Org members can view organization" ON public.organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org owner can update organization" ON public.organizations;
CREATE POLICY "Org owner can update organization" ON public.organizations
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Org owner can delete organization" ON public.organizations;
CREATE POLICY "Org owner can delete organization" ON public.organizations
  FOR DELETE USING (owner_id = auth.uid());

COMMIT;
