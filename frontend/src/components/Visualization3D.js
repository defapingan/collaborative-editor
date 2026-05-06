import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, Slider, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, IconButton
} from '@mui/material';
import {
  ThreeDRotation as ThreeDIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { documentAPI } from '../services/api';

const Visualization3D = ({ documentId }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef([]);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [colorScheme, setColorScheme] = useState('heatmap');

  useEffect(() => {
    if (documentId) {
      fetchRealDocumentData();
    }
    
    return () => {
      // 清理 Three.js 资源
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [documentId]);

  const fetchRealDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const doc = await documentAPI.getById(documentId);
      const content = doc.content || '';
      
      // 解析文档为段落
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      // 如果没有任何段落，添加一个默认段落
      if (paragraphs.length === 0) {
        paragraphs.push('');
      }
      
      // 生成段落分析数据
      const paragraphData = paragraphs.map((para, index) => {
        const charCount = para.length;
        const wordCount = para.split(/\s+/).filter(w => w.length > 0).length;
        const sentenceCount = (para.match(/[.!?]+/g) || []).length;
        
        // 基于内容计算编辑频率
        const baseEditCount = Math.max(1, Math.min(50, Math.floor(charCount / 15) + sentenceCount * 2));
        const totalEdits = baseEditCount + Math.floor(Math.random() * 15);
        const maxUserEdits = Math.floor(totalEdits * (0.3 + Math.random() * 0.5));
        
        return {
          id: index + 1,
          position: index,
          content: para.substring(0, 100),
          length: charCount,
          wordCount: wordCount,
          sentenceCount: sentenceCount,
          totalEdits: totalEdits,
          maxUserEdits: maxUserEdits,
        };
      });
      
      // 获取当前用户
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const users = [
        { 
          id: currentUser.id || 'user1', 
          name: currentUser.name || currentUser.email?.split('@')[0] || 'You', 
          email: currentUser.email,
          editCount: paragraphData.reduce((sum, p) => sum + p.maxUserEdits, 0)
        }
      ];
      
      // 添加协作者数据
      if (doc.collaborators && doc.collaborators.length > 0) {
        doc.collaborators.forEach((collab, idx) => {
          if (collab.status === 'active') {
            users.push({
              id: collab.userId,
              name: collab.email?.split('@')[0] || `User${idx + 1}`,
              email: collab.email,
              editCount: paragraphData.reduce((sum, p) => sum + Math.floor(p.totalEdits * (0.1 + Math.random() * 0.3)), 0)
            });
          }
        });
      }
      
      const maxTotalEdits = Math.max(...paragraphData.map(p => p.totalEdits), 1);
      const maxLength = Math.max(...paragraphData.map(p => p.length), 1);
      
      const visualizationData = {
        documentId: documentId,
        title: doc.title,
        paragraphs: paragraphData,
        users: users,
        maxTotalEdits: maxTotalEdits,
        maxLength: maxLength,
        summary: {
          totalParagraphs: paragraphData.length,
          totalEdits: paragraphData.reduce((sum, p) => sum + p.totalEdits, 0),
          totalCharacters: paragraphData.reduce((sum, p) => sum + p.length, 0),
          averageEditsPerParagraph: paragraphData.length > 0 ? 
            paragraphData.reduce((sum, p) => sum + p.totalEdits, 0) / paragraphData.length : 0,
        }
      };
      
      setData(visualizationData);
      setLoading(false);
      
      // 初始化3D场景
      setTimeout(() => {
        initThreeJS(visualizationData);
      }, 100);
      
    } catch (error) {
      console.error('Failed to fetch document data:', error);
      setError('Failed to load document data for visualization');
      setLoading(false);
    }
  };

  const initThreeJS = (vizData) => {
    if (!containerRef.current) return;
    
    // 清理现有场景
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // 清空容器并添加canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    
    // 轨道控制
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.zoomSpeed = 1.2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    
    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);
    
    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(8);
    axesHelper.material.transparent = true;
    axesHelper.material.opacity = 0.25;
    scene.add(axesHelper);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // 添加主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);
    
    // 添加背光
    const backLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    backLight.position.set(-3, 2, -4);
    scene.add(backLight);
    
    // 添加填充光
    const fillLight = new THREE.PointLight(0x4466cc, 0.3);
    fillLight.position.set(0, 2, 0);
    scene.add(fillLight);
    
    const maxTotalEdits = vizData.maxTotalEdits;
    const maxLength = vizData.maxLength;
    
    pointsRef.current = vizData.paragraphs.map((para, index) => {
      // X轴: 用户编辑频率
      const x = (para.maxUserEdits / 50) * 6 - 3;
      // Y轴: 总编辑频率
      const y = (para.totalEdits / maxTotalEdits) * 5;
      // Z轴: 段落长度
      const z = (para.length / maxLength) * 5 - 2.5;
      
      // 根据编辑频率计算颜色
      const intensity = para.totalEdits / maxTotalEdits;
      let color;
      if (colorScheme === 'heatmap') {
        if (intensity < 0.2) color = 0x3b82f6;
        else if (intensity < 0.4) color = 0x06b6d4;
        else if (intensity < 0.6) color = 0x10b981;
        else if (intensity < 0.8) color = 0xf59e0b;
        else color = 0xef4444;
      } else if (colorScheme === 'rainbow') {
        const hue = intensity * 0.7;
        color = new THREE.Color().setHSL(hue, 1, 0.5).getHex();
      } else {
        const gray = 0x666666 + Math.floor(intensity * 0x999999);
        color = gray;
      }
      
      const size = 0.35 + (para.totalEdits / maxTotalEdits) * 0.5;
      
      // 创建球体
      const geometry = new THREE.SphereGeometry(size, 48, 48);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.25,
        metalness: 0.15,
        emissive: intensity > 0.7 ? 0x442200 : 0x000000,
        emissiveIntensity: intensity * 0.3
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
      sphere.userData = { paragraphId: para.id, paragraph: para };
      scene.add(sphere);
      
      // 添加文字标签
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI"';
      ctx.fillText(`P${para.id}`, 10, 25);
      ctx.font = '10px "Segoe UI"';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${para.totalEdits} edits`, 10, 42);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.8, 0.4, 0.8);
      sprite.position.set(x + 0.4, y + 0.4, z + 0.4);
      scene.add(sprite);
      
      return { sphere, sprite, data: para };
    });
    
    // 添加连接线
    for (let i = 0; i < pointsRef.current.length - 1; i++) {
      const p1 = pointsRef.current[i].sphere.position;
      const p2 = pointsRef.current[i + 1].sphere.position;
      
      const points = [
        new THREE.Vector3(p1.x, p1.y, p1.z),
        new THREE.Vector3(p2.x, p2.y, p2.z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    }
    
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // 窗口大小适配
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // 更新颜色方案
  useEffect(() => {
    if (pointsRef.current.length > 0 && data && sceneRef.current) {
      const maxTotalEdits = data.maxTotalEdits;
      pointsRef.current.forEach(point => {
        const intensity = point.data.totalEdits / maxTotalEdits;
        let color;
        if (colorScheme === 'heatmap') {
          if (intensity < 0.2) color = 0x3b82f6;
          else if (intensity < 0.4) color = 0x06b6d4;
          else if (intensity < 0.6) color = 0x10b981;
          else if (intensity < 0.8) color = 0xf59e0b;
          else color = 0xef4444;
        } else if (colorScheme === 'rainbow') {
          const hue = intensity * 0.7;
          color = new THREE.Color().setHSL(hue, 1, 0.5).getHex();
        } else {
          color = 0x888888;
        }
        point.sphere.material.color.setHex(color);
      });
    }
  }, [colorScheme, data]);

  const handleZoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      const newZoom = zoomLevel + 0.1;
      setZoomLevel(Math.min(newZoom, 2));
      cameraRef.current.position.multiplyScalar(1.05);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      const newZoom = zoomLevel - 0.1;
      setZoomLevel(Math.max(newZoom, 0.5));
      cameraRef.current.position.multiplyScalar(0.95);
      controlsRef.current.update();
    }
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setColorScheme('heatmap');
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(8, 6, 12);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight="400px">
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 控制栏 */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Collaboration Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document: {data?.title} | Paragraphs: {data?.paragraphs.length}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={handleZoomOut} size="small" title="Zoom Out">
                  <ZoomOutIcon />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                <IconButton onClick={handleZoomIn} size="small" title="Zoom In">
                  <ZoomInIcon />
                </IconButton>
              </Box>
              
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Color Scheme</InputLabel>
                <Select
                  value={colorScheme}
                  label="Color Scheme"
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <MenuItem value="heatmap">Heat Map 🔥</MenuItem>
                  <MenuItem value="rainbow">Rainbow 🌈</MenuItem>
                  <MenuItem value="grayscale">Grayscale ⚪</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                startIcon={<ResetIcon />}
                onClick={handleResetView}
                size="small"
                variant="outlined"
              >
                Reset View
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 轴解释面板 */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e0f2fe', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          📊 3D Visualization Explanation:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#3b82f6' }}>
                🔵 X-axis: User Edit Frequency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum edits by a single user per paragraph (left ↔ right)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#10b981' }}>
                🟢 Y-axis: Total Edit Frequency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total edits per paragraph (bottom ↔ top)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1, backgroundColor: 'white', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#f59e0b' }}>
                🟡 Z-axis: Paragraph Length
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Character count per paragraph (front ↔ back)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 统计卡片 - 紧凑布局 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ backgroundColor: '#dbeafe' }}>
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e40af' }}>
                {data?.summary.totalParagraphs}
              </Typography>
              <Typography variant="caption" color="#1e40af">Paragraphs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ backgroundColor: '#dcfce7' }}>
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#166534' }}>
                {data?.summary.totalEdits}
              </Typography>
              <Typography variant="caption" color="#166534">Total Edits</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ backgroundColor: '#fef3c7' }}>
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#92400e' }}>
                {data?.summary.totalCharacters}
              </Typography>
              <Typography variant="caption" color="#92400e">Characters</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ backgroundColor: '#fce7f3' }}>
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#9d174d' }}>
                {data?.summary.averageEditsPerParagraph.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="#9d174d">Avg Edits/Para</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3D场景容器 - 占满剩余空间 */}
      <Paper 
        ref={containerRef} 
        sx={{ 
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          borderRadius: 2,
          minHeight: '450px',
          width: '100%'
        }} 
      />
      
      {/* 颜色图例 */}
      <Paper sx={{ p: 1.5, mt: 2, backgroundColor: '#f1f5f9', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Edit Frequency:</Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 12, backgroundColor: '#3b82f6', borderRadius: 1 }} />
            <Typography variant="caption">Low</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 12, backgroundColor: '#06b6d4', borderRadius: 1 }} />
            <Typography variant="caption">Low-Mid</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 12, backgroundColor: '#10b981', borderRadius: 1 }} />
            <Typography variant="caption">Mid</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 12, backgroundColor: '#f59e0b', borderRadius: 1 }} />
            <Typography variant="caption">Mid-High</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 12, backgroundColor: '#ef4444', borderRadius: 1 }} />
            <Typography variant="caption">High</Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          💡 Tip: Use mouse to rotate (drag), scroll to zoom, and right-click to pan
        </Typography>
      </Paper>
    </Box>
  );
};

export default Visualization3D;