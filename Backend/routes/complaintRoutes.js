import express from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { supabase, createUserClient } from '../config/supabase.js';
import { ensureTablesExist } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET_NAME = 'complaints';

async function ensureBucketExists(bucketName) {
  const { data: list, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const exists = (list || []).some(b => b.name === bucketName);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: '20MB'
    });
    if (createError) throw createError;
  }
}

function getPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

// List all complaints (for now, everyone can see)
router.get('/', async (req, res) => {
  try {
    await ensureTablesExist();
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ complaints: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List complaints created by the authenticated user
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    await ensureTablesExist();
    const me = req.user?.id;
    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ complaints: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create complaint with optional files - requires auth
router.post('/', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    await ensureTablesExist();
    await ensureBucketExists(BUCKET_NAME);

    const {
      department,
      category,
      priority = 'Medium',
      subject,
      description,
      is_anonymous = false,
      // assigned_to is optional for now
      assigned_to = null,
    } = req.body || {};

    if (!department || !category || !subject || !description) {
      return res.status(400).json({ error: 'department, category, subject, and description are required' });
    }

    // Read current user from auth middleware
    const publicUser = req.user;
    if (!publicUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentUserId = publicUser.id;
    const currentRoleId = publicUser.role_id || publicUser.roles?.id || null;

    // Upload files using admin client
    const uploadedUrls = [];
    const files = req.files || [];
    const complaintId = randomUUID();

    for (const file of files) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectPath = `${complaintId}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(objectPath, file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype,
        });
      if (uploadError) throw uploadError;
      uploadedUrls.push(getPublicUrl(objectPath));
    }

    // Insert complaint via per-request user client (RLS applies)
    const token = req.headers.authorization?.split(' ')[1] || null;
    const userClient = createUserClient(token);

    const insertPayload = {
      id: complaintId,
      department_name: department,
      category,
      priority,
      subject,
      description,
      is_anonymous: is_anonymous === 'true' || is_anonymous === true,
      attachments_urls: uploadedUrls,
      role_id: currentRoleId,
      user_id: currentUserId,
      assigned_to,
    };

    const { data, error } = await userClient
      .from('complaints')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ complaint: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
