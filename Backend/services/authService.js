import { supabase } from '../config/supabase.js';
import { createRolesTable } from '../models/roles.js';
import { createUsersTable } from '../models/users.js';

export class AuthService {
  // Ensure tables exist before operations
  static async ensureTablesExist() {
    try {
      console.log('🔄 Ensuring database tables exist...');
      
      // Create roles table first (since users table references it)
      await createRolesTable();
      
      // Create users table
      await createUsersTable();
      
      console.log('✅ Database tables are ready');
    } catch (error) {
      console.error('❌ Failed to create tables:', error.message);
      throw error;
    }
  }

  // Sign up a new user
  static async signUp(userData) {
    const { email, password, name, role_id } = userData;
    
    try {
      // 1. Ensure tables exist before creating user
      await this.ensureTablesExist();
      
      // 2. Create user in Supabase Auth (auth.users table)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          name: name
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(authError.message);
      }

      // 3. Create user in custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email: email,
          name: name,
          role_id: role_id || null,
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        console.error('User table insert error:', userError);
        // If user table insert fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(userError.message);
      }

      console.log('✅ User created successfully:', userData.email);
      
      return {
        success: true,
        user: {
          id: userData.id,
          auth_user_id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role_id: userData.role_id,
          is_active: userData.is_active,
          created_at: userData.created_at
        }
      };

    } catch (error) {
      console.error('Signup failed:', error.message);
      throw error;
    }
  }

  // Sign in user
  static async signIn(email, password) {
    try {
      // Ensure tables exist before signin
      await this.ensureTablesExist();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Get user data from custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (userError) {
        throw new Error('User data not found');
      }

      return {
        success: true,
        user: {
          ...userData,
          session: data.session
        }
      };

    } catch (error) {
      console.error('Signin failed:', error.message);
      throw error;
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Signout failed:', error.message);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      // Ensure tables exist before getting user
      await this.ensureTablesExist();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Get user data from custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Get current user failed:', error.message);
      return null;
    }
  }
}
