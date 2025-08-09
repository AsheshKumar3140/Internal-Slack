import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/team - list all users in the same department as the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user; // from middleware; contains id, role_id, etc.
    if (!currentUser?.role_id) {
      return res.status(400).json({ error: 'User role not set' });
    }

    // Find department from the user's role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, role_name, department_name')
      .eq('id', currentUser.role_id)
      .single();

    if (roleError || !role) {
      return res.status(404).json({ error: 'Role not found for user' });
    }

    // Get all role ids that belong to this department
    const { data: deptRoles, error: deptRolesError } = await supabase
      .from('roles')
      .select('id')
      .eq('department_name', role.department_name);

    if (deptRolesError) throw deptRolesError;

    const deptRoleIds = (deptRoles || []).map(r => r.id);
    if (deptRoleIds.length === 0) {
      return res.json({ department: role.department_name, members: [] });
    }

    // Fetch users with role_id in department roles, only active users
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, name, email, is_active, roles:role_id(id, role_name, department_name)')
      .in('role_id', deptRoleIds)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (membersError) throw membersError;

    return res.json({ department: role.department_name, members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
