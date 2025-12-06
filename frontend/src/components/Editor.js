import React, { useState, useEffect, useRef } from 'react';
import Visualization3D from './Visualization3D';
import { websocketService } from '../services/websocket';
import { documentAPI } from '../services/api';
import { analyticsAPI } from '../services/api';

function Editor({ document: propDocument, user, onBack }) {
    const [document, setDocument] = useState(propDocument || { title: '', content: '' });
    const [title, setTitle] = useState(propDocument?.title || 'New Document');
    const [content, setContent] = useState(propDocument?.content || '');
    const [showVisualization, setShowVisualization] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const contentRef = useRef('');
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (document._id && user) {
            websocketService.connect(document._id, user.id);
            
            websocketService.on('text-update', (data) => {
                if (data.userId !== user.id) {
                    setContent(data.content);
                }
            });
            
            websocketService.on('analytics-data', (data) => {
                setAnalyticsData(data.data);
            });
        }
        
        return () => {
            websocketService.disconnect();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [document._id, user]);

    useEffect(() => {
        contentRef.current = content;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            autoSave();
        }, 2000);
        
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [content]);

    const autoSave = async () => {
        if (!document._id || !user || !content.trim()) return;
        
        try {
            await documentAPI.update(document._id, content, document.version || 1);
            
            const paragraphs = content.split('\n\n');
            paragraphs.forEach((paragraph, index) => {
                if (paragraph.trim()) {
                    websocketService.send({
                        type: 'text-update',
                        documentId: document._id,
                        paragraphId: `para_${index}`,
                        userId: user.id,
                        content: paragraph,
                        version: document.version || 1
                    });
                }
            });
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    };

    const handleSaveDocument = async () => {
        if (!title.trim()) {
            setSaveMessage('Please enter a document title');
            return;
        }
        
        setIsSaving(true);
        setSaveMessage('Saving...');
        
        try {
            let result;
            if (document._id) {
                result = await documentAPI.update(document._id, content, document.version || 1);
            } else {
                result = await documentAPI.create(title, content);
                setDocument({ ...document, _id: result.id });
                websocketService.connect(result.id, user.id);
            }
            
            setSaveMessage('Document saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Error saving document: ' + error.message);
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShowVisualization = async () => {
        const newShowState = !showVisualization;
        setShowVisualization(newShowState);
        
        if (newShowState && document._id) {
            try {
                const data = await analyticsAPI.getVisualization(document._id);
                setAnalyticsData(data.dataPoints);
                
                websocketService.send({
                    type: 'request-analytics',
                    documentId: document._id
                });
            } catch (error) {
                console.error('Failed to load visualization data:', error);
            }
        }
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        
        if (document._id && user) {
            const paragraphs = newContent.split('\n\n');
            paragraphs.forEach((paragraph, index) => {
                if (paragraph.trim()) {
                    websocketService.send({
                        type: 'text-update',
                        documentId: document._id,
                        paragraphId: `para_${index}`,
                        userId: user.id,
                        content: paragraph,
                        action: 'edit'
                    });
                }
            });
        }
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Document Title"
                        style={{
                            fontSize: '1.2rem',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 'bold',
                            width: '300px'
                        }}
                    />
                    {saveMessage && (
                        <span style={{ marginLeft: '1rem', color: '#4CAF50', fontSize: '0.9rem' }}>
                            {saveMessage}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleShowVisualization} className="viz-button">
                        {showVisualization ? 'Hide 3D View' : 'Show 3D Analysis'}
                    </button>
                    <button onClick={handleSaveDocument} className="primary-button" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Document'}
                    </button>
                    <button onClick={onBack} className="logout-btn" style={{ background: '#666' }}>
                        Back to List
                    </button>
                </div>
            </div>
            
            {showVisualization ? (
                <div style={{ padding: '1rem' }}>
                    <Visualization3D 
                        documentId={document._id}
                        analyticsData={analyticsData}
                        documentTitle={title}
                    />
                </div>
            ) : (
                <div className="text-editor">
                    <textarea
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Start typing your document here...
                        
You can collaborate in real-time with others.
Each paragraph will be tracked for 3D visualization."
                        className="editor-textarea"
                    />
                </div>
            )}
            
            <div style={{ 
                padding: '1rem', 
                background: '#f8f9fa', 
                borderTop: '1px solid #dee2e6',
                fontSize: '0.9rem',
                color: '#666'
            }}>
                <p>
                    <strong>Real-time Collaboration:</strong> {document._id ? 'Connected' : 'Create document to enable'}
                    {document._id && ' | Changes auto-save every 2 seconds'}
                </p>
                <p>
                    <strong>3D Visualization:</strong> Click "Show 3D Analysis" to see edit patterns
                </p>
            </div>
        </div>
    );
}

export default Editor;