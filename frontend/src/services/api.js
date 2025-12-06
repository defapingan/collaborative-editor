const API_BASE_URL = 'http://localhost:3001/api';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `API request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

export const authAPI = {
    login: (email, password) => 
        apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password },
        }),
    
    register: (email, password) => 
        apiRequest('/auth/register', {
            method: 'POST',
            body: { email, password },
        }),
};

export const documentAPI = {
    getAll: () => 
        apiRequest('/documents'),
    
    getById: (id) => 
        apiRequest(`/documents/${id}`),
    
    create: (title, content = '') => 
        apiRequest('/documents', {
            method: 'POST',
            body: { title, content },
        }),
    
    update: (id, content, version) => 
        apiRequest(`/documents/${id}`, {
            method: 'PUT',
            body: { content, version },
        }),
    
    delete: (id) => 
        apiRequest(`/documents/${id}`, {
            method: 'DELETE',
        }),
};

export const analyticsAPI = {
    getVisualization: (documentId) => 
        apiRequest(`/analytics/visualization/${documentId}`),
    
    createTemplate: (name, structure, description = '') => 
        apiRequest('/analytics/templates', {
            method: 'POST',
            body: { name, structure, description },
        }),
    
    getTemplate: (templateId) => 
        apiRequest(`/analytics/templates/${templateId}`),
};

export default apiRequest;