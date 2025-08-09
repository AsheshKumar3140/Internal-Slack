import React, { useState } from 'react';
import '../CSS/Auth.css';

const SignIn = ({ onSwitchToSignUp, onAuthSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setSuccessMsg('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});
        setSuccessMsg('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signin failed');

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('access_token', data.access_token);

            setFormData({ email: '', password: '' });
            setSuccessMsg('Signed in successfully!');

            // Wait briefly so the success message is visible, then navigate
            setTimeout(() => {
                onAuthSuccess();
            }, 1000);
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card">
                <h2>Welcome Back</h2>
                <p className="subtitle">Sign in to your account</p>

                {errors.submit && <div className="error-message">{errors.submit}</div>}
                {successMsg && <div className="success-message">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        Don't have an account?{' '}
                        <button type="button" onClick={onSwitchToSignUp} className="switch-button">
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
