import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Card, CardContent,
  CardActions, Button, Avatar, IconButton,
  List, ListItem, ListItemAvatar, ListItemText, Divider,
  MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar, CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  PersonRemove as KickIcon,
  People as PeopleIcon,
  Cancel as InactiveIcon,
  Circle as CircleIcon,
  PersonAdd as InviteIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewerIcon,
  EditNote as EditorIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { websocketService } from '../services/websocket';

const SharingWithOthers = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 存储每个文档中每个用户的在线状态
  // 结构: { [documentId]: { [userId]: boolean } }
  const [onlineUsersByDoc, setOnlineUsersByDoc] = useState({});
  
  // 踢出确认对话框状态
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);

  useEffect(() => {
    fetchSharingDocuments();
    
    // 获取当前用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // 建立 WebSocket 连接（不加入特定文档，只用于监听全局消息）
    if (user.id && !websocketService.isConnected()) {
      console.log('🔌 SharingWithOthers: Establishing WebSocket connection...');
      // 连接但不加入文档，只用于监听 user-joined/user-left 消息
      websocketService.connect(null, user.id, user.name || user.email?.split('@')[0] || 'User');
    }
    
    // 监听 WebSocket 用户状态变化
    const handleUserJoined = (message) => {
      console.log('🔵 SharingWithOthers received user-joined:', message);
      const { documentId, userId, userName } = message;
      if (documentId) {
        setOnlineUsersByDoc(prev => {
          const newState = {
            ...prev,
            [documentId]: {
              ...(prev[documentId] || {}),
              [userId]: true
            }
          };
          console.log('📊 Updated onlineUsersByDoc (user-joined):', newState);
          return newState;
        });
      }
    };
    
    const handleUserLeft = (message) => {
      console.log('🔴 SharingWithOthers received user-left:', message);
      const { documentId, userId } = message;
      if (documentId) {
        setOnlineUsersByDoc(prev => {
          const newState = {
            ...prev,
            [documentId]: {
              ...(prev[documentId] || {}),
              [userId]: false
            }
          };
          console.log('📊 Updated onlineUsersByDoc (user-left):', newState);
          return newState;
        });
      }
    };
    
    // 监听 document 事件，以便知道哪些文档有活动
    const handleDocumentContent = (message) => {
      console.log('📄 SharingWithOthers received document-content:', message);
      // 可以用来更新文档信息
    };
    
    websocketService.on('user-joined', handleUserJoined);
    websocketService.on('user-left', handleUserLeft);
    websocketService.on('document-content', handleDocumentContent);
    
    // 每5秒检查一次 WebSocket 连接状态并尝试重连
    const connectionCheckInterval = setInterval(() => {
      if (user.id && !websocketService.isConnected()) {
        console.log('🔄 SharingWithOthers: WebSocket disconnected, reconnecting...');
        websocketService.connect(null, user.id, user.name || user.email?.split('@')[0] || 'User');
      }
    }, 10000);
    
    return () => {
      websocketService.off('user-joined', handleUserJoined);
      websocketService.off('user-left', handleUserLeft);
      websocketService.off('document-content', handleDocumentContent);
      clearInterval(connectionCheckInterval);
      // 注意：不要断开连接，因为其他组件可能还在用
    };
  }, []);

  const fetchSharingDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentAPI.getSharingWithOthers();
      console.log('📚 Fetched sharing documents:', docs);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch sharing documents:', error);
      showSnackbar('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 检查特定文档中的特定用户是否在线
  const isUserOnlineInDocument = (documentId, userId) => {
    const isOnline = onlineUsersByDoc[documentId]?.[userId] === true;
    console.log(`🔍 Checking online status - doc:${documentId}, user:${userId}, online:${isOnline}`);
    return isOnline;
  };

  // 打开踢出确认对话框
  const openKickDialog = (docId, collaboratorId, userEmail) => {
    setKickTarget({ docId, collaboratorId, userEmail });
    setKickDialogOpen(true);
  };

  // 执行踢出用户
  const handleKickUser = async () => {
    if (!kickTarget) return;
    try {
      await documentAPI.kickCollaborator(kickTarget.docId, kickTarget.collaboratorId);
      showSnackbar(`${kickTarget.userEmail} has been kicked`, 'info');
      setKickDialogOpen(false);
      setKickTarget(null);
      fetchSharingDocuments();
    } catch (error) {
      showSnackbar('Failed to kick user', 'error');
    }
  };

  const handleRoleChange = async (docId, collaboratorId, newRole) => {
    try {
      await documentAPI.updateCollaborator(docId, collaboratorId, newRole);
      showSnackbar(`User role updated to ${newRole}`, 'success');
      fetchSharingDocuments();
    } catch (error) {
      showSnackbar('Failed to update role', 'error');
    }
  };

  const handleOpenInviteDialog = (doc) => {
    setSelectedDoc(doc);
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('editor');
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedDoc) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    try {
      await documentAPI.share(selectedDoc._id, inviteEmail, inviteRole);
      showSnackbar(`Invitation sent to ${inviteEmail}`, 'success');
      handleCloseInviteDialog();
      fetchSharingDocuments();
    } catch (error) {
      showSnackbar('Failed to send invitation', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusIcon = (status, documentId, userId) => {
    if (status !== 'active') {
      return <InactiveIcon sx={{ color: '#ef4444', fontSize: 16 }} />;
    }
    // 检查该用户在该文档中是否在线
    const online = isUserOnlineInDocument(documentId, userId);
    return online ? 
      <CircleIcon sx={{ color: '#10b981', fontSize: 12 }} /> : 
      <CircleIcon sx={{ color: '#9ca3af', fontSize: 12 }} />;
  };

  const getStatusText = (status, documentId, userId) => {
    if (status !== 'active') return status.toUpperCase();
    return isUserOnlineInDocument(documentId, userId) ? 'ONLINE' : 'OFFLINE';
  };

  const getStatusColor = (status, documentId, userId) => {
    if (status !== 'active') return '#ef4444';
    return isUserOnlineInDocument(documentId, userId) ? '#10b981' : '#9ca3af';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminIcon sx={{ color: '#8b5cf6', fontSize: 16 }} />;
      case 'editor': return <EditorIcon sx={{ color: '#3b82f6', fontSize: 16 }} />;
      default: return <ViewerIcon sx={{ color: '#10b981', fontSize: 16 }} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading shared documents...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
        Sharing with Others
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#fefce8', borderLeft: '4px solid #eab308', borderRadius: '8px' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <PeopleIcon sx={{ mr: 2, color: '#eab308', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#854d0e' }}>
              Documents You're Sharing
            </Typography>
            <Typography variant="body1" color="#475569">
              Manage collaborators and control access permissions. Green dot indicates user is currently online in this document.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <Box mb={3}>
            <PeopleIcon sx={{ fontSize: 80, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No shared documents
          </Typography>
          <Typography variant="body1" color="#94a3b8">
            You haven't shared any documents with others yet.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {documents.map((doc) => (
            <Card key={doc._id} sx={{ mb: 3, transition: 'transform 0.2s' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {doc.title}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={`${doc.collaborators?.filter(c => c.status === 'active').length || 0} active`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Button
                      startIcon={<InviteIcon />}
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenInviteDialog(doc)}
                    >
                      Invite
                    </Button>
                    <Button
                      component={Link}
                      to={`/editor/${doc._id}`}
                      startIcon={<EditIcon />}
                      variant="outlined"
                      size="small"
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Created on {new Date(doc.createdAt).toLocaleDateString()}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Collaborators ({doc.collaborators?.length || 0})
                </Typography>
                
                <List sx={{ backgroundColor: '#f9fafb', borderRadius: '6px', p: 1 }}>
                  {doc.collaborators?.map((collab, index) => (
                    <React.Fragment key={collab.userId}>
                      <ListItem sx={{ px: 2, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: collab.status === 'active' ? '#3b82f6' : '#9ca3af' }}>
                            {collab.email?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                {collab.email}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {getStatusIcon(collab.status, doc._id, collab.userId)}
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: getStatusColor(collab.status, doc._id, collab.userId),
                                    fontWeight: 500,
                                    minWidth: 60
                                  }}
                                >
                                  {getStatusText(collab.status, doc._id, collab.userId)}
                                </Typography>
                              </Box>
                              {getRoleIcon(collab.role)}
                              {collab.status === 'active' && (
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                  <Select
                                    value={collab.role}
                                    onChange={(e) => handleRoleChange(doc._id, collab.userId, e.target.value)}
                                  >
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="editor">Editor</MenuItem>
                                    <MenuItem value="viewer">Viewer</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                            </Box>
                          }
                          secondary={`Joined: ${collab.joinedAt ? new Date(collab.joinedAt).toLocaleDateString() : 'Unknown'}`}
                        />
                        {collab.status === 'active' && (
                          <IconButton 
                            onClick={() => openKickDialog(doc._id, collab.userId, collab.email)}
                            size="small"
                            sx={{ color: '#ef4444' }}
                          >
                            <KickIcon />
                          </IconButton>
                        )}
                      </ListItem>
                      {index < (doc.collaborators?.length || 0) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 邀请对话框 */}
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
            />
            
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={inviteRole} label="Role" onChange={(e) => setInviteRole(e.target.value)}>
                <MenuItem value="admin">Admin - Full control</MenuItem>
                <MenuItem value="editor">Editor - Can edit content</MenuItem>
                <MenuItem value="viewer">Viewer - Read only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button onClick={handleInviteUser} variant="contained" disabled={!inviteEmail.trim()}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* 踢出用户确认对话框 */}
      <Dialog open={kickDialogOpen} onClose={() => setKickDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fef2f2' }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1, color: '#ef4444' }} />
            <Typography variant="h6" sx={{ color: '#dc2626' }}>Kick Collaborator</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to kick <strong>"{kickTarget?.userEmail}"</strong>?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            This user will lose all access to this document and cannot be restored unless re-invited.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setKickDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleKickUser} 
            variant="contained" 
            color="error" 
            startIcon={<KickIcon />}
          >
            Kick User
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SharingWithOthers;