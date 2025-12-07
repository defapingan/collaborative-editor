import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Chip, Card, CardContent,
  CardActions, Button, Grid, Avatar, Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  ExitToApp as QuitIcon,
  Person as PersonIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const SharedWithMe = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      // 模拟数据 - 中期检查用
      setTimeout(() => {
        const mockDocuments = [
          { 
            _id: '4', 
            title: 'Team Project Documentation', 
            owner: { 
              _id: 'user1',
              email: 'alice.smith@example.com',
              name: 'Alice Smith'
            },
            sharedAt: '2025-10-18T15:30:00Z',
            canEdit: true,
            permissions: ['edit', 'comment'],
            description: 'Team project documentation for the software development course.'
          },
          { 
            _id: '5', 
            title: 'Group Assignment - Final Submission', 
            owner: { 
              _id: 'user2',
              email: 'bob.johnson@example.com',
              name: 'Bob Johnson'
            },
            sharedAt: '2025-10-12T11:20:00Z',
            canEdit: true,
            permissions: ['edit'],
            description: 'Final submission for the group assignment on database systems.'
          },
          { 
            _id: '7', 
            title: 'Research Collaboration', 
            owner: { 
              _id: 'user3',
              email: 'carol.williams@example.com',
              name: 'Carol Williams'
            },
            sharedAt: '2025-10-20T09:45:00Z',
            canEdit: false,
            permissions: ['view'],
            description: 'Research collaboration paper on machine learning algorithms.'
          },
        ];
        setDocuments(mockDocuments);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
      setLoading(false);
    }
  };

  const handleQuit = async (docId, docTitle) => {
    if (window.confirm(`Are you sure you want to quit "${docTitle}"?`)) {
      // 中期检查：暂时只在前端移除
      setDocuments(documents.filter(doc => doc._id !== docId));
      alert(`Successfully quit "${docTitle}" (simulated for mid-point check)`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPermissionLabel = (permissions) => {
    if (permissions.includes('edit')) return 'Can Edit';
    if (permissions.includes('comment')) return 'Can Comment';
    if (permissions.includes('view')) return 'View Only';
    return 'No Access';
  };

  const getPermissionColor = (permissions) => {
    if (permissions.includes('edit')) return 'success';
    if (permissions.includes('comment')) return 'warning';
    if (permissions.includes('view')) return 'info';
    return 'default';
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <Skeleton width={300} />
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={40} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="circular" width={40} height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
        Documents Shared with Me
      </Typography>
      
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        backgroundColor: '#f0f9ff', 
        borderLeft: '4px solid #0284c7',
        borderRadius: '8px'
      }}>
        <Box display="flex" alignItems="center" mb={1}>
          <ShareIcon sx={{ mr: 2, color: '#0284c7', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#0369a1' }}>
              Shared Documents Access
            </Typography>
            <Typography variant="body1" color="#475569">
              These documents have been shared with you by other users. Your access level may vary from 
              view-only to full editing capabilities based on the permissions granted by the document owner.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {documents.length === 0 ? (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center', 
          backgroundColor: '#f8fafc',
          borderRadius: '12px'
        }}>
          <Box mb={3}>
            <ShareIcon sx={{ fontSize: 80, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No shared documents
          </Typography>
          <Typography variant="body1" color="#94a3b8" paragraph>
            No one has shared any documents with you yet.
          </Typography>
          <Typography variant="body2" color="#94a3b8">
            Ask your colleagues to share documents with you via email invitation.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fill, minmax(300px, 1fr))',
            sm: 'repeat(auto-fill, minmax(320px, 1fr))',
            md: 'repeat(auto-fill, minmax(340px, 1fr))'
          },
          gap: 3,
          width: '100%'
        }}>
          {documents.map((doc) => (
            <Card key={doc._id} sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '300px',
              minHeight: '320px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1,
                      wordBreak: 'break-word'
                    }}
                  >
                    {doc.title}
                  </Typography>
                  <Chip 
                    label={getPermissionLabel(doc.permissions)}
                    size="small"
                    color={getPermissionColor(doc.permissions)}
                    variant="outlined"
                  />
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 3,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {doc.description}
                </Typography>
                
                <Box sx={{ 
                  backgroundColor: '#f8fafc', 
                  p: 2, 
                  borderRadius: '6px',
                  mb: 2
                }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1.5,
                        bgcolor: '#3b82f6',
                        fontSize: '0.875rem'
                      }}
                    >
                      {doc.owner.name ? doc.owner.name.charAt(0).toUpperCase() : 'O'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {doc.owner.name || doc.owner.email}
                      </Typography>
                      <Typography variant="caption" color="#64748b">
                        Owner
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mt={2}>
                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: '#64748b' }} />
                    <Typography variant="caption" color="#64748b">
                      Shared on: {formatDate(doc.sharedAt)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  component={Link}
                  to={`/editor/${doc._id}`}
                  startIcon={<EditIcon />}
                  variant="outlined"
                  size="small"
                  disabled={!doc.canEdit}
                >
                  {doc.canEdit ? 'Edit' : 'View'}
                </Button>
                
                <IconButton 
                  onClick={() => handleQuit(doc._id, doc.title)}
                  title="Quit Document"
                  sx={{ 
                    color: '#f59e0b',
                    '&:hover': {
                      backgroundColor: '#fef3c7'
                    }
                  }}
                >
                  <QuitIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SharedWithMe;