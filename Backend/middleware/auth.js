import { supabase } from '../config/supabase.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }

    // Get user data from custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (userError) {
      return res.status(403).json({ 
        success: false,
        message: 'User data not found' 
      });
    }

    // Add user data to request object
    req.user = { ...userData, auth_user_id: user.id };
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication error' 
    });
  }
};
