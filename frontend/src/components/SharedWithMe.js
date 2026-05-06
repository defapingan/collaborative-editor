import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Card, CardContent,
  CardActions, Button, Avatar, IconButton,
  Grid, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  ExitToApp as QuitIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';

const SharedWithMe = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quitDialog, setQuitDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentAPI.getSharedWithMe();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
      showSnackbar('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openQuitDialog = (doc) => {
    setSelectedDoc(doc);
    setQuitDialog(true);
  };

  const handleQuit = async () => {
    if (!selectedDoc) return;
    try {
      await documentAPI.quit(selectedDoc._id);
      showSnackbar(`Quit "${selectedDoc.title}"`, 'success');
      setQuitDialog(false);
      setSelectedDoc(null);
      fetchSharedDocuments();
    } catch (error) {
      showSnackbar('Failed to quit document', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        Documents Shared with Me
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#f0f9ff', borderLeft: '4px solid #0284c7', borderRadius: '8px' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <ShareIcon sx={{ mr: 2, color: '#0284c7', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#0369a1' }}>
              Shared Documents Access
            </Typography>
            <Typography variant="body1" color="#475569">
              These documents have been shared with you by other users.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <Box mb={3}>
            <ShareIcon sx={{ fontSize: 80, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No shared documents
          </Typography>
          <Typography variant="body1" color="#94a3b8">
            No one has shared any documents with you yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid item xs={12} md={6} lg={4} key={doc._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {doc.title}
                  </Typography>
                  
                  <Chip 
                    label={doc.permissions === 'admin' ? 'Admin Access' : doc.permissions === 'editor' ? 'Can Edit' : 'View Only'}
                    size="small"
                    color={doc.permissions === 'admin' ? 'secondary' : doc.permissions === 'editor' ? 'success' : 'info'}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  
                  <Box sx={{ backgroundColor: '#f8fafc', p: 2, borderRadius: '6px' }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#3b82f6' }}>
                        {doc.owner?.email?.[0]?.toUpperCase() || 'O'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {doc.owner?.email || 'Unknown Owner'}
                        </Typography>
                        <Typography variant="caption" color="#64748b">
                          Owner
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" mt={1}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, color: '#64748b' }} />
                      <Typography variant="caption" color="#64748b">
                        Shared: {formatDate(doc.createdAt)}
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
                  >
                    {doc.permissions === 'viewer' ? 'View' : 'Edit'}
                  </Button>
                  
                  <IconButton 
                    onClick={() => openQuitDialog(doc)}
                    title="Quit Document"
                    sx={{ color: '#f59e0b' }}
                  >
                    <QuitIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 退出确认对话框 */}
      <Dialog open={quitDialog} onClose={() => setQuitDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fffbeb' }}>
          <Box display="flex" alignItems="center">
            <QuitIcon sx={{ mr: 1, color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ color: '#d97706' }}>Quit Collaboration</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to quit <strong>"{selectedDoc?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            You will lose access to this document.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuitDialog(false)}>Cancel</Button>
          <Button onClick={handleQuit} variant="contained" color="warning" startIcon={<QuitIcon />}>
            Quit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SharedWithMe;