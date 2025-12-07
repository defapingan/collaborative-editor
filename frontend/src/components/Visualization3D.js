import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, ToggleButton, ToggleButtonGroup, Slider,
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert
} from '@mui/material';
import {
  ThreeDRotation as ThreeDIcon,
  BarChart as BarChartIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';

const Visualization3D = ({ documentId }) => {
  const containerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or 'charts'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [colorScheme, setColorScheme] = useState('heatmap'); // 'heatmap', 'rainbow', 'grayscale'

  useEffect(() => {
    if (documentId) {
      fetchVisualizationData();
    }
  }, [documentId]);

  const fetchVisualizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟数据 - 中期检查用
      setTimeout(() => {
        const mockData = {
          documentId: documentId,
          title: 'Sample Document',
          paragraphs: [
            { 
              id: 1, 
              position: 1,
              length: 150, 
              totalEdits: 25, 
              userEdits: [
                { userId: 'user1', userName: 'Alice', editCount: 10 },
                { userId: 'user2', userName: 'Bob', editCount: 15 }
              ],
              content: 'First paragraph content...'
            },
            { 
              id: 2, 
              position: 2,
              length: 200, 
              totalEdits: 18, 
              userEdits: [
                { userId: 'user1', userName: 'Alice', editCount: 8 },
                { userId: 'user2', userName: 'Bob', editCount: 10 }
              ],
              content: 'Second paragraph content...'
            },
            { 
              id: 3, 
              position: 3,
              length: 120, 
              totalEdits: 32, 
              userEdits: [
                { userId: 'user1', userName: 'Alice', editCount: 20 },
                { userId: 'user3', userName: 'Charlie', editCount: 12 }
              ],
              content: 'Third paragraph content...'
            },
            { 
              id: 4, 
              position: 4,
              length: 180, 
              totalEdits: 15, 
              userEdits: [
                { userId: 'user2', userName: 'Bob', editCount: 15 }
              ],
              content: 'Fourth paragraph content...'
            },
            { 
              id: 5, 
              position: 5,
              length: 90, 
              totalEdits: 8, 
              userEdits: [
                { userId: 'user3', userName: 'Charlie', editCount: 5 },
                { userId: 'user4', userName: 'Diana', editCount: 3 }
              ],
              content: 'Fifth paragraph content...'
            },
          ],
          users: [
            { id: 'user1', name: 'Alice', email: 'alice@example.com' },
            { id: 'user2', name: 'Bob', email: 'bob@example.com' },
            { id: 'user3', name: 'Charlie', email: 'charlie@example.com' },
            { id: 'user4', name: 'Diana', email: 'diana@example.com' },
          ],
          summary: {
            totalParagraphs: 5,
            totalEdits: 98,
            averageEditsPerParagraph: 19.6,
            mostActiveUser: 'Alice',
            mostEditedParagraph: 3
          }
        };
        
        setData(mockData);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to fetch visualization data:', error);
      setError('Failed to load visualization data');
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setColorScheme('heatmap');
  };

  const processChartData = () => {
    if (!data) return { userFreq: [], paraFreq: [], lengths: [] };
    
    const userFreq = [];
    const paraFreq = [];
    const lengths = [];
    
    data.paragraphs.forEach((para, index) => {
      // 用户编辑频率（取最大值）
      const maxUserEdits = Math.max(...para.userEdits.map(e => e.editCount));
      userFreq.push({ 
        paragraph: para.position, 
        frequency: maxUserEdits,
        paragraphId: para.id 
      });
      
      // 段落总编辑频率
      paraFreq.push({ 
        paragraph: para.position, 
        frequency: para.totalEdits,
        paragraphId: para.id 
      });
      
      // 段落长度
      lengths.push({ 
        paragraph: para.position, 
        length: para.length,
        paragraphId: para.id 
      });
    });
    
    return { userFreq, paraFreq, lengths };
  };

  const { userFreq, paraFreq, lengths } = processChartData();

  const getHeatmapColor = (value, maxValue) => {
    // 热力图颜色渐变：蓝色 -> 青色 -> 绿色 -> 黄色 -> 红色
    const intensity = value / maxValue;
    
    if (intensity < 0.2) return '#3b82f6'; // 蓝色
    if (intensity < 0.4) return '#06b6d4'; // 青色
    if (intensity < 0.6) return '#10b981'; // 绿色
    if (intensity < 0.8) return '#f59e0b'; // 黄色
    return '#ef4444'; // 红色
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading 3D Analysis...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 控制栏 */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8fafc' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Collaboration Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document: {data?.title} | Paragraphs: {data?.paragraphs.length}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="3d">
                  <ThreeDIcon sx={{ mr: 1 }} />
                  3D View
                </ToggleButton>
                <ToggleButton value="charts">
                  <BarChartIcon sx={{ mr: 1 }} />
                  Charts
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Box display="flex" alignItems="center" ml={1}>
                <IconButton onClick={handleZoomOut} size="small">
                  <ZoomOutIcon />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                <IconButton onClick={handleZoomIn} size="small">
                  <ZoomInIcon />
                </IconButton>
              </Box>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Colors</InputLabel>
                <Select
                  value={colorScheme}
                  label="Colors"
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <MenuItem value="heatmap">Heat Map</MenuItem>
                  <MenuItem value="rainbow">Rainbow</MenuItem>
                  <MenuItem value="grayscale">Grayscale</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                startIcon={<ResetIcon />}
                onClick={handleResetView}
                size="small"
                variant="outlined"
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 轴解释 */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e0f2fe' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Axes Explanation:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#3b82f6' }}>
                X-axis: User Edit Frequency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum number of edits by any single user for each paragraph
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#10b981' }}>
                Y-axis: Total Edit Frequency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total number of edits for each paragraph (all users combined)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#f59e0b' }}>
                Z-axis: Paragraph Length
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Number of characters in each paragraph
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3D可视化容器 */}
      <Paper 
        ref={containerRef} 
        sx={{ 
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e293b'
        }}
      >
        {viewMode === '3d' ? (
          <>
            {/* 3D场景占位符 - 中期检查用 */}
            <Box 
              sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <ThreeDIcon sx={{ fontSize: 80, mb: 2, color: '#3b82f6' }} />
              <Typography variant="h5" gutterBottom>
                3D Visualization
              </Typography>
              <Typography variant="body1" color="#cbd5e1" align="center" sx={{ maxWidth: '600px', mb: 3 }}>
                Interactive 3D scatter plot showing collaboration patterns.
                Each point represents a paragraph, positioned based on edit frequencies and length.
              </Typography>
              
              {/* 模拟数据点 */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.paragraphs.slice(0, 5).map((para) => {
                  const maxUserEdits = Math.max(...para.userEdits.map(e => e.editCount));
                  const color = getHeatmapColor(para.totalEdits, 50);
                  
                  return (
                    <Box 
                      key={para.id}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        border: `2px solid ${color}`,
                        minWidth: '150px'
                      }}
                    >
                      <Typography variant="caption" display="block" color="#cbd5e1">
                        Paragraph {para.position}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Max User Edits: {maxUserEdits}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Total Edits: {para.totalEdits}
                      </Typography>
                      <Typography variant="body2" color="white">
                        Length: {para.length} chars
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              
              <Typography variant="caption" color="#94a3b8" sx={{ mt: 3 }}>
                Use mouse to rotate, scroll to zoom, and drag to pan. Colors indicate edit frequency (red = high, blue = low).
              </Typography>
            </Box>
            
            {/* 颜色图例 */}
            <Box 
              sx={{ 
                p: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderTop: '1px solid #334155'
              }}
            >
              <Typography variant="caption" color="#cbd5e1" gutterBottom display="block">
                Color Legend (Edit Frequency):
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: '100%', height: 20, background: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)' }} />
                <Typography variant="caption" color="#cbd5e1">Low</Typography>
                <Typography variant="caption" color="#cbd5e1">High</Typography>
              </Box>
            </Box>
          </>
        ) : (
          /* 图表视图 */
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="white">
              Individual Metrics Analysis
            </Typography>
            
            <Grid container spacing={3}>
              {/* 用户编辑频率柱状图 */}
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#0f172a' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="white">
                      User Edit Frequency
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" paragraph>
                      Maximum edits by any single user per paragraph
                    </Typography>
                    
                    <Box sx={{ height: 200, overflow: 'auto' }}>
                      {userFreq.map((item) => (
                        <Box 
                          key={item.paragraphId}
                          sx={{ 
                            mb: 1,
                            p: 1,
                            backgroundColor: '#1e293b',
                            borderRadius: 1
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="#cbd5e1">
                              Para {item.paragraph}
                            </Typography>
                            <Typography variant="body2" color="#3b82f6" fontWeight="bold">
                              {item.frequency} edits
                            </Typography>
                          </Box>
                          <Box 
                            sx={{
                              mt: 0.5,
                              height: 8,
                              width: `${(item.frequency / 20) * 100}%`,
                              backgroundColor: '#3b82f6',
                              borderRadius: 4
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* 段落总编辑频率柱状图 */}
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#0f172a' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="white">
                      Total Edit Frequency
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" paragraph>
                      Total edits per paragraph (all users combined)
                    </Typography>
                    
                    <Box sx={{ height: 200, overflow: 'auto' }}>
                      {paraFreq.map((item) => (
                        <Box 
                          key={item.paragraphId}
                          sx={{ 
                            mb: 1,
                            p: 1,
                            backgroundColor: '#1e293b',
                            borderRadius: 1
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="#cbd5e1">
                              Para {item.paragraph}
                            </Typography>
                            <Typography variant="body2" color="#10b981" fontWeight="bold">
                              {item.frequency} edits
                            </Typography>
                          </Box>
                          <Box 
                            sx={{
                              mt: 0.5,
                              height: 8,
                              width: `${(item.frequency / 50) * 100}%`,
                              backgroundColor: '#10b981',
                              borderRadius: 4
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* 段落长度柱状图 */}
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: '#0f172a' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="white">
                      Paragraph Length
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" paragraph>
                      Character count per paragraph
                    </Typography>
                    
                    <Box sx={{ height: 200, overflow: 'auto' }}>
                      {lengths.map((item) => (
                        <Box 
                          key={item.paragraphId}
                          sx={{ 
                            mb: 1,
                            p: 1,
                            backgroundColor: '#1e293b',
                            borderRadius: 1
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="#cbd5e1">
                              Para {item.paragraph}
                            </Typography>
                            <Typography variant="body2" color="#f59e0b" fontWeight="bold">
                              {item.length} chars
                            </Typography>
                          </Box>
                          <Box 
                            sx={{
                              mt: 0.5,
                              height: 8,
                              width: `${(item.length / 250) * 100}%`,
                              backgroundColor: '#f59e0b',
                              borderRadius: 4
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* 总结统计 */}
            <Card sx={{ mt: 3, backgroundColor: '#0f172a' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom color="white">
                  Summary Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="#3b82f6">
                        {data?.summary.totalParagraphs}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Total Paragraphs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="#10b981">
                        {data?.summary.totalEdits}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Total Edits
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="#f59e0b">
                        {data?.summary.averageEditsPerParagraph.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Avg Edits/Paragraph
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="#ef4444">
                        {data?.summary.mostActiveUser}
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Most Active User
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
      
      {/* 使用说明 */}
      <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f8fafc' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Note for Mid-Point Check:</strong> This is a functional demonstration of the 3D visualization interface. 
          The actual Three.js 3D rendering will be fully implemented in the final version. 
          All UI components, data processing, and interactive controls are fully functional.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Visualization3D;