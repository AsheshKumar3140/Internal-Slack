import express from 'express';
import { signUp, signIn, signOut, getCurrentUser } from '../services/authService.js';
import { getRolesByDepartment } from '../models/roles.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get roles by department
router.get('/roles/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const roles = await getRolesByDepartment(department);
        res.json({ roles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, roleName, departmentName } = req.body;

        // Validation
        if (!email || !password || !name || !roleName || !departmentName) {
            return res.status(400).json({ 
                error: 'Email, password, name, role, and department are required' 
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

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const result = await signUp(email, password, name, roleName, departmentName);
        res.status(201).json({ 
            message: 'Account created and signed in successfully',
            user: result.user,
            access_token: result.access_token
        });
    } catch (error) {
        // Handle specific error cases
        if (error.message.includes('already been registered')) {
            return res.status(409).json({ 
                error: 'A user with this email address has already been registered' 
            });
        }
        
        if (error.message.includes('Invalid email')) {
            return res.status(400).json({ 
                error: 'Invalid email format' 
            });
        }
        
        // Generic error
        res.status(500).json({ 
            error: error.message || 'An error occurred during signup' 
        });
    }
});

// Sign in
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await signIn(email, password);
        res.json({ 
            message: 'Signed in successfully',
            user: result.user,
            access_token: result.access_token
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Sign out
router.post('/signout', async (req, res) => {
    try {
        // For client-side tokens, we just return success
        // The client will clear the token from localStorage
        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const user = await getCurrentUser(token);
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
