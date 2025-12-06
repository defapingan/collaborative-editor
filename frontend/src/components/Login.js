import React, { useState } from 'react';
import { authAPI } from '../services/api';

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const result = await authAPI.login(email, password);
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            onLogin(result.user);
        } catch (error) {
            setError(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <h2>Login to Collaborative Editor</h2>
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
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                    />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Don't have an account?{' '}
                <button className="link-button" onClick={onSwitchToRegister} disabled={loading}>
                    Register here
                </button>
            </p>
        </div>
    );
}

export default Login;