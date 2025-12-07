import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Card, CardContent,
  CardActions, Button, Avatar, IconButton, Badge,
  List, ListItem, ListItemAvatar, ListItemText, Divider,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  PersonRemove as KickIcon,
  People as PeopleIcon,
  MoreVert as MoreIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  PersonAdd as InviteIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewerIcon,
  EditNote as EditorIcon,
  Email as EmailIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const SharingWithOthers = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
              { _id: 'collab1', email: 'alice@example.com', status: 'active', joinedAt: '2025-10-16', role: 'editor' },
              { _id: 'collab2', email: 'bob@example.com', status: 'active', joinedAt: '2025-10-17', role: 'viewer' },
              { _id: 'collab3', email: 'charlie@example.com', status: 'kicked', joinedAt: '2025-10-15', role: 'editor' },
            ],
            createdAt: '2025-10-15',
            totalCollaborators: 3,
            activeCollaborators: 2
          },
          { 
            _id: '3', 
            title: 'Research Paper Draft', 
            collaborators: [
              { _id: 'collab4', email: 'david@example.com', status: 'active', joinedAt: '2025-10-08', role: 'admin' },
              { _id: 'collab5', email: 'eve@example.com', status: 'quit', joinedAt: '2025-10-10', role: 'editor' },
            ],
            createdAt: '2025-10-05',
            totalCollaborators: 2,
            activeCollaborators: 1
          },
          { 
            _id: '8', 
            title: 'Team Meeting Agenda', 
            collaborators: [
              { _id: 'collab6', email: 'frank@example.com', status: 'active', joinedAt: '2025-10-22', role: 'viewer' },
              { _id: 'collab7', email: 'grace@example.com', status: 'active', joinedAt: '2025-10-21', role: 'editor' },
              { _id: 'collab8', email: 'henry@example.com', status: 'active', joinedAt: '2025-10-20', role: 'viewer' },
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
      
      showSnackbar(`${userName} has been kicked from the document`, 'info');
    }
  };

  const handleRoleChange = (docId, userId, newRole) => {
    setDocuments(documents.map(doc => {
      if (doc._id === docId) {
        return {
          ...doc,
          collaborators: doc.collaborators.map(collab => {
            if (collab._id === userId) {
              return { ...collab, role: newRole };
            }
            return collab;
          })
        };
      }
      return doc;
    }));
    
    showSnackbar(`User role updated to ${newRole}`, 'success');
  };

  const handleOpenInviteDialog = (docId) => {
    setSelectedDoc(docId);
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('editor');
  };

  const handleInviteUser = () => {
    if (!inviteEmail.trim() || !selectedDoc) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    // 模拟邀请用户
    setDocuments(documents.map(doc => {
      if (doc._id === selectedDoc) {
        const newCollaborator = {
          _id: `new_${Date.now()}`,
          email: inviteEmail,
          status: 'active',
          joinedAt: new Date().toISOString().split('T')[0],
          role: inviteRole
        };
        
        return {
          ...doc,
          collaborators: [...doc.collaborators, newCollaborator],
          totalCollaborators: doc.totalCollaborators + 1,
          activeCollaborators: doc.activeCollaborators + 1
        };
      }
      return doc;
    }));

    showSnackbar(`Invitation sent to ${inviteEmail}`, 'success');
    handleCloseInviteDialog();
  };

  const handleMenuOpen = (event, docId, userId) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(docId);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
    setSelectedUser(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon sx={{ color: '#8b5cf6', fontSize: 16 }} />;
      case 'editor':
        return <EditorIcon sx={{ color: '#3b82f6', fontSize: 16 }} />;
      case 'viewer':
        return <ViewerIcon sx={{ color: '#10b981', fontSize: 16 }} />;
      default:
        return <MoreIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'editor': return '#3b82f6';
      case 'viewer': return '#10b981';
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
              Manage collaborators, control access permissions (Admin/Editor/Viewer), 
              and track collaboration status for your shared documents.
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
                      sx={{ mr: 2 }}
                    />
                    <Button
                      startIcon={<InviteIcon />}
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenInviteDialog(doc._id)}
                      sx={{ 
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' }
                      }}
                    >
                      Invite
                    </Button>
                  </Box>
                  
                  <Button
                    component={Link}
                    to={`/editor/${doc._id}`}
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0, ml: 2 }}
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
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                {getStatusIcon(collab.status)}
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    ml: 0.5,
                                    color: getStatusColor(collab.status),
                                    fontWeight: 500,
                                    mr: 2
                                  }}
                                >
                                  {collab.status.toUpperCase()}
                                </Typography>
                                {getRoleIcon(collab.role)}
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                  <Select
                                    value={collab.role}
                                    onChange={(e) => handleRoleChange(doc._id, collab._id, e.target.value)}
                                    disabled={collab.status !== 'active'}
                                  >
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="editor">Editor</MenuItem>
                                    <MenuItem value="viewer">Viewer</MenuItem>
                                  </Select>
                                </FormControl>
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
                              ml: 1,
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

      {/* 邀请用户对话框 */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <EmailIcon sx={{ mr: 1, color: '#3b82f6' }} />
              <Typography variant="h6">Invite Collaborator</Typography>
            </Box>
            <IconButton onClick={handleCloseInviteDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address to invite"
              sx={{ mb: 3 }}
              helperText="The user will receive an invitation to collaborate on this document"
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                label="Role"
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <MenuItem value="admin">
                  <Box display="flex" alignItems="center">
                    <AdminIcon sx={{ mr: 1, color: '#8b5cf6' }} />
                    <Box>
                      <Typography variant="body1">Admin</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can edit, invite, and manage collaborators
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="editor">
                  <Box display="flex" alignItems="center">
                    <EditorIcon sx={{ mr: 1, color: '#3b82f6' }} />
                    <Box>
                      <Typography variant="body1">Editor</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can edit document content
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="viewer">
                  <Box display="flex" alignItems="center">
                    <ViewerIcon sx={{ mr: 1, color: '#10b981' }} />
                    <Box>
                      <Typography variant="body1">Viewer</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can only view document content
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button 
            onClick={handleInviteUser}
            variant="contained"
            disabled={!inviteEmail.trim()}
            startIcon={<InviteIcon />}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SharingWithOthers;