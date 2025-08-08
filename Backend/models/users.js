import { supabase } from '../config/supabase.js';

const createUsersTable = `
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

export async function createUsers() {
    try {
        // Create the table directly using exec_sql
        // This will work whether the table exists or not (CREATE TABLE IF NOT EXISTS)
        const { error: createError } = await supabase.rpc("exec_sql", { sql: createUsersTable });
        
        if (createError) {
            throw createError;
        }
    } catch (error) {
        throw error;
    }
}
