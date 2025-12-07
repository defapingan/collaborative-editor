import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Visualization3D from './Visualization3D';
import { 
  Box, TextField, Button, Paper, Typography, 
  IconButton, CircularProgress, Alert, Grid, Card, CardContent
} from '@mui/material';
import {
  ThreeDRotation as ThreeDIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState({ 
    _id: id, 
    title: `Document ${id || 'New'}`, 
    content: '', 
    version: 1 
  });
  const [title, setTitle] = useState(`Document ${id || 'New'}`);
  const [content, setContent] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const contentRef = useRef('');
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('Editor mounted, document ID:', id);
    
    if (id) {
      // 模拟加载文档数据
      setLoading(true);
      setTimeout(() => {
        const mockContent = `This is the content for document ${id}. 

You can edit this text in real-time.

Multiple users can collaborate on this document simultaneously.

Each paragraph will be tracked for 3D visualization analysis.

---
Sample paragraphs for demonstration:

1. Introduction to Collaborative Editing
Real-time collaborative editing allows multiple users to work on the same document simultaneously. This technology enables teams to collaborate more efficiently.

2. Technical Implementation
The system uses WebSocket for real-time communication and operational transformation algorithms for conflict resolution. Each edit is tracked and synchronized across all connected clients.

3. 3D Visualization Features
The 3D visualization system analyzes editing patterns across different paragraphs and users. It helps identify collaboration hotspots and editing frequencies.

4. Version Control
Every change is tracked and can be reverted. The system maintains a complete history of all edits with timestamps and user attribution.

5. Future Enhancements
Potential future features include AI-assisted editing, template systems, and advanced analytics dashboards.`;
        
        setTitle(`Document ${id}`);
        setContent(mockContent);
        setLoading(false);
        
        // 模拟分析数据
        setAnalyticsData({
          documentId: id,
          title: `Document ${id}`,
          paragraphs: [
            { id: 1, position: 1, length: 150, totalEdits: 25, userEdits: [{ userId: 'user1', editCount: 10 }, { userId: 'user2', editCount: 15 }] },
            { id: 2, position: 2, length: 200, totalEdits: 18, userEdits: [{ userId: 'user1', editCount: 8 }, { userId: 'user2', editCount: 10 }] },
            { id: 3, position: 3, length: 120, totalEdits: 32, userEdits: [{ userId: 'user1', editCount: 20 }, { userId: 'user3', editCount: 12 }] },
            { id: 4, position: 4, length: 180, totalEdits: 15, userEdits: [{ userId: 'user2', editCount: 15 }] },
            { id: 5, position: 5, length: 90, totalEdits: 8, userEdits: [{ userId: 'user3', editCount: 5 }, { userId: 'user4', editCount: 3 }] },
          ],
          users: [
            { id: 'user1', name: 'Alice', email: 'alice@example.com' },
            { id: 'user2', name: 'Bob', email: 'bob@example.com' },
            { id: 'user3', name: 'Charlie', email: 'charlie@example.com' },
            { id: 'user4', name: 'Diana', email: 'diana@example.com' },
          ]
        });
      }, 1000);
    }
    
    // 设置自动保存
    contentRef.current = content;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (content.trim() && content !== contentRef.current) {
        autoSave();
      }
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, content]);

  const autoSave = async () => {
    if (!content.trim()) return;
    
    try {
      console.log('Auto-saving document:', { id, title, contentLength: content.length });
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveMessage('Auto-saved at ' + new Date().toLocaleTimeString());
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleSaveDocument = async () => {
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSaveMessage('Saving...');
    
    try {
      console.log('Saving document:', { id, title, contentLength: content.length });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage('Document saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      // 如果是新文档，更新ID
      if (!id) {
        const newId = 'doc_' + Date.now();
        setDocument({ ...document, _id: newId });
        navigate(`/editor/${newId}`, { replace: true });
      }
    } catch (error) {
      setError('Error saving document: ' + error.message);
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/my-documents');
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <IconButton onClick={handleBack} title="Back to Documents">
              <BackIcon />
            </IconButton>
          </Grid>
          
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                }
              }}
            />
          </Grid>
          
          <Grid item>
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
              onClick={handleSaveDocument}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
        
        {(saveMessage || error) && (
          <Box sx={{ mt: 1 }}>
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
      </Paper>

      {/* 主内容区域 */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {showVisualization ? (
          <Box sx={{ width: '100%', height: '100%' }}>
            <Visualization3D 
              documentId={id || document._id}
              analyticsData={analyticsData}
            />
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', p: 2 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                <TextField
                  fullWidth
                  multiline
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start typing your document here...

You can collaborate in real-time with others.
Each paragraph will be tracked for 3D visualization."
                  variant="outlined"
                  sx={{
                    height: '100%',
                    '& .MuiOutlinedInput-root': {
                      height: '100%',
                      alignItems: 'flex-start',
                    },
                    '& .MuiOutlinedInput-input': {
                      height: '100% !important',
                      minHeight: '500px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* 状态栏 */}
      <Paper sx={{ 
        p: 1, 
        mt: 1, 
        backgroundColor: '#f1f5f9',
        borderTop: '1px solid #e2e8f0'
      }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs>
            <Typography variant="caption" color="text.secondary">
              <strong>Real-time Collaboration:</strong> {id ? 'Simulated (Mid-point Demo)' : 'Create and save to enable'}
              {id && ' | Auto-save enabled'}
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