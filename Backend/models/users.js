import { supabase } from '../config/supabase.js';

const createUsersTableSQL = `
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const createUsersTable = async () => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createUsersTableSQL });
    
    if (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
    
    console.log('Users table created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Failed to create users table:', error);
    throw error;
  }
};
