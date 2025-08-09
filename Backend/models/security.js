import { supabase } from '../config/supabase.js';

const securitySQL = `
-- Helpers (idempotent via CREATE OR REPLACE)
create or replace function public.current_user_public_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
$$;

create or replace function public.current_user_role_and_dept()
returns table(role_id uuid, role_name text, department_name text, public_user_id uuid)
language sql
security definer
set search_path = public
as $$
  select r.id, r.role_name, r.department_name, u.id
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid()
$$;

-- Enable RLS on target tables
alter table if exists public.users enable row level security;
alter table if exists public.roles enable row level security;
alter table if exists public.complaints enable row level security;

-- users policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_self'
  ) THEN
    CREATE POLICY users_select_self
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Drop any previous recursive policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_same_department'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_department ON public.users';
  END IF;
END $$;

-- roles policies (readable by signed-in users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'roles_select_all'
  ) THEN
    CREATE POLICY roles_select_all
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- complaints policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'complaints' AND policyname = 'complaints_select_all'
  ) THEN
    CREATE POLICY complaints_select_all
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'complaints' AND policyname = 'complaints_insert_by_role_and_dept'
  ) THEN
    CREATE POLICY complaints_insert_by_role_and_dept
    ON public.complaints
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.current_user_role_and_dept() AS cur
        WHERE cur.public_user_id = public.complaints.user_id
          AND cur.department_name = public.complaints.department_name
          AND cur.role_name IN ('Employee','Manager')
      )
    );
  END IF;
END $$;
`;

export async function createSecurityPolicies() {
  const { error } = await supabase.rpc('exec_sql', { sql: securitySQL });
  if (error) throw error;
}
