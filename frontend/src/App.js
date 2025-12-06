import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import DocumentList from './components/DocumentList';
import Editor from './components/Editor';
import './App.css';

function App() {
    const [currentView, setCurrentView] = useState('login');
    const [user, setUser] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [systemStatus, setSystemStatus] = useState({ backend: 'checking', frontend: 'running' });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            setCurrentView('documents');
        }

        checkBackendStatus();
    }, []);

    const checkBackendStatus = async () => {
        try {
            const response = await fetch('http://localhost:3001');
            const data = await response.json();
            setSystemStatus({ backend: 'online', frontend: 'running', message: data.message });
        } catch (error) {
            setSystemStatus({ backend: 'offline', frontend: 'running', error: 'Cannot connect to backend' });
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        setCurrentView('documents');
    };

    const handleRegister = (userData) => {
        setUser(userData);
        setCurrentView('documents');
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setSelectedDocument(null);
        setCurrentView('login');
    };

    const handleSelectDocument = (document) => {
        setSelectedDocument(document);
        setCurrentView('editor');
    };

    const handleCreateDocument = () => {
        setSelectedDocument(null);
        setCurrentView('editor');
    };

    const handleBackToDocuments = () => {
        setSelectedDocument(null);
        setCurrentView('documents');
    };

    return (
        <div className="App">
            <header className="app-header">
                <h1>📝 Collaborative Editor</h1>
                <div className="header-info">
                    <div className="system-status">
                        <span className={`status-indicator ${systemStatus.backend}`}></span>
                        Backend: {systemStatus.backend}
                        <span className={`status-indicator ${systemStatus.frontend}`}></span>
                        Frontend: {systemStatus.frontend}
                    </div>
                    {user && (
                        <div className="user-info">
                            <span>👤 {user.email}</span>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>
            
            <main className="app-main">
                {currentView === 'login' && (
                    <Login 
                        onLogin={handleLogin}
                        onSwitchToRegister={() => setCurrentView('register')}
                    />
                )}
                
                {currentView === 'register' && (
                    <Register 
                        onRegister={handleRegister}
                        onSwitchToLogin={() => setCurrentView('login')}
                    />
                )}
                
                {currentView === 'documents' && (
                    <DocumentList 
                        onSelectDocument={handleSelectDocument}
                        onCreateDocument={handleCreateDocument}
                        user={user}
                    />
                )}
                
                {currentView === 'editor' && (
                    <Editor 
                        document={selectedDocument}
                        user={user}
                        onBack={handleBackToDocuments}
                    />
                )}
            </main>
            
            <footer className="app-footer">
                <p>Real-Time Collaborative Document Editor | Mid-Point Examination</p>
                <p>Features: 3D Visualization • Template Assessment • Real-time Collaboration</p>
            </footer>
        </div>
    );
}

export default App;