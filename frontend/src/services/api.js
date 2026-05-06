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
        
        let data;
        const text = await response.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { message: text };
            }
        } else {
            data = {};
        }
        
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
    
    getMe: () => 
        apiRequest('/auth/me'),
};

export const documentAPI = {
    getAll: () => 
        apiRequest('/documents'),
    
    getById: (id) => 
        apiRequest(`/documents/${id}`),
    
    // 【修复】create 返回的文档对象包含 id 字段
    create: async (title, content = '') => {
        const result = await apiRequest('/documents', {
            method: 'POST',
            body: { title, content },
        });
        // 确保返回的对象有 id 字段
        return {
            id: result.id || result._id,
            _id: result._id || result.id,
            title: result.title,
            content: result.content,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            ownerId: result.ownerId,
            ownerEmail: result.ownerEmail,
            version: result.version,
            editStats: result.editStats
        };
    },
    
    update: (id, content, title) => 
        apiRequest(`/documents/${id}`, {
            method: 'PUT',
            body: { content, title },
        }),
    
    delete: (id) => 
        apiRequest(`/documents/${id}`, {
            method: 'DELETE',
        }),
    
    share: (id, email, role = 'editor') => 
        apiRequest(`/documents/${id}/share`, {
            method: 'POST',
            body: { email, role },
        }),
    
    quit: (id) => 
        apiRequest(`/documents/${id}/quit`, {
            method: 'POST',
        }),
    
    updateCollaborator: (id, collaboratorId, role) => 
        apiRequest(`/documents/${id}/collaborator`, {
            method: 'PUT',
            body: { collaboratorId, role },
        }),
    
    kickCollaborator: (id, collaboratorId) => 
        apiRequest(`/documents/${id}/collaborator`, {
            method: 'PUT',
            body: { collaboratorId, action: 'kick' },
        }),
    
    getSharedWithMe: () => 
        apiRequest('/documents/shared-with-me'),
    
    getSharingWithOthers: () => 
        apiRequest('/documents/sharing-with-others'),
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