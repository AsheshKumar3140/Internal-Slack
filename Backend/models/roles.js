import { supabase } from '../config/supabase.js';

const createRolesTableSQL = `
-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const createRolesTable = async () => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createRolesTableSQL });
    
    if (error) {
      console.error('Error creating roles table:', error);
      throw error;
    }
    
    console.log('Roles table created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to create roles table:', error);
    throw error;
  }
};
