import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, MenuItem, Select, FormControl, InputLabel,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Card, CardContent, CardActions, Switch, FormControlLabel,
  Tooltip, Fade, InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  PersonAdd as InviteIcon,
  ExitToApp as QuitIcon,
  PersonRemove as KickIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

const ManageDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [inviteDialog, setInviteDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    try {
      // 模拟数据 - 中期检查用
      const mockDocuments = [
        // My Documents
        { 
          _id: '1', 
          title: 'Project Final Report', 
          owner: { email: 'current@user.com' },
          createdAt: '2025-10-15T10:30:00Z',
          updatedAt: '2025-10-20T14:45:00Z',
          types: ['my'],
          collaborators: [],
          status: 'active'
        },
        { 
          _id: '2', 
          title: 'Weekly Meeting Notes', 
          owner: { email: 'current@user.com' },
          createdAt: '2025-10-10T09:15:00Z',
          updatedAt: '2025-10-18T16:20:00Z',
          types: ['my'],
          collaborators: [],
          status: 'active'
        },
        { 
          _id: '3', 
          title: 'Research Paper Draft', 
          owner: { email: 'current@user.com' },
          createdAt: '2025-10-05T11:00:00Z',
          updatedAt: '2025-10-12T13:30:00Z',
          types: ['my'],
          collaborators: [
            { user: { email: 'alice@example.com' }, status: 'active' },
            { user: { email: 'bob@example.com' }, status: 'quit' }
          ],
          status: 'active'
        },
        
        // Shared with Me
        { 
          _id: '4', 
          title: 'Team Project Documentation', 
          owner: { email: 'alice.smith@example.com' },
          createdAt: '2025-10-18T15:30:00Z',
          updatedAt: '2025-10-19T11:20:00Z',
          types: ['sharedWithMe'],
          collaborators: [],
          status: 'active'
        },
        { 
          _id: '5', 
          title: 'Group Assignment - Final Submission', 
          owner: { email: 'bob.johnson@example.com' },
          createdAt: '2025-10-12T11:20:00Z',
          updatedAt: '2025-10-14T09:45:00Z',
          types: ['sharedWithMe'],
          collaborators: [],
          status: 'active'
        },
        
        // Sharing with Others
        { 
          _id: '6', 
          title: 'System Architecture', 
          owner: { email: 'current@user.com' },
          createdAt: '2025-10-03T14:20:00Z',
          updatedAt: '2025-10-08T11:45:00Z',
          types: ['my', 'sharingWithOthers'],
          collaborators: [
            { user: { email: 'charlie@example.com' }, status: 'active' },
            { user: { email: 'diana@example.com' }, status: 'active' }
          ],
          status: 'active'
        },
        { 
          _id: '7', 
          title: 'Research Collaboration', 
          owner: { email: 'carol.williams@example.com' },
          createdAt: '2025-10-20T09:45:00Z',
          updatedAt: '2025-10-21T16:30:00Z',
          types: ['sharedWithMe'],
          collaborators: [],
          status: 'active'
        },
        { 
          _id: '8', 
          title: 'Team Meeting Agenda', 
          owner: { email: 'current@user.com' },
          createdAt: '2025-10-19T13:15:00Z',
          updatedAt: '2025-10-22T10:00:00Z',
          types: ['my', 'sharingWithOthers'],
          collaborators: [
            { user: { email: 'eve@example.com' }, status: 'active' },
            { user: { email: 'frank@example.com' }, status: 'active' },
            { user: { email: 'grace@example.com' }, status: 'kicked' }
          ],
          status: 'active'
        },
      ];
      
      setDocuments(mockDocuments);
      setFilteredDocs(mockDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
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
      const filtered = docs.filter(doc => doc.types.includes(type));
      setFilteredDocs(filtered);
    }
  };

  const handleFilter = (type) => {
    setFilterType(type);
    applyFilter(type, documents);
  };

  const handleDelete = async (docId, docTitle) => {
    if (window.confirm(`Are you sure you want to delete "${docTitle}"?`)) {
      // 中期检查：暂时只在前端移除
      const updatedDocs = documents.filter(doc => doc._id !== docId);
      setDocuments(updatedDocs);
      applyFilter(filterType, updatedDocs);
      alert(`Document "${docTitle}" deleted (simulated for mid-point check)`);
    }
  };

  const handleInvite = (doc) => {
    setSelectedDoc(doc);
    setInviteDialog(true);
    setInviteEmail('');
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // 模拟邀请
      alert(`Invitation sent to ${inviteEmail} (simulated for mid-point check)`);
      setInviteDialog(false);
      setInviteEmail('');
      
      // 更新文档数据
      const updatedDocs = documents.map(doc => {
        if (doc._id === selectedDoc._id) {
          const newCollaborator = {
            user: { email: inviteEmail },
            status: 'active'
          };
          return {
            ...doc,
            collaborators: [...doc.collaborators, newCollaborator],
            types: doc.types.includes('sharingWithOthers') ? 
                   doc.types : 
                   [...doc.types, 'sharingWithOthers']
          };
        }
        return doc;
      });
      
      setDocuments(updatedDocs);
      applyFilter(filterType, updatedDocs);
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  const handleQuit = async (docId, docTitle) => {
    if (window.confirm(`Are you sure you want to quit "${docTitle}"?`)) {
      // 中期检查：暂时只在前端更新
      const updatedDocs = documents.map(doc => {
        if (doc._id === docId) {
          const updatedTypes = doc.types.filter(type => type !== 'sharedWithMe');
          return {
            ...doc,
            types: updatedTypes
          };
        }
        return doc;
      });
      
      setDocuments(updatedDocs);
      applyFilter(filterType, updatedDocs);
      alert(`Successfully quit "${docTitle}" (simulated for mid-point check)`);
    }
  };

  const handleKick = async (docId, userEmail) => {
    if (window.confirm(`Are you sure you want to kick ${userEmail}?`)) {
      // 中期检查：暂时只在前端更新
      const updatedDocs = documents.map(doc => {
        if (doc._id === docId) {
          const updatedCollaborators = doc.collaborators.map(collab => {
            if (collab.user.email === userEmail) {
              return { ...collab, status: 'kicked' };
            }
            return collab;
          });
          return {
            ...doc,
            collaborators: updatedCollaborators
          };
        }
        return doc;
      });
      
      setDocuments(updatedDocs);
      applyFilter(filterType, updatedDocs);
      alert(`Kicked ${userEmail} (simulated for mid-point check)`);
    }
  };

  const handleCreateDocument = async () => {
    const title = prompt('Enter document title:');
    if (title && title.trim()) {
      try {
        const newDoc = {
          _id: `doc_${Date.now()}`,
          title: title.trim(),
          owner: { email: 'current@user.com' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          types: ['my'],
          collaborators: [],
          status: 'active'
        };
        
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        applyFilter(filterType, updatedDocs);
        
        alert(`Document "${title}" created (simulated for mid-point check)`);
      } catch (error) {
        console.error('Failed to create document:', error);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeLabel = (types) => {
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

  const getCollaboratorStatus = (doc) => {
    const active = doc.collaborators?.filter(c => c.status === 'active').length || 0;
    const total = doc.collaborators?.length || 0;
    return `${active}/${total} active`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilteredDocs(documents);
  };

  return (
    <Box>
      {/* 标题和操作栏 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
          Manage Documents
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'card'}
                onChange={(e) => setViewMode(e.target.checked ? 'card' : 'table')}
                color="primary"
              />
            }
            label={viewMode === 'card' ? 'Card View' : 'Table View'}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDocument}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              }
            }}
          >
            New Document
          </Button>
        </Box>
      </Box>
      
      {/* 搜索和过滤工具栏 */}
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
              onClick={fetchAllDocuments}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
        
        {/* 过滤状态显示 */}
        <Fade in={searchTerm || filterType !== 'all'}>
          <Box display="flex" alignItems="center" mt={2} gap={1}>
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Filtered: 
              {searchTerm && ` "${searchTerm}"`}
              {filterType !== 'all' && ` Type: ${filterType}`}
              {(searchTerm || filterType !== 'all') && (
                <Button
                  size="small"
                  onClick={clearFilters}
                  sx={{ ml: 1, textTransform: 'none' }}
                >
                  Clear all
                </Button>
              )}
            </Typography>
          </Box>
        </Fade>
      </Paper>

      {/* 统计信息 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                My Documents
              </Typography>
              <Typography variant="h4">
                {documents.filter(d => d.types.includes('my')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#dcfce7', borderLeft: '4px solid #10b981' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Shared with Me
              </Typography>
              <Typography variant="h4">
                {documents.filter(d => d.types.includes('sharedWithMe')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Sharing with Others
              </Typography>
              <Typography variant="h4">
                {documents.filter(d => d.types.includes('sharingWithOthers')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 文档列表 */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper} sx={{ borderRadius: '8px', width: '100%', overflow: 'auto'}}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Collaborators</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doc) => (
                  <TableRow 
                    key={doc._id}
                    hover
                    sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Button 
                          component={Link}
                          to={`/editor/${doc._id}`}
                          sx={{ 
                            textTransform: 'none',
                            color: '#1e40af',
                            fontWeight: 500,
                            textAlign: 'left',
                            justifyContent: 'flex-start'
                          }}
                        >
                          {doc.title}
                        </Button>
                      </Box>
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
                      <Typography variant="body2">
                        {getCollaboratorStatus(doc)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(doc.updatedAt)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                          <IconButton 
                            component={Link}
                            to={`/editor/${doc._id}`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {doc.types.includes('my') && (
                          <>
                            <Tooltip title="Delete">
                              <IconButton 
                                onClick={() => handleDelete(doc._id, doc.title)}
                                size="small"
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Invite">
                              <IconButton 
                                onClick={() => handleInvite(doc)}
                                size="small"
                                sx={{ color: '#3b82f6' }}
                              >
                                <InviteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {doc.types.includes('sharedWithMe') && (
                          <Tooltip title="Quit">
                            <IconButton 
                              onClick={() => handleQuit(doc._id, doc.title)}
                              size="small"
                              sx={{ color: '#f59e0b' }}
                            >
                              <QuitIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {doc.types.includes('sharingWithOthers') && doc.collaborators && (
                          <Tooltip title="Manage Collaborators">
                            <IconButton size="small">
                              <MoreIcon fontSize="small" />
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
      ) : (
        // Card View
        <Grid container spacing={3}>
          {filteredDocs
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc._id}>
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#1e293b',
                          cursor: 'pointer',
                          '&:hover': { color: '#3b82f6' }
                        }}
                        component={Link}
                        to={`/editor/${doc._id}`}
                      >
                        {doc.title}
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      {getTypeLabel(doc.types).map((label, index) => (
                        <Chip
                          key={index}
                          label={label}
                          size="small"
                          color={getTypeColor(doc.types[index])}
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Owner: {doc.owner?.email}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Collaborators: {getCollaboratorStatus(doc)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Updated: {formatDate(doc.updatedAt)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box>
                      <IconButton 
                        component={Link}
                        to={`/editor/${doc._id}`}
                        size="small"
                        title="Edit Document"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      {doc.types.includes('my') && (
                        <>
                          <IconButton 
                            onClick={() => handleDelete(doc._id, doc.title)}
                            size="small"
                            title="Delete Document"
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleInvite(doc)}
                            size="small"
                            title="Invite User"
                            sx={{ color: '#3b82f6' }}
                          >
                            <InviteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      
                      {doc.types.includes('sharedWithMe') && (
                        <IconButton 
                          onClick={() => handleQuit(doc._id, doc.title)}
                          size="small"
                          title="Quit Document"
                          sx={{ color: '#f59e0b' }}
                        >
                          <QuitIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          
          {filteredDocs.length > 0 && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" mt={3}>
                <TablePagination
                  rowsPerPageOptions={[6, 12, 24]}
                  component="div"
                  count={filteredDocs.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {filteredDocs.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Box mb={3}>
            <SearchIcon sx={{ fontSize: 64, color: '#cbd5e1' }} />
          </Box>
          <Typography variant="h5" color="#64748b" gutterBottom>
            No documents found
          </Typography>
          <Typography variant="body1" color="#94a3b8" paragraph>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first document to get started.'}
          </Typography>
          {(searchTerm || filterType !== 'all') && (
            <Button onClick={clearFilters} variant="outlined" sx={{ mt: 2 }}>
              Clear filters
            </Button>
          )}
        </Paper>
      )}

      {/* 邀请对话框 */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User to Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Invite a user to collaborate on "{selectedDoc?.title}"
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="User Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="example@email.com"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            The user will receive an invitation to collaborate on this document.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendInvite} 
            variant="contained"
            startIcon={<CheckIcon />}
            disabled={!inviteEmail || !inviteEmail.includes('@')}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDocuments;