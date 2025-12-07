import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 组件导入
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import MyDocuments from './components/MyDocuments';
import SharedWithMe from './components/SharedWithMe';
import SharingWithOthers from './components/SharingWithOthers';
import ManageDocuments from './components/ManageDocuments';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a',
      light: '#3b82f6',
      dark: '#1e40af',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
    },
    error: {
      main: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    info: {
      main: '#0ea5e9',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

// 私有路由组件 - 修复版
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // 修改为authToken
  
  console.log('PrivateRoute检查:', { 
    token: token,
    hasToken: !!token,
    path: window.location.pathname 
  });
  
  if (token) {
    return children;
  } else {
    console.log('没有token，重定向到login');
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 需要登录的路由 - 使用Dashboard作为布局 */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/my-documents" />} />
            <Route path="my-documents" element={<MyDocuments />} />
            <Route path="shared-documents" element={<SharedWithMe />} />
            <Route path="sharing-documents" element={<SharingWithOthers />} />
            <Route path="manage-documents" element={<ManageDocuments />} />
          </Route>
          
          {/* 文档编辑器 */}
          <Route path="/editor/:id" element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          } />
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;