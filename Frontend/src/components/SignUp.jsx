import React, { useState, useEffect } from 'react';
import '../CSS/Auth.css';

const SignUp = ({ onSwitchToSignIn }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        role: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [roles, setRoles] = useState([]);

    const departments = [
        { value: 'Techlab', label: 'Techlab' },
        { value: 'BPO', label: 'BPO' }
    ];

    const departmentRoles = {
        Techlab: ['software engineer', 'team lead', 'manager', 'admin'],
        BPO: ['agent', 'player', 'admin', 'executives']
    };

    // Load roles when department changes
    useEffect(() => {
        if (formData.department) {
            setRoles(departmentRoles[formData.department]);
            setFormData(prev => ({ ...prev, role: '' })); // Reset role when department changes
        } else {
            setRoles([]);
        }
    }, [formData.department]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } 
        // else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        //     newErrors.email = 'Email is invalid';
        // }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.department) {
            newErrors.department = 'Department is required';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    roleName: formData.role,
                    departmentName: formData.department
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store user data and token (user is now automatically signed in)
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('access_token', data.access_token);

            // Clear form on success
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                department: '',
                role: ''
            });

            alert('Account created and signed in successfully!');
            // You can redirect to dashboard here instead of switching to signin
            // For now, we'll keep the switch to signin for testing
            onSwitchToSignIn();
        } catch (error) {
            console.error('Signup error:', error);
            setErrors({ submit: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card">
                <h2>Create Account</h2>
                <p className="subtitle">Join our team today</p>

                {errors.submit && <div className="error-message">{errors.submit}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

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
                        <label htmlFor="department">Department</label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept.value} value={dept.value}>
                                    {dept.label}
                                </option>
                            ))}
                        </select>
                        {errors.department && <span className="error-message">{errors.department}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={!formData.department}
                        >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                            ))}
                        </select>
                        {errors.role && <span className="error-message">{errors.role}</span>}
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

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        Already have an account?{' '}
                        <button type="button" onClick={onSwitchToSignIn} className="switch-button">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
