import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        console.log('Login form submitted');
        console.log('Email:', email, 'Password:', password);
        
        setLoading(true);
        setError('');
        
        try {
            // 简单验证
            if (!email || !password) {
                setError('Please enter email and password');
                return;
            }
            
            // 模拟登录 - 中期检查用
            console.log('Logging in with:', { email, password });
            
            // 存储认证信息
            const token = 'demo-token-' + Date.now();
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify({
                email: email,
                name: email.split('@')[0],
                id: 'user_' + Date.now()
            }));
            
            console.log('Login successful, token stored:', token);
            console.log('localStorage内容:');
            console.log('- authToken:', localStorage.getItem('authToken'));
            console.log('- user:', localStorage.getItem('user'));
            
            // 跳转到首页
            navigate('/');
            
            // 备用方案：如果navigate不行，使用强制刷新
            // setTimeout(() => {
            //   window.location.href = '/';
            // }, 100);
            
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSwitchToRegister = () => {
        console.log('Switching to register');
        navigate('/register');
    };
    
    const handleDemoLogin = () => {
        // 一键使用演示账户
        console.log('Using demo account');
        setEmail('demo@example.com');
        setPassword('demo123');
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
                        Collaborative Editor
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
                        Sign in to your account
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
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                            {loading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleDemoLogin}
                            sx={{ mb: 2 }}
                            disabled={loading}
                        >
                            Use Demo Account
                        </Button>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <Link 
                                component="button" 
                                variant="body2"
                                onClick={handleSwitchToRegister}
                                sx={{ cursor: 'pointer', fontWeight: 600 }}
                            >
                                Sign up
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
                
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        For demonstration purposes only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Use any email and password to login
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}

export default Login;