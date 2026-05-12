// 文档服务类
class DocumentService {
  constructor(db) {
    this.db = db;
  }

  async validateDocumentAccess(document, userId) {
    if (!document) return { hasAccess: false, reason: 'Document not found' };
    if (document.ownerId === userId) return { hasAccess: true, role: 'owner' };
    
    const collaborator = document.collaborators?.find(c => c.userId === userId);
    if (collaborator && collaborator.status === 'active') {
      return { hasAccess: true, role: collaborator.role };
    }
    return { hasAccess: false, reason: 'No permission' };
  }

  canEdit(userRole) {
    return userRole === 'owner' || userRole === 'admin' || userRole === 'editor';
  }

  canShare(userRole) {
    return userRole === 'owner' || userRole === 'admin';
  }

  canDelete(userRole) {
    return userRole === 'owner';
  }

  canView(userRole) {
    return userRole === 'owner' || userRole === 'admin' || userRole === 'editor' || userRole === 'viewer';
  }

  getDefaultRole() {
    return 'viewer';
  }

  validateShareEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateVersion(content, userId) {
    return {
      versionId: `v${Date.now()}`,
      content: content,
      createdBy: userId,
      createdAt: new Date(),
      changeSummary: 'Auto-saved version'
    };
  }

  getCollaboratorCount(document) {
    if (!document || !document.collaborators) return { total: 0, active: 0 };
    const total = document.collaborators.length;
    const active = document.collaborators.filter(c => c.status === 'active').length;
    return { total, active };
  }
}

describe('Document Service Class Tests', () => {
  let service;
  const mockUserId = 'user123';
  const mockOwnerId = 'owner456';

  beforeEach(() => {
    service = new DocumentService(null);
  });

  describe('Access Control', () => {
    test('should grant access to document owner', async () => {
      const document = { ownerId: mockUserId, collaborators: [] };
      const result = await service.validateDocumentAccess(document, mockUserId);
      
      expect(result.hasAccess).toBe(true);
      expect(result.role).toBe('owner');
    });

    test('should grant access to active collaborator', async () => {
      const document = {
        ownerId: mockOwnerId,
        collaborators: [{ userId: mockUserId, status: 'active', role: 'editor' }]
      };
      const result = await service.validateDocumentAccess(document, mockUserId);
      
      expect(result.hasAccess).toBe(true);
      expect(result.role).toBe('editor');
    });

    test('should deny access to inactive collaborator', async () => {
      const document = {
        ownerId: mockOwnerId,
        collaborators: [{ userId: mockUserId, status: 'kicked', role: 'editor' }]
      };
      const result = await service.validateDocumentAccess(document, mockUserId);
      
      expect(result.hasAccess).toBe(false);
    });

    test('should deny access to non-collaborator', async () => {
      const document = { ownerId: mockOwnerId, collaborators: [] };
      const result = await service.validateDocumentAccess(document, mockUserId);
      
      expect(result.hasAccess).toBe(false);
    });

    test('should return document not found for null document', async () => {
      const result = await service.validateDocumentAccess(null, mockUserId);
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Document not found');
    });
  });

  describe('Permission Checks', () => {
    test('owner can edit', () => {
      expect(service.canEdit('owner')).toBe(true);
    });

    test('admin can edit', () => {
      expect(service.canEdit('admin')).toBe(true);
    });

    test('editor can edit', () => {
      expect(service.canEdit('editor')).toBe(true);
    });

    test('viewer cannot edit', () => {
      expect(service.canEdit('viewer')).toBe(false);
    });

    test('owner can share', () => {
      expect(service.canShare('owner')).toBe(true);
    });

    test('admin can share', () => {
      expect(service.canShare('admin')).toBe(true);
    });

    test('editor cannot share', () => {
      expect(service.canShare('editor')).toBe(false);
    });

    test('viewer cannot share', () => {
      expect(service.canShare('viewer')).toBe(false);
    });

    test('only owner can delete', () => {
      expect(service.canDelete('owner')).toBe(true);
      expect(service.canDelete('admin')).toBe(false);
      expect(service.canDelete('editor')).toBe(false);
      expect(service.canDelete('viewer')).toBe(false);
    });

    test('all roles can view', () => {
      expect(service.canView('owner')).toBe(true);
      expect(service.canView('admin')).toBe(true);
      expect(service.canView('editor')).toBe(true);
      expect(service.canView('viewer')).toBe(true);
    });
  });

  describe('Default Role', () => {
    test('should return viewer as default role', () => {
      expect(service.getDefaultRole()).toBe('viewer');
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email', () => {
      expect(service.validateShareEmail('user@example.com')).toBe(true);
      expect(service.validateShareEmail('name.surname@domain.co.uk')).toBe(true);
      expect(service.validateShareEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(service.validateShareEmail('user@')).toBe(false);
      expect(service.validateShareEmail('user@domain')).toBe(false);
      expect(service.validateShareEmail('user')).toBe(false);
      expect(service.validateShareEmail('')).toBe(false);
      expect(service.validateShareEmail('user@domain.')).toBe(false);
    });
  });

  describe('Version Generation', () => {
    test('should generate version object', () => {
      const content = 'Document content';
      const version = service.generateVersion(content, mockUserId);
      
      expect(version.content).toBe(content);
      expect(version.createdBy).toBe(mockUserId);
      expect(version.versionId).toMatch(/^v\d+$/);
      expect(version.createdAt).toBeInstanceOf(Date);
      expect(version.changeSummary).toBeDefined();
    });

    test('should generate version IDs that are strings', () => {
      const version1 = service.generateVersion('content1', mockUserId);
      const version2 = service.generateVersion('content2', mockUserId);
      
      expect(typeof version1.versionId).toBe('string');
      expect(typeof version2.versionId).toBe('string');
      expect(version1.versionId.length).toBeGreaterThan(0);
      expect(version2.versionId.length).toBeGreaterThan(0);
    });

    test('should include timestamp in version ID', () => {
      const version = service.generateVersion('content', mockUserId);
      
      expect(version.versionId).toMatch(/^v\d+$/);
      const timestamp = parseInt(version.versionId.substring(1));
      expect(timestamp).toBeLessThanOrEqual(Date.now());
      expect(timestamp).toBeGreaterThan(Date.now() - 10000);
    });
  });

  describe('Collaborator Count', () => {
    test('should return zero for document without collaborators', () => {
      const document = { collaborators: null };
      const counts = service.getCollaboratorCount(document);
      
      expect(counts.total).toBe(0);
      expect(counts.active).toBe(0);
    });

    test('should count total and active collaborators', () => {
      const document = {
        collaborators: [
          { userId: '1', status: 'active' },
          { userId: '2', status: 'active' },
          { userId: '3', status: 'kicked' },
          { userId: '4', status: 'quit' }
        ]
      };
      const counts = service.getCollaboratorCount(document);
      
      expect(counts.total).toBe(4);
      expect(counts.active).toBe(2);
    });

    test('should handle empty collaborators array', () => {
      const document = { collaborators: [] };
      const counts = service.getCollaboratorCount(document);
      
      expect(counts.total).toBe(0);
      expect(counts.active).toBe(0);
    });

    test('should handle null document', () => {
      const counts = service.getCollaboratorCount(null);
      
      expect(counts.total).toBe(0);
      expect(counts.active).toBe(0);
    });
  });
});