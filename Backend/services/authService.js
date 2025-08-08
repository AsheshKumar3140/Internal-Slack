import { supabase } from '../config/supabase.js';
import { createUsers } from '../models/users.js';
import { createRoles, getOrCreateRole } from '../models/roles.js';

export async function ensureTablesExist() {
    try {
        // Create roles table FIRST (since users table references it)
        await createRoles();
        
        // Then create users table
        await createUsers();
    } catch (error) {
        throw error;
    }
}

export async function signUp(email, password, name, roleName, departmentName) {
    let authUserId = null;
    
    try {
        await ensureTablesExist();

        // Create user in auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            // Handle specific error cases
            if (authError.message.includes('already been registered')) {
                throw new Error('A user with this email address has already been registered');
            }
            
            throw authError;
        }

        authUserId = authUser.user.id;

        // Get or create the role
        const roleId = await getOrCreateRole(roleName, departmentName);

        // Create user in public.users
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                auth_user_id: authUserId,
                email,
                name,
                role_id: roleId,
                is_active: true
            })
            .select()
            .single();

        if (userError) {
            // Clean up: delete the auth user if public.users insert failed
            if (authUserId) {
                await supabase.auth.admin.deleteUser(authUserId);
            }
            
            throw userError;
        }

        // Automatically sign in the user after successful signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            throw signInError;
        }

        // Get user details with role information
        const { data: userDetails, error: userDetailsError } = await supabase
            .from('users')
            .select(`
                *,
                roles:role_id (
                    role_name,
                    department_name
                )
            `)
            .eq('auth_user_id', authUserId)
            .single();

        if (userDetailsError) {
            throw userDetailsError;
        }

        return { 
            user: userDetails, 
            authUser,
            access_token: signInData.session.access_token
        };
    } catch (error) {
        // Clean up: delete the auth user if something went wrong
        if (authUserId) {
            try {
                await supabase.auth.admin.deleteUser(authUserId);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
        
        throw error;
    }
}

export async function signIn(email, password) {
    try {
        await ensureTablesExist();

        // Use the standard signInWithPassword method
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        // Get user details from public.users
        const { data: userDetails, error: userError } = await supabase
            .from('users')
            .select(`
                *,
                roles:role_id (
                    role_name,
                    department_name
                )
            `)
            .eq('auth_user_id', data.user.id)
            .single();

        if (userError) {
            throw userError;
        }

        return {
            user: userDetails,
            access_token: data.session.access_token
        };
    } catch (error) {
        throw error;
    }
}

export async function signOut(accessToken) {
    try {
        const { error } = await supabase.auth.admin.signOut(accessToken);
        if (error) {
            throw error;
        }
        return { success: true };
    } catch (error) {
        throw error;
    }
}

export async function getCurrentUser(accessToken) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (error) {
            throw error;
        }

        if (!user) {
            throw new Error("User not found");
        }

        // Get user details from public.users
        const { data: userDetails, error: userError } = await supabase
            .from('users')
            .select(`
                *,
                roles:role_id (
                    role_name,
                    department_name
                )
            `)
            .eq('auth_user_id', user.id)
            .single();

        if (userError) {
            throw userError;
        }

        return userDetails;
    } catch (error) {
        throw error;
    }
}
