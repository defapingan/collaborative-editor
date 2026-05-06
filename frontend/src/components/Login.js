import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Alert, Link, CircularProgress
} from '@mui/material';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (!email || !password) {
                setError('Please enter email and password');
                setLoading(false);
                return;
            }
            
            const result = await authAPI.login(email, password);
            
            if (result.token && result.user) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                navigate('/');
            } else {
                setError('Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSwitchToRegister = () => {
        navigate('/register');
    };
    
    const handleDemoLogin = async () => {
        setLoading(true);
        try {
            const result = await authAPI.login('demo@example.com', 'demo123');
            if (result.token && result.user) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                navigate('/');
            }
        } catch (err) {
            // 如果demo用户不存在，尝试注册
            try {
                const registerResult = await authAPI.register('demo@example.com', 'demo123');
                if (registerResult.token && registerResult.user) {
                    localStorage.setItem('authToken', registerResult.token);
                    localStorage.setItem('user', JSON.stringify(registerResult.user));
                    navigate('/');
                }
            } catch (regErr) {
                setError('Demo login failed. Please register first.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                        Collaborative Editor
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                        Sign in to your account
                    </Typography>
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleDemoLogin}
                            disabled={loading}
                        >
                            Use Demo Account
                        </Button>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                            Don't have an account?{' '}
                            <Link component="button" onClick={handleSwitchToRegister} sx={{ fontWeight: 600 }}>
                                Sign up
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Login;