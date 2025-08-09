import React, { useState, useMemo, useEffect } from 'react';
import '../CSS/Auth.css';

const departments = [
  { value: 'Techlab', label: 'Techlab' },
  { value: 'BPO', label: 'BPO' }
];

const defaultCategories = {
  Techlab: ['Technical Issue', 'Access Request', 'Hardware', 'Other'],
  BPO: ['Process Issue', 'Tool Access', 'Shift/Attendance', 'Other']
};

const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10; // 10 MB per file

const Complaint = () => {
  const [formData, setFormData] = useState({
    department: '',
    category: '',
    priority: 'Medium',
    subject: '',
    description: ''
  });
  const [lockDepartment, setLockDepartment] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [files, setFiles] = useState([]); // File[]

  // Prefill department from logged-in user's profile (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const user = JSON.parse(raw);
      const userDept = user?.roles?.department_name || '';
      if (userDept) {
        setFormData((prev) => ({ ...prev, department: userDept, category: '' }));
        setLockDepartment(true);
      }
    } catch (_) {
      // ignore parse errors
    }
  }, []);

  const categories = useMemo(() => {
    return formData.department ? defaultCategories[formData.department] || [] : [];
  }, [formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const handleFilesChange = (e) => {
    setMessage('');
    setErrors((prev) => ({ ...prev, attachments: '' }));
    const selected = Array.from(e.target.files || []);

    // Validate count
    if (selected.length + files.length > MAX_FILES) {
      setErrors((prev) => ({ ...prev, attachments: `You can upload up to ${MAX_FILES} files.` }));
      return;
    }

    // Validate type and size
    const invalid = selected.find((f) => {
      const isAllowedType = f.type.startsWith('image/') || f.type.startsWith('video/');
      const isAllowedSize = f.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      return !isAllowedType || !isAllowedSize;
    });

    if (invalid) {
      setErrors((prev) => ({
        ...prev,
        attachments: `Only images/videos up to ${MAX_FILE_SIZE_MB}MB are allowed.`
      }));
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFileAt = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      const body = new FormData();
      body.append('department', formData.department);
      body.append('category', formData.category);
      body.append('priority', formData.priority);
      body.append('subject', formData.subject);
      body.append('description', formData.description);
      files.forEach((file) => body.append('attachments', file));

      const response = await fetch('http://localhost:3000/api/complaints', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
          // Note: do NOT set Content-Type for FormData; the browser will set boundary
        },
        body
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data.error || 'Complaint service not available yet.';
        throw new Error(errMsg);
      }

      setIsSuccess(true);
      setMessage('Complaint submitted successfully!');
      setFormData({ department: formData.department, category: '', priority: 'Medium', subject: '', description: '' });
      setFiles([]);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2>Make a Complaint</h2>
        <p className="subtitle">Let us know what went wrong</p>

        {message && (
          <div className={isSuccess ? 'success-message' : 'error-message'} style={{ marginTop: 0 }}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={lockDepartment}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {errors.department && <span className="error-message">{errors.department}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={!formData.department}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief title of your complaint"
            />
            {errors.subject && <span className="error-message">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe the issue in detail"
              rows={5}
              style={{
                padding: '12px 16px',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '16px',
                transition: 'all var(--transition-normal)',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="attachments">Attachments (images/videos)</label>
            <input
              id="attachments"
              name="attachments"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesChange}
              style={{ color: 'var(--text-tertiary)' }}
            />
            {errors.attachments && <span className="error-message">{errors.attachments}</span>}
            {files.length > 0 && (
              <div style={{ marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                <div>Selected files ({files.length}/{MAX_FILES}):</div>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {files.map((f, idx) => (
                    <li key={`${f.name}-${idx}`}>
                      {f.name} — {(f.size / (1024 * 1024)).toFixed(2)} MB
                      <button
                        type="button"
                        onClick={() => removeFileAt(idx)}
                        style={{
                          marginLeft: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--link-color)',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Complaint;
