import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, MenuItem, Select, FormControl, InputLabel,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, CardActions, Switch, FormControlLabel,
  Tooltip, Fade, InputAdornment, Alert, Snackbar, CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  PersonAdd as InviteIcon,
  ExitToApp as QuitIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const ManageDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [inviteDialog, setInviteDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [quitDialog, setQuitDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentAPI.getAll();
      setDocuments(docs);
      applyFilter(filterType, docs);
      setError('');
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      applyFilter(filterType, documents);
      return;
    }
    
    const filtered = documents.filter(doc =>
      doc.title.toLowerCase().includes(term.toLowerCase()) ||
      doc.owner?.email?.toLowerCase().includes(term.toLowerCase())
    );
    applyFilter(filterType, filtered);
  };

  const applyFilter = (type, docs) => {
    if (type === 'all') {
      setFilteredDocs(docs);
    } else {
      const filtered = docs.filter(doc => doc.types && doc.types.includes(type));
      setFilteredDocs(filtered);
    }
  };

  const handleFilter = (type) => {
    setFilterType(type);
    applyFilter(type, documents);
  };

  // 打开创建文档对话框
  const openCreateDialog = () => {
    setNewDocTitle('');
    setCreateDialog(true);
  };

  // 执行创建文档
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
      await fetchDocuments();
      // 可选：自动打开新创建的文档
      navigate(`/editor/${newDoc.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      showSnackbar('Failed to create document: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setCreating(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (doc) => {
    setSelectedDoc(doc);
    setDeleteDialog(true);
  };

  // 执行删除
  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await documentAPI.delete(selectedDoc._id);
      showSnackbar(`Document "${selectedDoc.title}" deleted`, 'success');
      setDeleteDialog(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      showSnackbar('Failed to delete document', 'error');
    }
  };

  // 打开邀请对话框
  const openInviteDialog = (doc) => {
    setSelectedDoc(doc);
    setInviteDialog(true);
    setInviteEmail('');
    setInviteRole('editor');
  };

  // 发送邀请
  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    try {
      await documentAPI.share(selectedDoc._id, inviteEmail, inviteRole);
      showSnackbar(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteDialog(false);
      fetchDocuments();
    } catch (err) {
      showSnackbar('Failed to send invitation', 'error');
    }
  };

  // 打开退出确认对话框
  const openQuitDialog = (doc) => {
    setSelectedDoc(doc);
    setQuitDialog(true);
  };

  // 执行退出协作
  const handleQuit = async () => {
    if (!selectedDoc) return;
    try {
      await documentAPI.quit(selectedDoc._id);
      showSnackbar(`Quit "${selectedDoc.title}"`, 'success');
      setQuitDialog(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      showSnackbar('Failed to quit document', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeLabel = (types) => {
    if (!types) return [];
    const labels = [];
    if (types.includes('my')) labels.push('My Document');
    if (types.includes('sharedWithMe')) labels.push('Shared with Me');
    if (types.includes('sharingWithOthers')) labels.push('Sharing with Others');
    return labels;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'my': return 'primary';
      case 'sharedWithMe': return 'success';
      case 'sharingWithOthers': return 'warning';
      default: return 'default';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilteredDocs(documents);
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
          Manage Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          New Document
        </Button>
      </Box>
      
      {/* 搜索工具栏 */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search documents by title or owner..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearFilters} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => handleFilter(e.target.value)}
              >
                <MenuItem value="all">All Documents</MenuItem>
                <MenuItem value="my">My Documents</MenuItem>
                <MenuItem value="sharedWithMe">Shared with Me</MenuItem>
                <MenuItem value="sharingWithOthers">Sharing with Others</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDocuments}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 统计信息 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>My Documents</Typography>
              <Typography variant="h4">{documents.filter(d => d.types?.includes('my')).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dcfce7', borderLeft: '4px solid #10b981' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Shared with Me</Typography>
              <Typography variant="h4">{documents.filter(d => d.types?.includes('sharedWithMe')).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Sharing with Others</Typography>
              <Typography variant="h4">{documents.filter(d => d.types?.includes('sharingWithOthers')).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 文档列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((doc) => (
                <TableRow key={doc._id} hover>
                  <TableCell>
                    <Button 
                      component={Link}
                      to={`/editor/${doc._id}`}
                      sx={{ textTransform: 'none', color: '#1e40af', fontWeight: 500 }}
                    >
                      {doc.title}
                    </Button>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {getTypeLabel(doc.types).map((label, index) => (
                        <Chip
                          key={index}
                          label={label}
                          size="small"
                          color={getTypeColor(doc.types[index])}
                          variant="outlined"
                          sx={{ width: 'fit-content' }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {doc.owner?.email || 'Unknown'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(doc.updatedAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Template Assessment">
                        <IconButton 
                          onClick={() => navigate(`/template-assessment/${doc._id}`, { state: { document: doc } })}
                          size="small"
                          sx={{ color: '#8b5cf6' }}
                        >
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton component={Link} to={`/editor/${doc._id}`} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {doc.types?.includes('my') && (
                        <>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => openDeleteDialog(doc)} size="small" sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Invite">
                            <IconButton onClick={() => openInviteDialog(doc)} size="small" sx={{ color: '#3b82f6' }}>
                              <InviteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {doc.types?.includes('sharedWithMe') && (
                        <Tooltip title="Quit">
                          <IconButton onClick={() => openQuitDialog(doc)} size="small" sx={{ color: '#f59e0b' }}>
                            <QuitIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDocs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

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
              helperText="Choose a descriptive title for your document"
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
            This action cannot be undone. All content will be permanently lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* 退出协作确认对话框 */}
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
            You will lose access to this document unless you are re-invited.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuitDialog(false)}>Cancel</Button>
          <Button onClick={handleQuit} variant="contained" color="warning" startIcon={<QuitIcon />}>
            Quit
          </Button>
        </DialogActions>
      </Dialog>

      {/* 邀请对话框 */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <InviteIcon sx={{ mr: 1, color: '#3b82f6' }} />
              <Typography variant="h6">Invite Collaborator</Typography>
            </Box>
            <IconButton onClick={() => setInviteDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Invite a user to collaborate on "{selectedDoc?.title}"
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="example@email.com"
              sx={{ mb: 3, mt: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={inviteRole} label="Role" onChange={(e) => setInviteRole(e.target.value)}>
                <MenuItem value="admin">
                  <Box>
                    <Typography variant="body1">Admin</Typography>
                    <Typography variant="caption" color="text.secondary">Full control, can edit, invite, and manage collaborators</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="editor">
                  <Box>
                    <Typography variant="body1">Editor</Typography>
                    <Typography variant="caption" color="text.secondary">Can edit document content</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="viewer">
                  <Box>
                    <Typography variant="body1">Viewer</Typography>
                    <Typography variant="caption" color="text.secondary">Read only access</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleSendInvite} variant="contained" disabled={!inviteEmail.trim()}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageDocuments;