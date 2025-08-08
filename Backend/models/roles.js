import { supabase } from '../config/supabase.js';

const createRolesTable = `
    CREATE TABLE IF NOT EXISTS public.roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_name VARCHAR(100) NOT NULL,
        department_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(role_name, department_name)
    );
`;

export async function createRoles() {
    try {
        // Create the table directly using exec_sql
        // This will work whether the table exists or not (CREATE TABLE IF NOT EXISTS)
        const { error: createError } = await supabase.rpc("exec_sql", { sql: createRolesTable });
        
        if (createError) {
            throw createError;
        }
    } catch (error) {
        throw error;
    }
}

// Function to get or create a role
export async function getOrCreateRole(roleName, departmentName) {
    try {
        // First, try to find existing role
        const { data: existingRole, error: findError } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', roleName)
            .eq('department_name', departmentName)
            .single();

        if (existingRole) {
            return existingRole.id;
        }

        // If role doesn't exist, create it
        const { data: newRole, error: createError } = await supabase
            .from('roles')
            .insert({
                role_name: roleName,
                department_name: departmentName
            })
            .select('id')
            .single();

        if (createError) {
            throw createError;
        }

        return newRole.id;
    } catch (error) {
        throw error;
    }
}

// Function to get roles by department
export async function getRolesByDepartment(departmentName) {
    try {
        const { data, error } = await supabase
            .from('roles')
            .select('id, role_name')
            .eq('department_name', departmentName)
            .order('role_name');

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
}
