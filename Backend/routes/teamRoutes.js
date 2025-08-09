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

    // Fetch all users in the same department with their roles
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, name, email, is_active, roles:role_id(id, role_name, department_name)')
      .eq('roles.department_name', role.department_name)
      .order('name', { ascending: true });

    if (membersError) {
      throw membersError;
    }

    return res.json({ department: role.department_name, members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
