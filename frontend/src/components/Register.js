// frontend/src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            console.log('Registering user:', { email, password });
            
            // 模拟注册成功 - 中期检查用
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
            
            // 存储认证信息
            localStorage.setItem('authToken', 'demo-token-' + Date.now());
            localStorage.setItem('user', JSON.stringify({
                email: email,
                name: email.split('@')[0],
                id: 'user_' + Date.now()
            }));
            
            // 跳转到首页
            navigate('/');
            
        } catch (error) {
            setError(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSwitchToLogin = () => {
        navigate('/login');
    };
    
    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                        Create Account
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                        Join Collaborative Editor
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                            helperText="At least 6 characters"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            variant="outlined"
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
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link 
                                component="button" 
                                variant="body2"
                                onClick={handleSwitchToLogin}
                                sx={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'none'}}
                            >
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
                
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        For demonstration purposes only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Registration is simulated for mid-point check
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}

export default Register;