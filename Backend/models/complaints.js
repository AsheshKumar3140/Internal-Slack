import { supabase } from '../config/supabase.js';

const createComplaintsTableSQL = `
-- Complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  department_name TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low','Medium','High','Urgent')) DEFAULT 'Medium',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

`;

export async function createComplaints() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createComplaintsTableSQL });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
}
