import { supabase, createUserClient } from '../config/supabase.js';
import { createUsers } from '../models/users.js';
import { createRoles, getOrCreateRole } from '../models/roles.js';
import { createComplaints } from '../models/complaints.js';
import { createSecurityPolicies } from '../models/security.js';

export async function ensureTablesExist() {
    try {
        await createRoles();
        await createUsers();
        await createComplaints();
        await createSecurityPolicies();
    } catch (error) {
        throw error;
    }
}

export async function signUp(email, password, name, roleName, departmentName) {
    let authUserId = null;
    
    try {
        await ensureTablesExist();

        // Create user in auth.users via admin client
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            if (authError.message.includes('already been registered')) {
                throw new Error('A user with this email address has already been registered');
            }
            throw authError;
        }

        authUserId = authUser.user.id;

        // Get or create the role
        const roleId = await getOrCreateRole(roleName, departmentName);

        // Create user in public.users using admin client (bypasses RLS)
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
            if (authUserId) {
                await supabase.auth.admin.deleteUser(authUserId);
            }
            throw userError;
        }

        // Sign in using a short-lived anon client so we don't mutate the admin client
        const userClient = createUserClient();
        const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (signInError) {
            throw signInError;
        }

        // Get user details with role information (using admin client or user client; admin is fine for now)
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

        const userWithMeta = { ...userDetails, last_sign_in_at: signInData.user?.last_sign_in_at || null };

        return { 
            user: userWithMeta, 
            authUser,
            access_token: signInData.session.access_token
        };
    } catch (error) {
        if (authUserId) {
            try { await supabase.auth.admin.deleteUser(authUserId); } catch {}
        }
        throw error;
    }
}

export async function signIn(email, password) {
    try {
        await ensureTablesExist();

        // Use anon client for sign-in (does not mutate admin client)
        const userClient = createUserClient();
        const { data, error } = await userClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

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

        const userWithMeta = { ...userDetails, last_sign_in_at: data.user?.last_sign_in_at || null };

        return {
            user: userWithMeta,
            access_token: data.session.access_token
        };
    } catch (error) {
        throw error;
    }
}

export async function signOut(accessToken) {
    try {
        return { success: true };
    } catch (error) {
        throw error;
    }
}

export async function getCurrentUser(accessToken) {
    try {
        const userClient = createUserClient(accessToken);
        const { data: { user }, error } = await userClient.auth.getUser();
        if (error) {
            throw error;
        }
        if (!user) {
            throw new Error("User not found");
        }

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

        return { ...userDetails, last_sign_in_at: user?.last_sign_in_at || null };
    } catch (error) {
        throw error;
    }
}
