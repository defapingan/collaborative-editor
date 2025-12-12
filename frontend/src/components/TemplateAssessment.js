// frontend/src/components/TemplateAssessment.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Fade,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Upload as UploadIcon,
  Assessment as AssessmentIcon,
  FileDownload as ExportIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import templateService from '../services/templateService';

const TemplateAssessment = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 状态管理
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    title: `Document ${documentId}`,
    paragraphCount: 15,
    owner: 'current@user.com'  // 确保是字符串
  });

  // 初始化
  useEffect(() => {
    fetchTemplates();
    
    // 如果有文档信息传递过来
    if (location.state?.document) {
      const doc = location.state.document;
      setDocumentInfo({
        title: doc.title || `Document ${documentId}`,
        paragraphCount: doc.paragraphCount || 15,
        // 提取 owner 的 email 或使用字符串
        owner: doc.owner?.email || doc.owner || 'current@user.com'
      });
    }
  }, [documentId, location.state]);

  const fetchTemplates = () => {
    const predefined = templateService.getPredefinedTemplates();
    setTemplates(predefined);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setActiveStep(1);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      // 模拟解析模板文件
      const customTemplate = {
        id: 'custom-' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        description: 'Custom uploaded template',
        sections: [
          { name: 'Introduction', required: true, minParagraphs: 3 },
          { name: 'Body', required: true, minParagraphs: 5 },
          { name: 'Conclusion', required: true, minParagraphs: 2 },
          { name: 'References', required: false, minParagraphs: 1 }
        ],
        rules: {
          minTotalParagraphs: 10
        }
      };
      setSelectedTemplate(customTemplate);
      setActiveStep(1);
      setUploadDialogOpen(false);
    }
  };

  const runAssessment = async () => {
    setLoading(true);
    
    // 模拟评估过程
    setTimeout(() => {
      const mockResults = {
        documentId,
        templateName: selectedTemplate.name,
        timestamp: new Date().toISOString(),
        
        // 总体评分
        overallScore: 78,
        structureMatch: 65,
        completeness: 76,
        
        // 结构分析
        foundSections: [
          { name: 'Introduction', paragraphs: 3, expected: 5, score: 60, status: 'partial' },
          { name: 'Methodology', paragraphs: 5, expected: 5, score: 100, status: 'complete' },
          { name: 'Results', paragraphs: 4, expected: 6, score: 67, status: 'partial' }
        ],
        missingSections: [
          { name: 'Abstract', reason: 'Required section not found' },
          { name: 'Conclusion', reason: 'Required section not found' }
        ],
        extraSections: [
          { name: 'Preliminary Notes', reason: 'Not in template structure' }
        ],
        
        // 建议
        recommendations: [
          'Add Abstract section to provide overview',
          'Include Conclusion section to summarize findings',
          'Expand Introduction section with more background',
          'Add References section for citations'
        ],
        
        // 详细分析
        detailedAnalysis: {
          totalSections: 7,
          matchedSections: 3,
          requiredSections: 5,
          foundRequired: 3,
          paragraphCompleteness: 76,
          structuralIntegrity: 65
        }
      };
      
      setAssessmentResults(mockResults);
      setActiveStep(2);
      setLoading(false);
    }, 2000);
  };

  const exportReport = () => {
    if (!assessmentResults) return;
    
    const report = {
      title: `Template Assessment Report - ${documentInfo.title}`,
      documentInfo,
      templateInfo: selectedTemplate,
      assessmentResults,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-assessment-${documentId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAssessment = () => {
    setSelectedTemplate(null);
    setAssessmentResults(null);
    setActiveStep(0);
    setUploadedFile(null);
  };

  const steps = ['Select Template', 'Run Assessment', 'View Results'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 头部 */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Template-based Document Assessment
          </Typography>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/manage-documents')}
          >
            Back to Documents
          </Button>
        </Box>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document: {documentInfo.title}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Document ID: {documentId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Owner: {documentInfo.owner}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Paragraphs: {documentInfo.paragraphCount}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* 进度指示器 */}
      <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* 步骤1: 选择模板 */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Select Template
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Choose a template to compare with your document structure
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* 预定义模板 */}
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {template.name}
                      </Typography>
                      <Chip 
                        label="Predefined" 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Required Sections:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {template.sections
                          .filter(s => s.required)
                          .slice(0, 5)
                          .map(section => (
                            <Chip
                              key={section.name}
                              label={section.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        {template.sections.filter(s => s.required).length > 5 && (
                          <Chip
                            label={`+${template.sections.filter(s => s.required).length - 5} more`}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Optional Sections:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {template.sections
                          .filter(s => !s.required)
                          .slice(0, 3)
                          .map(section => (
                            <Chip
                              key={section.name}
                              label={section.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        {template.sections.filter(s => !s.required).length > 3 && (
                          <Chip
                            label={`+${template.sections.filter(s => !s.required).length - 3} more`}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<AssessmentIcon />}
                    >
                      Use This Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            {/* 自定义模板卡片 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Custom Template
                    </Typography>
                    <Chip 
                      label="Custom" 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                    Upload your own template file in JSON or TXT format. Define the structure and requirements for your document assessment.
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      id="template-upload"
                      accept=".json,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="template-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        startIcon={<UploadIcon />}
                        sx={{ mb: 2 }}
                      >
                        Upload Template File
                      </Button>
                    </label>
                    
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                      Supported formats: JSON, TXT
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Example JSON format:</strong>
                    </Typography>
                    <pre style={{ 
                      marginTop: '8px', 
                      fontSize: '11px', 
                      overflow: 'auto',
                      backgroundColor: 'white',
                      padding: '8px',
                      borderRadius: '4px'
                    }}>
{`{
  "name": "My Template",
  "description": "Custom template definition",
  "sections": [
    {
      "name": "Introduction",
      "required": true,
      "minParagraphs": 3
    }
  ]
}`}</pre>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 步骤2: 运行评估 */}
      {activeStep === 1 && selectedTemplate && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Assessment Configuration
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure assessment options for: <strong>{selectedTemplate.name}</strong>
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              startIcon={<BackIcon />}
            >
              Change Template
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* 模板详情 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template Structure
                  </Typography>
                  
                  <List>
                    {selectedTemplate.sections.map((section, index) => (
                      <React.Fragment key={section.name}>
                        <ListItem>
                          <ListItemIcon>
                            {section.required ? (
                              <CheckIcon color="primary" />
                            ) : (
                              <RemoveIcon color="action" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body1">
                                  {section.name}
                                </Typography>
                                {section.required && (
                                  <Chip 
                                    label="Required" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                Minimum paragraphs: {section.minParagraphs}
                                {section.description && ` - ${section.description}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < selectedTemplate.sections.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 评估选项 */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assessment Options
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Check section structure"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mb: 2 }}>
                      Compare document sections with template requirements
                    </Typography>
                    
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Check paragraph completeness"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mb: 2 }}>
                      Verify minimum paragraph counts for each section
                    </Typography>
                    
                    <FormControlLabel
                      control={<Switch />}
                      label="Check formatting consistency"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                      Analyze formatting and style consistency (experimental)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Note for Mid-point Check:</strong> This assessment will use simulated data for demonstration purposes.
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', p: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={runAssessment}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? 'Running Assessment...' : 'Run Assessment'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 步骤3: 查看结果 */}
      {activeStep === 2 && assessmentResults && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Assessment Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Analysis of document structure against: <strong>{selectedTemplate.name}</strong>
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={exportReport}
            >
              Export Report
            </Button>
          </Box>
          
          {/* 总体评分 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={assessmentResults.overallScore} 
                      size={120}
                      thickness={4}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" component="div">
                        {assessmentResults.overallScore}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Overall Score
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Document quality assessment
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detailed Metrics
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Structure Match</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {assessmentResults.structureMatch}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={assessmentResults.structureMatch} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Content Completeness</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {assessmentResults.completeness}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={assessmentResults.completeness} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                          <Typography variant="h5">
                            {assessmentResults.detailedAnalysis?.foundRequired || 0}
                          </Typography>
                          <Typography variant="caption">
                            Required Sections Found
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                          <Typography variant="h5">
                            {assessmentResults.missingSections?.length || 0}
                          </Typography>
                          <Typography variant="caption">
                            Missing Sections
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* 详细分析 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Found Sections */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    ✅ Found Sections
                  </Typography>
                  
                  <List dense>
                    {assessmentResults.foundSections.map((section, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {section.status === 'complete' ? (
                            <CheckIcon color="success" />
                          ) : (
                            <WarningIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={section.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Paragraphs: {section.paragraphs}/{section.expected}
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={section.score} 
                                sx={{ mt: 0.5, height: 4 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Missing Sections */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error.main">
                    ❌ Missing Sections
                  </Typography>
                  
                  <List dense>
                    {assessmentResults.missingSections.map((section, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CloseIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={section.name}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {section.reason}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Extra Sections */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning.main">
                    ⚠️ Extra Sections
                  </Typography>
                  
                  <List dense>
                    {assessmentResults.extraSections.map((section, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={section.name}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {section.reason}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* 建议 */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              
              <List>
                {assessmentResults.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Typography color="primary">{index + 1}.</Typography>
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          
          {/* 操作按钮 */}
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              onClick={resetAssessment}
              startIcon={<RefreshIcon />}
            >
              New Assessment
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/manage-documents')}
            >
              Back to Documents
            </Button>
          </Box>
        </Box>
      )}

      {/* 上传对话框 */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Template File</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a JSON or TXT file containing your template definition
          </Typography>
          
          <input
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Choose File
            </Button>
          </label>
          
          {uploadedFile && (
            <Alert severity="success" sx={{ mt: 2 }}>
              File selected: {uploadedFile.name}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (uploadedFile) {
                setUploadDialogOpen(false);
              }
            }}
            variant="contained"
            disabled={!uploadedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TemplateAssessment;