import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Card, CardContent,
  CardActions, Button, Grid, Avatar, IconButton, Badge,
  List, ListItem, ListItemAvatar, ListItemText, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  PersonRemove as KickIcon,
  People as PeopleIcon,
  MoreVert as MoreIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const SharingWithOthers = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharingDocuments();
  }, []);

  const fetchSharingDocuments = async () => {
    try {
      setLoading(true);
      // 模拟数据 - 中期检查用
      setTimeout(() => {
        const mockDocuments = [
          { 
            _id: '1', 
            title: 'Project Final Report', 
            collaborators: [
              { _id: 'collab1', email: 'alice@example.com', status: 'active', joinedAt: '2025-10-16' },
              { _id: 'collab2', email: 'bob@example.com', status: 'active', joinedAt: '2025-10-17' },
              { _id: 'collab3', email: 'charlie@example.com', status: 'kicked', joinedAt: '2025-10-15' },
            ],
            createdAt: '2025-10-15',
            totalCollaborators: 3,
            activeCollaborators: 2
          },
          { 
            _id: '3', 
            title: 'Research Paper Draft', 
            collaborators: [
              { _id: 'collab4', email: 'david@example.com', status: 'active', joinedAt: '2025-10-08' },
              { _id: 'collab5', email: 'eve@example.com', status: 'quit', joinedAt: '2025-10-10' },
            ],
            createdAt: '2025-10-05',
            totalCollaborators: 2,
            activeCollaborators: 1
          },
          { 
            _id: '8', 
            title: 'Team Meeting Agenda', 
            collaborators: [
              { _id: 'collab6', email: 'frank@example.com', status: 'active', joinedAt: '2025-10-22' },
              { _id: 'collab7', email: 'grace@example.com', status: 'active', joinedAt: '2025-10-21' },
              { _id: 'collab8', email: 'henry@example.com', status: 'active', joinedAt: '2025-10-20' },
            ],
            createdAt: '2025-10-19',
            totalCollaborators: 3,
            activeCollaborators: 3
          },
        ];
        setDocuments(mockDocuments);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to fetch sharing documents:', error);
      setLoading(false);
    }
  };

  const handleKickUser = (docId, userId, userName) => {
    if (window.confirm(`Are you sure you want to kick ${userName} from this document?`)) {
      // 中期检查：暂时只在前端更新状态
      setDocuments(documents.map(doc => {
        if (doc._id === docId) {
          const updatedCollaborators = doc.collaborators.map(collab => {
            if (collab._id === userId) {
              return { ...collab, status: 'kicked' };
            }
            return collab;
          });
          
          const activeCount = updatedCollaborators.filter(c => c.status === 'active').length;
          
          return {
            ...doc,
            collaborators: updatedCollaborators,
            activeCollaborators: activeCount
          };
        }
        return doc;
      }));
      
      alert(`Kicked ${userName} (simulated for mid-point check)`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <ActiveIcon sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'quit':
        return <InactiveIcon sx={{ color: '#ef4444', fontSize: 16 }} />;
      case 'kicked':
        return <InactiveIcon sx={{ color: '#f59e0b', fontSize: 16 }} />;
      default:
        return <MoreIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'quit': return '#ef4444';
      case 'kicked': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
        Sharing with Others
      </Typography>
      
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        backgroundColor: '#fefce8', 
        borderLeft: '4px solid #eab308',
        borderRadius: '8px',
        width: '100%'
      }}>
        <Box display="flex" alignItems="center" mb={1}>
          <PeopleIcon sx={{ mr: 2, color: '#eab308', fontSize: 28 }} />
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ color: '#854d0e' }}>
              Documents You're Sharing
            </Typography>
            <Typography variant="body1" color="#475569">
              These are your documents that you have shared with other users. You can manage collaborators, 
              track their status, and control access permissions from this section.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)'
          },
          gap: 3
        }}>
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent>
                <Typography variant="h6">
                  <Box component="span" sx={{ display: 'block', width: '60%', height: 30, bgcolor: '#e5e7eb' }} />
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center', 
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          width: '100%'
        }}>
          <Box mb={3}>
            <PeopleIcon sx={{ fontSize: 80, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No shared documents
          </Typography>
          <Typography variant="body1" color="#94a3b8" paragraph>
            You haven't shared any documents with others yet.
          </Typography>
          <Typography variant="body2" color="#94a3b8">
            Go to "Manage Documents" to invite others to collaborate on your documents.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {documents.map((doc) => (
            <Card key={doc._id} sx={{ 
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              },
              width: '100%',
              maxWidth: '100%',
              mb: 3
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1e293b',
                        mr: 2,
                        flexGrow: 1
                      }}
                    >
                      {doc.title}
                    </Typography>
                    <Badge 
                      badgeContent={doc.activeCollaborators} 
                      color="primary"
                      sx={{ mr: 2 }}
                    >
                      <PeopleIcon color="action" />
                    </Badge>
                    <Chip 
                      label={`${doc.activeCollaborators} active / ${doc.totalCollaborators} total`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                  
                  <Button
                    component={Link}
                    to={`/editor/${doc._id}`}
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  >
                    Edit Document
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Created on {doc.createdAt}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  Collaborators ({doc.collaborators.length})
                </Typography>
                
                <List sx={{ 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '6px',
                  p: 1
                }}>
                  {doc.collaborators.map((collab, index) => (
                    <React.Fragment key={collab._id}>
                      <ListItem 
                        sx={{ 
                          px: 2,
                          py: 1,
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: '#f3f4f6'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              width: 36, 
                              height: 36,
                              bgcolor: collab.status === 'active' ? '#3b82f6' : '#9ca3af'
                            }}
                          >
                            {collab.email.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                              <Typography variant="body1" sx={{ fontWeight: 500, flexGrow: 1 }}>
                                {collab.email}
                              </Typography>
                              <Box 
                                sx={{ 
                                  ml: 2,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                {getStatusIcon(collab.status)}
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    ml: 0.5,
                                    color: getStatusColor(collab.status),
                                    fontWeight: 500
                                  }}
                                >
                                  {collab.status.toUpperCase()}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={`Joined: ${collab.joinedAt}`}
                        />
                        
                        {collab.status === 'active' && (
                          <IconButton 
                            onClick={() => handleKickUser(doc._id, collab._id, collab.email)}
                            title="Kick User"
                            size="small"
                            sx={{ 
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: '#fee2e2'
                              }
                            }}
                          >
                            <KickIcon />
                          </IconButton>
                        )}
                      </ListItem>
                      {index < doc.collaborators.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SharingWithOthers;