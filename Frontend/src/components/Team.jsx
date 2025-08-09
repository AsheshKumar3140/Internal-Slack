import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Home.css';

const Team = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [department, setDepartment] = useState('');
  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Read current user id from localStorage
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) setCurrentUserId(u.id);
      }
    } catch (_) {
      // ignore parse errors
    }

    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:3000/api/team', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load team');
        setDepartment(json.department || '');
        setMembers(json.members || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const sortedMembers = useMemo(() => {
    const copy = [...members];
    copy.sort((a, b) => {
      const aIsMe = a.id === currentUserId ? 1 : 0;
      const bIsMe = b.id === currentUserId ? 1 : 0;
      if (aIsMe !== bIsMe) return bIsMe - aIsMe; // put "me" first
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
    return copy;
  }, [members, currentUserId]);

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Team</h1>
            <p className="subtitle">Department {department ? `— ${department}` : ''}</p>
          </div>
          <button type="button" className="action-btn" onClick={() => navigate('/home')}>
            <span className="icon">←</span>
            <span>Back</span>
          </button>
        </div>

        <div className="team-section">
          {loading && <div className="loading-row">Loading team...</div>}
          {error && <div className="error-message" style={{ marginTop: 0 }}>{error}</div>}
          {!loading && !error && (
            <ul className="team-list">
              {sortedMembers.length === 0 && <li className="team-empty">No members found.</li>}
              {sortedMembers.map((m) => (
                <li key={m.id} className="team-item">
                  <div className="avatar-circle">{(m.name || 'U').slice(0,1).toUpperCase()}</div>
                  <div className="team-meta">
                    <div className="team-name">
                      {m.name || 'Unnamed'}
                      {currentUserId === m.id && <span className="you-badge">You</span>}
                    </div>
                    <div className="team-role">{m.roles?.role_name || 'Role'}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;
