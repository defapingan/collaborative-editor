import React, { useState } from 'react';
import { authAPI } from '../services/api';

function Register({ onRegister, onSwitchToLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        setLoading(true);
        
        try {
            const result = await authAPI.register(email, password);
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            onRegister(result.user);
        } catch (error) {
            setError(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email Address:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        disabled={loading}
                    />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
            
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Already have an account?{' '}
                <button className="link-button" onClick={onSwitchToLogin} disabled={loading}>
                    Login here
                </button>
            </p>
        </div>
    );
}

export default Register;