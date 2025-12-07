import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Box, IconButton, Avatar, CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Description as DocumentIcon,
  Group as GroupIcon,
  Share as ShareIcon,
  Settings as ManageIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 获取当前用户信息
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // 这里应该从token或API获取用户信息
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // 模拟用户数据 - 中期检查用
        setUser({ email: 'test@example.com', name: 'Test User' });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [navigate]);

  const menuItems = [
    { text: 'My Documents', icon: <DocumentIcon />, path: '/my-documents' },
    { text: 'Shared with Me', icon: <ShareIcon />, path: '/shared-documents' },
    { text: 'Sharing with Others', icon: <GroupIcon />, path: '/sharing-documents' },
    { text: 'Manage Documents', icon: <ManageIcon />, path: '/manage-documents' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* 顶部导航栏 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1e3a8a' // 深蓝色
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen(!drawerOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Collaborative Document Editor
          </Typography>
          
          {user && (
            <Box display="flex" alignItems="center">
              <Avatar 
                sx={{ 
                  mr: 2, 
                  bgcolor: '#3b82f6',
                  width: 36,
                  height: 36
                }}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 2,
                  fontWeight: 500
                }}
              >
                {user.email || 'User'}
              </Typography>
            </Box>
          )}
          
          <IconButton 
            color="inherit" 
            onClick={handleLogout} 
            title="Logout"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 侧边栏菜单 */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? 240 : 60,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? 240 : 60,
            boxSizing: 'border-box',
            marginTop: '64px',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
          },
        }}
        open={drawerOpen}
      >
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: '#e2e8f0',
                },
                '&.active': {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawerOpen && (
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 500,
                      fontSize: '0.9rem',
                    }
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* 主内容区域 */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f1f5f9',
          transition: 'margin-left 0.3s ease',
          marginLeft: drawerOpen ? '240px' : '60px',
        }}
      >
        <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;