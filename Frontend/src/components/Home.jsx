import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Home.css';

const Home = ({ onSignOut }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const formatTimestamp = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            return new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (_) {
            return 'N/A';
        }
    };

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setIsLoading(false);
    }, []);

    const handleSignOut = async () => {
        try {
            // Call the signout endpoint (no token needed)
            const response = await fetch('http://localhost:3000/api/auth/signout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Clear localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
                // Call onSignOut to redirect to auth page
                onSignOut();
            }
        } catch (error) {
            console.error('Signout error:', error);
            // Clear localStorage anyway
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            onSignOut();
        }
    };

    if (isLoading) {
        return (
            <div className="home-container">
                <div className="loading-card">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="home-container">
                <div className="error-card">
                    <h2>Not Authenticated</h2>
                    <p>Please sign in to access the dashboard.</p>
                    <button onClick={() => onSignOut()} className="auth-button">
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-card">
                <div className="header">
                    <h1>Welcome, {user.name}! 👋</h1>
                    <p className="subtitle">You're successfully signed in to Internal Slack</p>
                </div>

                <div className="user-info">
                    <div className="info-group">
                        <label>Email</label>
                        <span>{user.email}</span>
                    </div>
                    
                    <div className="info-group">
                        <label>Department</label>
                        <span>{user.roles?.department_name || 'N/A'}</span>
                    </div>
                    
                    <div className="info-group">
                        <label>Role</label>
                        <span>{user.roles?.role_name || 'N/A'}</span>
                    </div>
                    
                    <div className="info-group">
                        <label>Status</label>
                        <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="actions-grid">
                        <button className="action-btn" type="button" onClick={() => navigate('/complaint')}>
                            <span className="icon">📝</span>
                            <span>Make Complaint</span>
                        </button>
                        <button className="action-btn" type="button" onClick={() => navigate('/team')}>
                            <span className="icon">👥</span>
                            <span>View Team</span>
                        </button>
                        <button className="action-btn" type="button">
                            <span className="icon">📁</span>
                            <span>Files</span>
                        </button>
                        <button className="action-btn" type="button">
                            <span className="icon">⚙️</span>
                            <span>Settings</span>
                        </button>
                    </div>
                </div>

                <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                        <div className="activity-item">
                            <span className="activity-icon">✅</span>
                            <div className="activity-content">
                                <p>Last signed in</p>
                                <small>{formatTimestamp(user.last_sign_in_at)}</small>
                            </div>
                        </div>
                        <div className="activity-item">
                            <span className="activity-icon">👤</span>
                            <div className="activity-content">
                                <p>Account created</p>
                                <small>{formatTimestamp(user.created_at)}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer">
                    <button onClick={handleSignOut} className="signout-btn">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
