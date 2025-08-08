import express from 'express';
import { AuthService } from '../services/authService.js';

const router = express.Router();

// Sign up route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role_id } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // // Validate email format
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid email format'
    //   });
    // }

    // // Validate password strength
    // if (password.length < 6) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Password must be at least 6 characters long'
    //   });
    // }

    const result = await AuthService.signUp({
      email,
      password,
      name,
      role_id
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Signup route error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Sign in route
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await AuthService.signIn(email, password);
    res.json(result);
  } catch (error) {
    console.error('Signin route error:', error.message);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Sign out route
router.post('/signout', async (req, res) => {
  try {
    const result = await AuthService.signOut();
    res.json(result);
  } catch (error) {
    console.error('Signout route error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user route error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
