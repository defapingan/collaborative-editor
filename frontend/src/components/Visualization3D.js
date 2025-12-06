import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Visualization3D = ({ documentId, analyticsData, documentTitle }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const animationIdRef = useRef(null);
    
    useEffect(() => {
        if (!mountRef.current) return;
        
        const initThreeScene = () => {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            const camera = new THREE.PerspectiveCamera(
                75,
                mountRef.current.clientWidth / mountRef.current.clientHeight,
                0.1,
                1000
            );
            camera.position.z = 20;
            camera.position.y = 10;
            
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            mountRef.current.appendChild(renderer.domElement);
            
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 15);
            scene.add(directionalLight);
            
            const axesHelper = new THREE.AxesHelper(10);
            scene.add(axesHelper);
            
            const gridHelper = new THREE.GridHelper(20, 20);
            scene.add(gridHelper);
            
            sceneRef.current = scene;
            cameraRef.current = camera;
            rendererRef.current = renderer;
            
            const animate = () => {
                animationIdRef.current = requestAnimationFrame(animate);
                if (sceneRef.current && cameraRef.current) {
                    sceneRef.current.rotation.y += 0.005;
                }
                renderer.render(scene, camera);
            };
            animate();
            
            const handleResize = () => {
                if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
                
                cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            };
            
            window.addEventListener('resize', handleResize);
            
            return () => {
                window.removeEventListener('resize', handleResize);
                if (animationIdRef.current) {
                    cancelAnimationFrame(animationIdRef.current);
                }
                if (rendererRef.current) {
                    rendererRef.current.dispose();
                }
                if (mountRef.current && rendererRef.current?.domElement) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
            };
        };
        
        const cleanup = initThreeScene();
        return cleanup;
    }, []);
    
    useEffect(() => {
        if (!sceneRef.current || !analyticsData) return;
        
        const scene = sceneRef.current;
        
        const oldDataPoints = scene.children.filter(child => 
            child.userData && child.userData.isDataPoint
        );
        oldDataPoints.forEach(obj => scene.remove(obj));
        
        if (analyticsData.length === 0) {
            const noDataText = createTextMesh('No collaboration data available', 0, 5, 0);
            scene.add(noDataText);
            return;
        }
        
        analyticsData.forEach((data, index) => {
            const geometry = new THREE.SphereGeometry(data.size || 1, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: data.color || 0x00ff00,
                transparent: true,
                opacity: 0.8
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(data.x || index * 2, data.y || 0, data.z || 0);
            sphere.userData = {
                isDataPoint: true,
                editCount: data.editCount,
                editorCount: data.editorCount,
                textLength: data.textLength
            };
            
            scene.add(sphere);
            
            const label = createTextMesh(
                `P${index}: ${data.editCount} edits`,
                data.x || index * 2,
                (data.y || 0) + 1.5,
                data.z || 0
            );
            scene.add(label);
        });
        
        const titleText = createTextMesh(
            `Document: ${documentTitle || 'Untitled'}`,
            0,
            15,
            0,
            1.5
        );
        scene.add(titleText);
        
        const statsText = createTextMesh(
            `Total Paragraphs: ${analyticsData.length}`,
            0,
            13,
            0,
            1
        );
        scene.add(statsText);
        
    }, [analyticsData, documentTitle]);
    
    const createTextMesh = (text, x, y, z, size = 1) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 48px Arial';
        context.fillStyle = '#333333';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(size * 5, size * 2.5, 1);
        
        return sprite;
    };
    
    return (
        <div className="visualization-3d">
            <div style={{ 
                padding: '1rem', 
                background: 'white',
                borderBottom: '1px solid #dee2e6'
            }}>
                <h3 style={{ margin: 0 }}>3D Collaboration Visualization</h3>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                    X: Paragraph Position | Y: Edit Frequency | Z: Text Length
                    <br/>
                    Color: Green (Low) → Yellow → Red (High edits)
                </p>
            </div>
            <div 
                ref={mountRef} 
                style={{ 
                    width: '100%', 
                    height: '500px',
                    border: '1px solid #dee2e6'
                }}
            />
            {analyticsData && (
                <div style={{ 
                    padding: '1rem', 
                    background: '#f8f9fa',
                    borderTop: '1px solid #dee2e6'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>Document:</strong> {documentTitle || 'Untitled'}
                        </div>
                        <div>
                            <strong>Data Points:</strong> {analyticsData.length} paragraphs
                        </div>
                        <div>
                            <strong>Total Edits:</strong> {analyticsData.reduce((sum, d) => sum + (d.editCount || 0), 0)}
                        </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                        Rotate view by clicking and dragging | Scroll to zoom
                    </div>
                </div>
            )}
        </div>
    );
};

export default Visualization3D;