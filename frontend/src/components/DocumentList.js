import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';

function DocumentList({ onSelectDocument, onCreateDocument, user }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (user) {
            loadDocuments();
        }
    }, [user]);
    
    const loadDocuments = async () => {
        try {
            setLoading(true);
            const docs = await documentAPI.getAll();
            setDocuments(docs);
        } catch (error) {
            setError('Failed to load documents');
            console.error('Load documents error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteDocument = async (documentId, e) => {
        e.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }
        
        try {
            await documentAPI.delete(documentId);
            setDocuments(documents.filter(doc => doc._id !== documentId));
        } catch (error) {
            setError('Failed to delete document');
            console.error('Delete document error:', error);
        }
    };
    
    if (loading) {
        return <div className="loading">Loading documents...</div>;
    }
    
    return (
        <div className="document-list">
            <div className="document-list-header">
                <h2>My Documents</h2>
                <button onClick={onCreateDocument} className="primary-button">
                    Create New Document
                </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {documents.length === 0 ? (
                <div className="empty-state">
                    <p>No documents yet. Create your first document to get started!</p>
                    <button onClick={onCreateDocument} className="primary-button" style={{ marginTop: '1rem' }}>
                        Create First Document
                    </button>
                </div>
            ) : (
                <div className="documents-grid">
                    {documents.map(document => (
                        <div
                            key={document._id}
                            className="document-card"
                            onClick={() => onSelectDocument(document)}
                        >
                            <h3>{document.title || 'Untitled Document'}</h3>
                            <p>Created: {new Date(document.createdAt).toLocaleDateString()}</p>
                            <p>Last updated: {new Date(document.updatedAt).toLocaleDateString()}</p>
                            <div className="document-actions">
                                <button
                                    onClick={(e) => handleDeleteDocument(document._id, e)}
                                    className="danger-button"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DocumentList;