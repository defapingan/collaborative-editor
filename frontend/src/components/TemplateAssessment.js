import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Button, Grid, Card, CardContent, CardActions,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stepper, Step, StepLabel, CircularProgress, Alert, List, ListItem, ListItemIcon, ListItemText,
  Divider, Tooltip, Fade, Switch, FormControlLabel, InputAdornment, Chip
} from '@mui/material';
import {
  Search as SearchIcon, Check as CheckIcon, Close as CloseIcon, Warning as WarningIcon,
  Upload as UploadIcon, Assessment as AssessmentIcon, FileDownload as ExportIcon,
  ArrowBack as BackIcon, Refresh as RefreshIcon, Add as AddIcon, Remove as RemoveIcon
} from '@mui/icons-material';
import { documentAPI } from '../services/api';

const TemplateAssessment = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState({
    title: '',
    paragraphCount: 0,
    owner: ''
  });
  const [documentContent, setDocumentContent] = useState('');

  // 预定义模板
  const predefinedTemplates = [
    {
      id: 'research-paper',
      name: 'Research Paper Template',
      description: 'Standard academic research paper structure',
      sections: [
        { name: 'Title', required: true, minParagraphs: 1, keywords: ['title', 'heading'] },
        { name: 'Abstract', required: true, minParagraphs: 1, keywords: ['abstract', 'summary'] },
        { name: 'Introduction', required: true, minParagraphs: 2, keywords: ['introduction', 'intro', 'background'] },
        { name: 'Literature Review', required: false, minParagraphs: 2, keywords: ['literature', 'related work', 'review'] },
        { name: 'Methodology', required: true, minParagraphs: 2, keywords: ['method', 'methodology', 'approach', 'implementation'] },
        { name: 'Results', required: true, minParagraphs: 2, keywords: ['results', 'findings', 'experiments'] },
        { name: 'Discussion', required: true, minParagraphs: 2, keywords: ['discussion', 'analysis'] },
        { name: 'Conclusion', required: true, minParagraphs: 1, keywords: ['conclusion', 'summary', 'future work'] },
        { name: 'References', required: true, minParagraphs: 1, keywords: ['references', 'bibliography', 'citations'] }
      ]
    },
    {
      id: 'business-report',
      name: 'Business Report Template',
      description: 'Professional business analysis report',
      sections: [
        { name: 'Executive Summary', required: true, minParagraphs: 2, keywords: ['executive summary', 'overview'] },
        { name: 'Introduction', required: true, minParagraphs: 2, keywords: ['introduction', 'background'] },
        { name: 'Methodology', required: false, minParagraphs: 1, keywords: ['method', 'approach'] },
        { name: 'Findings', required: true, minParagraphs: 3, keywords: ['findings', 'results', 'analysis'] },
        { name: 'Recommendations', required: true, minParagraphs: 2, keywords: ['recommendations', 'suggestions'] },
        { name: 'Conclusion', required: true, minParagraphs: 1, keywords: ['conclusion'] }
      ]
    },
    {
      id: 'technical-spec',
      name: 'Technical Specification',
      description: 'Technical documentation and specifications',
      sections: [
        { name: 'Overview', required: true, minParagraphs: 2, keywords: ['overview', 'introduction'] },
        { name: 'Requirements', required: true, minParagraphs: 2, keywords: ['requirements', 'specifications'] },
        { name: 'Architecture', required: true, minParagraphs: 3, keywords: ['architecture', 'design'] },
        { name: 'API Reference', required: true, minParagraphs: 2, keywords: ['api', 'endpoints', 'reference'] },
        { name: 'Testing', required: true, minParagraphs: 2, keywords: ['testing', 'validation'] },
        { name: 'Deployment', required: true, minParagraphs: 1, keywords: ['deployment', 'installation'] }
      ]
    }
  ];

  useEffect(() => {
    fetchDocumentAndTemplates();
  }, [documentId]);

  const fetchDocumentAndTemplates = async () => {
    try {
      setLoading(true);
      
      // 从后端获取真实文档
      const doc = await documentAPI.getById(documentId);
      const content = doc.content || '';
      
      // 解析段落
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      setDocumentInfo({
        title: doc.title,
        paragraphCount: paragraphs.length,
        owner: doc.ownerEmail || 'Unknown',
        id: doc._id,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      });
      setDocumentContent(content);
      setTemplates(predefinedTemplates);
      
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  // 真实文档结构分析
  const analyzeDocumentStructure = (content, template) => {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // 识别每个段落的标题（基于常见标题模式）
    const detectSectionName = (paragraph) => {
      const lines = paragraph.split('\n');
      const firstLine = lines[0].trim().toLowerCase();
      
      // 检查是否是标题行
      const isHeading = firstLine.length < 50 && 
        (firstLine.endsWith(':') || 
         /^(#+\s|chapter\s+\d+|section\s+\d+|abstract|introduction|method|result|discussion|conclusion|reference)/i.test(firstLine));
      
      if (isHeading) {
        const cleanHeading = firstLine.replace(/^#+\s*/, '').replace(/:$/, '').trim();
        for (const section of template.sections) {
          if (section.keywords.some(keyword => 
            cleanHeading.toLowerCase().includes(keyword) || keyword.includes(cleanHeading.toLowerCase())
          )) {
            return section.name;
          }
        }
        return cleanHeading;
      }
      return null;
    };
    
    // 识别章节
    const foundSections = [];
    let currentSection = null;
    let currentParagraphs = [];
    
    for (const para of paragraphs) {
      const sectionName = detectSectionName(para);
      if (sectionName) {
        if (currentSection) {
          foundSections.push({
            name: currentSection,
            paragraphs: currentParagraphs.length,
            content: currentParagraphs.join('\n\n')
          });
        }
        currentSection = sectionName;
        currentParagraphs = [para];
      } else if (currentSection) {
        currentParagraphs.push(para);
      } else {
        // 没有标题的段落，归为 Introduction
        if (!currentSection) currentSection = 'Introduction';
        currentParagraphs.push(para);
      }
    }
    
    if (currentSection && currentParagraphs.length > 0) {
      foundSections.push({
        name: currentSection,
        paragraphs: currentParagraphs.length,
        content: currentParagraphs.join('\n\n')
      });
    }
    
    return { foundSections, totalParagraphs: paragraphs.length };
  };

  const runAssessment = async () => {
    setLoading(true);
    
    // 模拟评估延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { foundSections, totalParagraphs } = analyzeDocumentStructure(documentContent, selectedTemplate);
    
    // 分析找到的章节
    const foundSectionsList = [];
    const missingSectionsList = [];
    const extraSectionsList = [];
    
    // 检查模板要求的章节
    for (const templateSection of selectedTemplate.sections) {
      const found = foundSections.find(fs => 
        fs.name.toLowerCase().includes(templateSection.name.toLowerCase()) ||
        templateSection.name.toLowerCase().includes(fs.name.toLowerCase()) ||
        templateSection.keywords.some(kw => fs.name.toLowerCase().includes(kw))
      );
      
      if (found) {
        const score = Math.min(100, (found.paragraphs / templateSection.minParagraphs) * 100);
        foundSectionsList.push({
          name: templateSection.name,
          paragraphs: found.paragraphs,
          expected: templateSection.minParagraphs,
          score: score,
          status: score >= 70 ? 'complete' : 'partial'
        });
      } else if (templateSection.required) {
        missingSectionsList.push({
          name: templateSection.name,
          reason: 'Required section not found in document'
        });
      }
    }
    
    // 检查额外章节
    for (const foundSection of foundSections) {
      if (!selectedTemplate.sections.some(ts => 
        ts.name.toLowerCase().includes(foundSection.name.toLowerCase()) ||
        foundSection.name.toLowerCase().includes(ts.name.toLowerCase())
      )) {
        extraSectionsList.push({
          name: foundSection.name,
          reason: 'Not in template structure'
        });
      }
    }
    
    // 计算总分
    const requiredSections = selectedTemplate.sections.filter(s => s.required);
    const foundRequiredCount = foundSectionsList.filter(fs => fs.score > 0).length;
    const structureScore = (foundRequiredCount / requiredSections.length) * 100;
    
    const completenessScore = foundSectionsList.length > 0 ?
      foundSectionsList.reduce((sum, fs) => sum + fs.score, 0) / foundSectionsList.length : 0;
    
    const overallScore = Math.round((structureScore * 0.6) + (completenessScore * 0.4));
    
    // 生成建议
    const recommendations = [];
    for (const missing of missingSectionsList) {
      recommendations.push(`Add "${missing.name}" section to improve document completeness`);
    }
    for (const found of foundSectionsList) {
      if (found.status === 'partial') {
        recommendations.push(`Expand "${found.name}" section (currently ${found.paragraphs} paragraphs, expected ${found.expected}+)`);
      }
    }
    if (totalParagraphs < 10) {
      recommendations.push(`Consider adding more content (only ${totalParagraphs} paragraphs found)`);
    }
    
    const results = {
      documentId,
      templateName: selectedTemplate.name,
      timestamp: new Date().toISOString(),
      overallScore: Math.min(100, overallScore),
      structureMatch: Math.round(structureScore),
      completeness: Math.round(completenessScore),
      foundSections: foundSectionsList,
      missingSections: missingSectionsList,
      extraSections: extraSectionsList,
      recommendations: recommendations.slice(0, 5),
      detailedAnalysis: {
        totalSections: foundSections.length,
        matchedSections: foundSectionsList.length,
        requiredSections: requiredSections.length,
        foundRequired: foundRequiredCount,
        totalParagraphs: totalParagraphs
      }
    };
    
    setAssessmentResults(results);
    setActiveStep(2);
    setLoading(false);
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
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const customTemplate = JSON.parse(e.target.result);
          customTemplate.id = 'custom-' + Date.now();
          customTemplate.sections = customTemplate.sections || [
            { name: 'Introduction', required: true, minParagraphs: 2, keywords: ['intro'] },
            { name: 'Body', required: true, minParagraphs: 3, keywords: ['body', 'main'] },
            { name: 'Conclusion', required: true, minParagraphs: 1, keywords: ['conclusion'] }
          ];
          setSelectedTemplate(customTemplate);
          setActiveStep(1);
          setUploadDialogOpen(false);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };
  
  const steps = ['Select Template', 'Run Assessment', 'View Results'];
  
  if (loading && !documentInfo.title) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading document...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Template-based Document Assessment
          </Typography>
          <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/manage-documents')}>
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
                <Typography variant="body2" color="text.secondary">Document ID: {documentInfo.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Owner: {documentInfo.owner}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Paragraphs: {documentInfo.paragraphCount}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      
      {/* Step 1: 选择模板 */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>Select Template</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Choose a template to compare with your document structure
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card sx={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }} onClick={() => { setSelectedTemplate(template); setActiveStep(1); }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{template.name}</Typography>
                      <Chip label="Predefined" size="small" color="primary" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>{template.description}</Typography>
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>Required Sections:</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {template.sections.filter(s => s.required).slice(0, 5).map(section => (
                          <Chip key={section.name} label={section.name} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                    <Button variant="contained" fullWidth startIcon={<AssessmentIcon />}>Use This Template</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Custom Template</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Upload your own template file in JSON format.
                  </Typography>
                  <input type="file" id="template-upload" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <label htmlFor="template-upload">
                    <Button variant="outlined" component="span" fullWidth startIcon={<UploadIcon />}>
                      Upload Template File
                    </Button>
                  </label>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Example JSON format:</strong>
                      <pre style={{ fontSize: '11px', overflow: 'auto' }}>
{`{
  "name": "My Template",
  "sections": [
    {"name": "Introduction", "required": true, "minParagraphs": 2, "keywords": ["intro"]}
  ]
}`}</pre>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Step 2: 运行评估 */}
      {activeStep === 1 && selectedTemplate && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>Assessment Configuration</Typography>
              <Typography variant="body1" color="text.secondary">
                Configure assessment options for: <strong>{selectedTemplate.name}</strong>
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => setActiveStep(0)} startIcon={<BackIcon />}>Change Template</Button>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Template Structure</Typography>
                  <List>
                    {selectedTemplate.sections.map((section, index) => (
                      <React.Fragment key={section.name}>
                        <ListItem>
                          <ListItemIcon>{section.required ? <CheckIcon color="primary" /> : <RemoveIcon color="action" />}</ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="body1">{section.name}</Typography>}
                            secondary={`Minimum paragraphs: ${section.minParagraphs}`}
                          />
                        </ListItem>
                        {index < selectedTemplate.sections.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Assessment Options</Typography>
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel control={<Switch defaultChecked />} label="Check section structure" />
                    <FormControlLabel control={<Switch defaultChecked />} label="Check paragraph completeness" />
                  </Box>
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2">Document has {documentInfo.paragraphCount} paragraphs ready for analysis.</Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', p: 3 }}>
                  <Button variant="contained" size="large" onClick={runAssessment} disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}>
                    {loading ? 'Running Assessment...' : 'Run Assessment'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Step 3: 查看结果 */}
      {activeStep === 2 && assessmentResults && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" gutterBottom>Assessment Results</Typography>
            <Button variant="contained" startIcon={<ExportIcon />} onClick={exportReport}>Export Report</Button>
          </Box>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                    <CircularProgress variant="determinate" value={assessmentResults.overallScore} size={120} thickness={4} />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4">{assessmentResults.overallScore}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6">Overall Score</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Detailed Metrics</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Structure Match</Typography>
                      <Typography variant="body2" fontWeight="medium">{assessmentResults.structureMatch}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={assessmentResults.structureMatch} sx={{ height: 8 }} />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Content Completeness</Typography>
                      <Typography variant="body2" fontWeight="medium">{assessmentResults.completeness}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={assessmentResults.completeness} sx={{ height: 8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">✅ Found Sections</Typography>
                  {assessmentResults.foundSections.map((section, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="500">{section.name}</Typography>
                      <Typography variant="caption">Paragraphs: {section.paragraphs}/{section.expected}</Typography>
                      <LinearProgress variant="determinate" value={section.score} sx={{ mt: 0.5, height: 4 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error.main">❌ Missing Sections</Typography>
                  {assessmentResults.missingSections.map((section, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2">{section.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{section.reason}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning.main">⚠️ Extra Sections</Typography>
                  {assessmentResults.extraSections.map((section, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2">{section.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{section.reason}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              <List>
                {assessmentResults.recommendations.map((rec, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><Typography color="primary">{idx + 1}.</Typography></ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button variant="contained" onClick={resetAssessment} startIcon={<RefreshIcon />}>New Assessment</Button>
            <Button variant="outlined" onClick={() => navigate('/manage-documents')}>Back to Documents</Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default TemplateAssessment;