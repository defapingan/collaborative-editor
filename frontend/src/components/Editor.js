import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Visualization3D from './Visualization3D';
import { websocketService } from '../services/websocket';
import { documentAPI } from '../services/api';
import { 
  Box, TextField, Button, Paper, Typography, 
  IconButton, CircularProgress, Alert, Grid,
  AppBar, Toolbar, Chip, Avatar, Tooltip
} from '@mui/material';
import {
  ThreeDRotation as ThreeDIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  People as PeopleIcon
} from '@mui/icons-material';

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentState, setDocumentState] = useState({ 
    _id: id, 
    title: '', 
    content: '', 
    version: 1,
    editStats: { totalSaves: 0, paragraphEdits: {} }
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  
  const saveTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 计算当前光标所在的段落
  const getCurrentParagraphId = (text, cursorPos) => {
    if (!text) return 1;
    const paragraphs = text.split(/\n\s*\n/);
    let charCount = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const paraLength = paragraphs[i].length;
      if (cursorPos <= charCount + paraLength + 2) {
        return i + 1;
      }
      charCount += paraLength + 2;
    }
    return paragraphs.length || 1;
  };

  // 加载文档
  useEffect(() => {
    if (id) {
      loadDocument();
    } else {
      setLoading(false);
      setTitle('New Document');
      setContent('');
    }
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (websocketService.isConnected()) {
        websocketService.disconnect();
      }
    };
  }, [id]);

  // WebSocket连接和消息处理
  useEffect(() => {
    if (!id || loading || !user.id) return;
    
    websocketService.connect(id, user.id, user.name || user.email?.split('@')[0] || 'User');
    
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      if (websocketService.isConnected()) {
        websocketService.send({ type: 'heartbeat' });
      }
    }, 25000);
    
    const handleTextUpdate = (message) => {
      if (message.userId !== user.id) {
        setContent(message.content);
        setDocumentState(prev => ({ ...prev, content: message.content, version: message.version }));
      }
    };
    
    const handleUserJoined = (message) => {
      setActiveUsers(prev => {
        if (prev.some(u => u.userId === message.userId)) return prev;
        return [...prev, { userId: message.userId, userName: message.userName || 'User' }];
      });
    };
    
    const handleUserLeft = (message) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== message.userId));
    };
    
    const handleUserList = (message) => {
      if (message.users && Array.isArray(message.users)) {
        setActiveUsers(message.users);
      }
    };
    
    const handleDocumentContent = (message) => {
      if (message.content !== undefined && message.content !== content) {
        setContent(message.content);
        setDocumentState(prev => ({ ...prev, content: message.content, version: message.version }));
        if (message.title) setTitle(message.title);
      }
    };
    
    websocketService.on('text-update', handleTextUpdate);
    websocketService.on('user-joined', handleUserJoined);
    websocketService.on('user-left', handleUserLeft);
    websocketService.on('user-list', handleUserList);
    websocketService.on('document-content', handleDocumentContent);
    
    return () => {
      websocketService.off('text-update', handleTextUpdate);
      websocketService.off('user-joined', handleUserJoined);
      websocketService.off('user-left', handleUserLeft);
      websocketService.off('user-list', handleUserList);
      websocketService.off('document-content', handleDocumentContent);
    };
  }, [id, loading, user.id, user.name]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await documentAPI.getById(id);
      setDocumentState(doc);
      setTitle(doc.title);
      setContent(doc.content || '');
      setAnalyticsData({ 
        documentId: id, 
        title: doc.title, 
        paragraphs: [],
        editStats: doc.editStats || { totalSaves: 0, paragraphEdits: {} }
      });
    } catch (err) {
      console.error('Failed to load document:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = useCallback(async (newContent, newTitle, paragraphId = null) => {
    if (!id) return false;
    try {
      const updateData = {};
      if (newContent !== undefined) updateData.content = newContent;
      if (newTitle !== undefined) updateData.title = newTitle;
      if (paragraphId !== undefined) updateData.paragraphId = paragraphId;
      if (Object.keys(updateData).length === 0) return false;
      
      const result = await documentAPI.update(id, updateData.content, updateData.title);
      setDocumentState(prev => ({ 
        ...prev, 
        ...updateData, 
        version: result.version || prev.version + 1,
        editStats: result.editStats || prev.editStats
      }));
      return true;
    } catch (err) {
      console.error('Failed to save:', err);
      return false;
    }
  }, [id]);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    
    if (websocketService.isConnected() && id) {
      websocketService.sendTextUpdate(newContent, documentState.version + 1);
    }
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
      setSaveMessage('Auto-saved');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 1500);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(content, newTitle);
      setSaveMessage('Auto-saved');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 1000);
  };

  const handleManualSave = async () => {
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSaveMessage('Saving...');
    
    try {
      // 使用 window.document 获取 textarea 元素
      const textareaElement = window.document.querySelector('textarea');
      const cursorPos = textareaElement?.selectionStart || 0;
      const paragraphId = getCurrentParagraphId(content, cursorPos);
      
      const success = await saveDocument(content, title, paragraphId);
      if (success) {
        const newTotalSaves = (documentState.editStats?.totalSaves || 0) + 1;
        setSaveMessage(`Document saved! Total saves: ${newTotalSaves}`);
        setTimeout(() => setSaveMessage(''), 3000);
        // 刷新文档数据以获取最新统计
        await loadDocument();
      } else {
        setError('Failed to save document');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Error saving document: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/manage-documents');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading document...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton onClick={handleBack} edge="start">
            <BackIcon />
          </IconButton>
          
          <TextField
            size="small"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document Title"
            variant="outlined"
            sx={{ mx: 2, width: 300, bgcolor: 'white' }}
          />
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* 显示保存次数 */}
          <Chip
            label={`Saves: ${documentState.editStats?.totalSaves || 0}`}
            size="small"
            sx={{ mr: 2 }}
            variant="outlined"
          />
          
          <Tooltip title={`${activeUsers.length} other users online`}>
            <Chip
              icon={<PeopleIcon />}
              label={activeUsers.length}
              size="small"
              sx={{ mr: 2 }}
              color={activeUsers.length > 0 ? "success" : "default"}
              variant={activeUsers.length > 0 ? "filled" : "outlined"}
            />
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<ThreeDIcon />}
            onClick={() => setShowVisualization(!showVisualization)}
            sx={{ mr: 1 }}
          >
            {showVisualization ? 'Hide 3D' : 'Show 3D'}
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={handleManualSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>
      
      {(saveMessage || error) && (
        <Box sx={{ p: 1, textAlign: 'center' }}>
          {saveMessage && (
            <Typography variant="caption" color="success.main">
              {saveMessage}
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}
      
      {/* 在线用户列表 */}
      <Paper sx={{ p: 1, mx: 2, mt: 1, bgcolor: activeUsers.length > 0 ? '#e8f5e9' : '#f5f5f5' }}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            Online now ({activeUsers.length + 1}):
          </Typography>
          <Chip
            avatar={<Avatar sx={{ width: 24, height: 24, bgcolor: '#3b82f6' }}>
              {(user.name || user.email?.[0] || 'U')[0].toUpperCase()}
            </Avatar>}
            label={`${user.name || user.email?.split('@')[0] || 'You'} (you)`}
            size="small"
            variant="outlined"
            sx={{ borderColor: '#3b82f6', color: '#1e40af' }}
          />
          {activeUsers.filter(u => u.userId !== user.id).map(u => (
            <Chip
              key={u.userId}
              avatar={<Avatar sx={{ width: 24, height: 24, bgcolor: '#4caf50' }}>
                {(u.userName || 'U')[0].toUpperCase()}
              </Avatar>}
              label={u.userName || 'User'}
              size="small"
              variant="outlined"
              sx={{ borderColor: '#4caf50', color: '#2e7d32' }}
            />
          ))}
        </Box>
      </Paper>
      
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', p: 2, position: 'relative' }}>
        {showVisualization ? (
          <Visualization3D documentId={id} />
        ) : (
          <Paper sx={{ flexGrow: 1, position: 'relative', overflow: 'auto' }}>
            <TextField
              fullWidth
              multiline
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing your document here..."
              variant="outlined"
              sx={{
                height: '100%',
                '& .MuiOutlinedInput-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                },
                '& .MuiOutlinedInput-input': {
                  height: '100% !important',
                  minHeight: '500px',
                }
              }}
            />
          </Paper>
        )}
      </Box>
      
      <Paper sx={{ p: 1, mt: 1, borderRadius: 0 }}>
        <Grid container spacing={2}>
          <Grid item xs>
            <Typography variant="caption" color="text.secondary">
              <strong>Real-time Collaboration:</strong> {websocketService.isConnected() ? 'Connected' : 'Disconnected'}
              {websocketService.isConnected() && ` | ${activeUsers.filter(u => u.userId !== user.id).length} other(s) online`}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="caption" color="text.secondary">
              Characters: {content.length} | Paragraphs: {content.split('\n\n').filter(p => p.trim()).length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Editor;