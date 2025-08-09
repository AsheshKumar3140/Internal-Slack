import express from 'express';
import { supabase, createUserClient } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Update display name in public.users
router.put('/name', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id; // public.users.id
    const { name } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', userId)
      .select('id, name, email, is_active, role_id, preferences')
      .single();

    if (error) throw error;
    return res.json({ user: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update password using admin API to avoid missing session issues
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const authUserId = req.user?.auth_user_id; // from middleware
    const { newPassword } = req.body || {};

    if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { error } = await supabase.auth.admin.updateUserById(authUserId, { password: newPassword });
    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update preferences (e.g., theme)
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { theme } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (theme && !['dark', 'light'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const patch = {};
    if (typeof theme === 'string') {
      patch.preferences = { ...req.user.preferences, theme };
    }

    if (!patch.preferences) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(patch)
      .eq('id', userId)
      .select('id, name, email, is_active, role_id, preferences')
      .single();

    if (error) throw error;
    return res.json({ user: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
