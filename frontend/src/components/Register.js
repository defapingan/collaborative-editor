import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { 
  Container, Box, Typography, TextField, Button, 
  Paper, Alert, Link, CircularProgress
} from '@mui/material';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
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
            
            if (result.token && result.user) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                navigate('/');
            } else {
                setError('Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Email may already exist.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSwitchToLogin = () => {
        navigate('/login');
    };
    
    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                        Create Account
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                        Join Collaborative Editor
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
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            helperText="At least 6 characters"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Account'}
                        </Button>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">
                            Already have an account?{' '}
                            <Link component="button" onClick={handleSwitchToLogin} sx={{ fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Register;