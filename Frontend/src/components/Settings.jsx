import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Auth.css';

const Settings = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [theme, setTheme] = useState('dark');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setName(u?.name || '');
        const t = u?.preferences?.theme || 'dark';
        setTheme(t);
        applyTheme(t);
      }
    } catch (_) {}
  }, []);

  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t; // simple hook for future
  };

  const updateName = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ name })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update name');
      const raw = localStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : {};
      const updated = { ...u, name: json.user?.name || name };
      localStorage.setItem('user', JSON.stringify(updated));
      setMsg('Name updated successfully');
    } catch (e) {
      setErr(e.message);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!password || password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ newPassword: password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update password');
      setMsg('Password updated successfully');
      setPassword('');
      setConfirm('');
    } catch (e) {
      setErr(e.message);
    }
  };

  const updateTheme = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ theme })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update theme');
      const raw = localStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : {};
      const updated = { ...u, preferences: { ...(u.preferences || {}), theme } };
      localStorage.setItem('user', JSON.stringify(updated));
      applyTheme(theme);
      setMsg('Theme updated');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2>Settings</h2>
        <p className="subtitle">Manage your profile</p>

        {err && <div className="error-message">{err}</div>}
        {msg && <div className="success-message">{msg}</div>}

        <form onSubmit={updateName} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Display Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <button className="auth-button" type="submit">Update Name</button>
        </form>

        <form onSubmit={updatePassword} className="auth-form" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label htmlFor="pass">New Password</label>
            <input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />
          </div>
          <button className="auth-button" type="submit">Update Password</button>
        </form>

        <form onSubmit={updateTheme} className="auth-form" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <button className="auth-button" type="submit">Save Theme</button>
        </form>

        <div className="auth-switch">
          <button className="switch-button" type="button" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
