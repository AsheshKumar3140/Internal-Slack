import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Home.css';

const getStatusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'resolved') return 'resolved';
  if (s === 'in_progress') return 'in_progress';
  if (s === 'closed') return 'closed';
  return 'open';
};

const priorityRank = (p) => {
  const s = (p || '').toLowerCase();
  if (s === 'urgent') return 4;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  if (s === 'low') return 1;
  return 0;
};

const priorityClass = (p) => {
  const s = (p || '').toLowerCase();
  if (s === 'urgent') return 'urgent';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
};

const MyComplaints = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMine = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:3000/api/complaints/mine', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load complaints');
        setComplaints(json.complaints || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMine();
  }, []);

  const sortedComplaints = useMemo(() => {
    const copy = [...complaints];
    copy.sort((a, b) => {
      // Desc by priority; tie-breaker newest first
      const pr = priorityRank(b.priority) - priorityRank(a.priority);
      if (pr !== 0) return pr;
      const at = new Date(a.created_at).getTime() || 0;
      const bt = new Date(b.created_at).getTime() || 0;
      return bt - at;
    });
    return copy;
  }, [complaints]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>My Complaints</h1>
            <p className="subtitle">Your submitted complaints</p>
          </div>
          <button type="button" className="action-btn" onClick={() => navigate('/home')}>
            <span className="icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <div className="team-section">
          {loading && <div className="loading-row">Loading...</div>}
          {error && <div className="error-message" style={{ marginTop: 0 }}>{error}</div>}
          {!loading && !error && (
            <ul className="team-list">
              {sortedComplaints.length === 0 && <li className="team-empty">No complaints yet.</li>}
              {sortedComplaints.map((c) => {
                const isOpen = expanded.has(c.id);
                return (
                  <li
                    key={c.id}
                    className={`team-item complaint-item ${isOpen ? 'is-open' : ''}`}
                    onClick={() => toggle(c.id)}
                  >
                    <div className="complaint-header">
                      <div className="team-name">{c.subject}</div>
                    </div>
                    <div className="complaint-meta">
                      {c.department_name} • {c.category} • <span className={`priority-badge ${priorityClass(c.priority)}`}>{c.priority}</span> • {new Date(c.created_at).toLocaleString()}
                    </div>
                    <div className={`status-badge small complaint-badge ${getStatusClass(c.status)}`}>{(c.status || 'open').replace('_', ' ')}</div>

                    {isOpen && (
                      <div className="complaint-description">
                        {c.description || 'No description provided.'}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;
