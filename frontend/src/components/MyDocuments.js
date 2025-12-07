// MyDocuments.js - 完整修复版
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Button, Chip,
  Card, CardContent, CardActions, Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Folder as FolderIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

const MyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      // 模拟数据 - 中期检查用
      setTimeout(() => {
        const mockDocuments = [
          { 
            _id: '1', 
            title: 'Project Final Report', 
            createdAt: '2025-10-15T10:30:00Z',
            updatedAt: '2025-10-20T14:45:00Z',
            content: 'This is the final project report for the collaborative editor project.',
            tags: ['Project', 'Report', 'Important']
          },
          { 
            _id: '2', 
            title: 'Weekly Meeting Notes', 
            createdAt: '2025-10-10T09:15:00Z',
            updatedAt: '2025-10-18T16:20:00Z',
            content: 'Notes from the weekly team meeting discussing project progress.',
            tags: ['Meeting', 'Notes']
          },
          { 
            _id: '3', 
            title: 'Research Paper Draft', 
            createdAt: '2025-10-05T11:00:00Z',
            updatedAt: '2025-10-12T13:30:00Z',
            content: 'Draft of research paper on real-time collaborative editing systems.',
            tags: ['Research', 'Paper', 'Academic']
          },
          { 
            _id: '6', 
            title: 'System Architecture', 
            createdAt: '2025-10-03T14:20:00Z',
            updatedAt: '2025-10-08T11:45:00Z',
            content: 'Document describing the system architecture and components.',
            tags: ['Technical', 'Architecture']
          },
        ];
        setDocuments(mockDocuments);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (window.confirm(`Are you sure you want to delete "${docTitle}"?`)) {
      setDocuments(documents.filter(doc => doc._id !== docId));
      alert(`Document "${docTitle}" deleted (simulated for mid-point check)`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateNew = () => {
    navigate('/manage-documents');
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <Skeleton width={200} />
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3
        }}>
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent>
                <Skeleton variant="text" height={40} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} width="80%" />
              </CardContent>
              <CardActions>
                <Skeleton variant="rectangular" width={80} height={36} />
                <Skeleton variant="rectangular" width={80} height={36} />
              </CardActions>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
          My Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb',
            }
          }}
        >
          Create New
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#e0f2fe', borderLeft: '4px solid #0ea5e9' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <FolderIcon sx={{ mr: 1, color: '#0ea5e9' }} />
          <Typography variant="h6" sx={{ color: '#0369a1' }}>
            Documents Created by You
          </Typography>
        </Box>
        <Typography variant="body1" color="#475569">
          These are documents that you have created. You have full ownership and control over these documents, 
          including the ability to edit, delete, and share them with other users.
        </Typography>
      </Paper>

      {documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <Box mb={3}>
            <FolderIcon sx={{ fontSize: 80, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No documents found
          </Typography>
          <Typography variant="body1" color="#94a3b8" paragraph>
            You haven't created any documents yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{ mt: 2 }}
          >
            Create Your First Document
          </Button>
        </Paper>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3,
          width: '100%'
        }}>
          {documents.map((doc) => (
            <Card key={doc._id} sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '320px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              }
            }}>
              <CardContent sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1,
                      wordBreak: 'break-word',
                      flexGrow: 1
                    }}
                  >
                    {doc.title}
                  </Typography>
                  <Chip 
                    label="Owner" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ flexShrink: 0, ml: 1 }}
                  />
                </Box>
                
                <Box sx={{ flexGrow: 1, mb: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.5'
                    }}
                  >
                    {doc.content}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <TimeIcon sx={{ fontSize: 16, mr: 1, color: '#64748b' }} />
                  <Typography variant="caption" color="#64748b">
                    Updated: {formatDate(doc.updatedAt)}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 'auto' }}>
                  {doc.tags && doc.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        backgroundColor: '#f1f5f9',
                        color: '#475569'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  component={Link}
                  to={`/editor/${doc._id}`}
                  startIcon={<EditIcon />}
                  variant="outlined"
                  size="small"
                >
                  Edit
                </Button>
                <IconButton 
                  onClick={() => handleDelete(doc._id, doc.title)}
                  title="Delete Document"
                  sx={{ 
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#fee2e2'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MyDocuments;