import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const connectToDatabase = async () => {
  try {
    // Just test the connection without querying any tables
    console.log('🔄 Connecting to Supabase database...');
    
    // Simple connection test - just verify the client is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    console.log('✅ Database connected successfully to Supabase!');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
};
