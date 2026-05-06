import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip,
  Card, CardContent, CardActions, Skeleton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Alert, Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const MyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      const allDocs = await documentAPI.getAll();
      const myDocs = allDocs.filter(doc => doc.types?.includes('my'));
      setDocuments(myDocs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      showSnackbar('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (doc) => {
    setSelectedDoc(doc);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await documentAPI.delete(selectedDoc._id);
      showSnackbar(`Document "${selectedDoc.title}" deleted`, 'success');
      setDeleteDialog(false);
      setSelectedDoc(null);
      fetchMyDocuments();
    } catch (error) {
      showSnackbar('Failed to delete document', 'error');
    }
  };

  const openCreateDialog = () => {
    setNewDocTitle('');
    setCreateDialog(true);
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      showSnackbar('Please enter a document title', 'error');
      return;
    }
    
    setCreating(true);
    try {
      const newDoc = await documentAPI.create(newDocTitle.trim());
      showSnackbar(`Document "${newDocTitle}" created`, 'success');
      setCreateDialog(false);
      setNewDocTitle('');
      await fetchMyDocuments();
      navigate(`/editor/${newDoc.id}`);
    } catch (error) {
      showSnackbar('Failed to create document: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setCreating(false);
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
        <Typography sx={{ ml: 2 }}>Loading documents...</Typography>
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
          onClick={openCreateDialog}
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
            onClick={openCreateDialog}
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
          },
          gap: 3,
        }}>
          {documents.map((doc) => (
            <Card key={doc._id} sx={{ 
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
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {doc.title}
                </Typography>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <TimeIcon sx={{ fontSize: 16, mr: 1, color: '#64748b' }} />
                  <Typography variant="caption" color="#64748b">
                    Created: {formatDate(doc.createdAt)}
                  </Typography>
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
                  onClick={() => openDeleteDialog(doc)}
                  title="Delete Document"
                  sx={{ color: '#ef4444' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* 创建文档对话框 */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <AddIcon sx={{ mr: 1, color: '#3b82f6' }} />
              <Typography variant="h6">Create New Document</Typography>
            </Box>
            <IconButton onClick={() => setCreateDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Document Title"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter a title for your document"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newDocTitle.trim()) {
                  handleCreateDocument();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateDocument} 
            variant="contained" 
            disabled={!newDocTitle.trim() || creating}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fef2f2' }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1, color: '#ef4444' }} />
            <Typography variant="h6" sx={{ color: '#dc2626' }}>Delete Document</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to delete <strong>"{selectedDoc?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyDocuments;