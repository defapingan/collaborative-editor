// 文档处理工具函数
const documentProcessor = {
  extractParagraphs: (content) => {
    if (!content) return [];
    return content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  },
  
  calculateEditStats: (existingStats) => {
    const stats = existingStats || { totalSaves: 0, paragraphEdits: {} };
    return {
      totalSaves: (stats.totalSaves || 0) + 1,
      lastSavedAt: new Date(),
      paragraphEdits: stats.paragraphEdits || {}
    };
  },
  
  updateParagraphEdit: (paragraphEdits, paragraphId) => {
    const key = `paragraph_${paragraphId}`;
    return {
      ...paragraphEdits,
      [key]: (paragraphEdits[key] || 0) + 1
    };
  },
  
  validateDocumentTitle: (title) => {
    if (!title) return { valid: false, error: 'Title is required' };
    if (title.trim().length === 0) return { valid: false, error: 'Title cannot be empty' };
    if (title.length > 200) return { valid: false, error: 'Title exceeds 200 characters' };
    return { valid: true };
  },
  
  calculateComplexity: (text) => {
    if (!text) return { charCount: 0, wordCount: 0, sentenceCount: 0, complexity: 0 };
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    return {
      charCount,
      wordCount,
      sentenceCount,
      complexity: Math.min(1, (charCount / 500) + (sentenceCount / 20))
    };
  }
};

describe('Document Processing Unit Tests', () => {
  
  describe('Paragraph Extraction', () => {
    test('should extract paragraphs from text with double line breaks', () => {
      const content = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const paragraphs = documentProcessor.extractParagraphs(content);
      
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0]).toBe('First paragraph.');
    });

    test('should handle empty content', () => {
      const paragraphs = documentProcessor.extractParagraphs('');
      expect(paragraphs).toHaveLength(0);
    });

    test('should handle content without double line breaks', () => {
      const content = 'Single paragraph content.';
      const paragraphs = documentProcessor.extractParagraphs(content);
      
      expect(paragraphs).toHaveLength(1);
      expect(paragraphs[0]).toBe('Single paragraph content.');
    });

    test('should handle null content', () => {
      const paragraphs = documentProcessor.extractParagraphs(null);
      expect(paragraphs).toHaveLength(0);
    });

    test('should handle content with multiple spaces', () => {
      const content = 'Para 1\n\n\nPara 2\n\nPara 3';
      const paragraphs = documentProcessor.extractParagraphs(content);
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Statistics', () => {
    test('should initialize new edit stats', () => {
      const stats = documentProcessor.calculateEditStats(null);
      
      expect(stats.totalSaves).toBe(1);
      expect(stats.lastSavedAt).toBeDefined();
      expect(stats.paragraphEdits).toBeDefined();
    });

    test('should increment existing saves', () => {
      const existing = { totalSaves: 5, paragraphEdits: {} };
      const stats = documentProcessor.calculateEditStats(existing);
      
      expect(stats.totalSaves).toBe(6);
    });

    test('should update paragraph edit count', () => {
      let edits = {};
      edits = documentProcessor.updateParagraphEdit(edits, 1);
      expect(edits.paragraph_1).toBe(1);
      
      edits = documentProcessor.updateParagraphEdit(edits, 1);
      expect(edits.paragraph_1).toBe(2);
      
      edits = documentProcessor.updateParagraphEdit(edits, 2);
      expect(edits.paragraph_2).toBe(1);
      expect(edits.paragraph_1).toBe(2);
    });

    test('should preserve existing paragraph edits', () => {
      const existingEdits = { paragraph_1: 5, paragraph_3: 2 };
      const newEdits = documentProcessor.updateParagraphEdit(existingEdits, 2);
      
      expect(newEdits.paragraph_1).toBe(5);
      expect(newEdits.paragraph_2).toBe(1);
      expect(newEdits.paragraph_3).toBe(2);
    });
  });

  describe('Document Title Validation', () => {
    test('should validate valid title', () => {
      const result = documentProcessor.validateDocumentTitle('My Document');
      expect(result.valid).toBe(true);
    });

    test('should reject empty title', () => {
      const result = documentProcessor.validateDocumentTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    test('should reject whitespace-only title', () => {
      const result = documentProcessor.validateDocumentTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title cannot be empty');
    });

    test('should reject overly long title', () => {
      const longTitle = 'A'.repeat(201);
      const result = documentProcessor.validateDocumentTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Title exceeds 200 characters');
    });

    test('should accept title with exactly 200 characters', () => {
      const longTitle = 'A'.repeat(200);
      const result = documentProcessor.validateDocumentTitle(longTitle);
      expect(result.valid).toBe(true);
    });
  });

  describe('Text Complexity Calculation', () => {
    test('should calculate basic metrics', () => {
      const text = 'This is a test sentence. It has multiple words.';
      const metrics = documentProcessor.calculateComplexity(text);
      
      expect(metrics.charCount).toBeGreaterThan(0);
      expect(metrics.wordCount).toBeGreaterThan(0);
      expect(metrics.sentenceCount).toBe(2);
    });

    test('should handle empty text', () => {
      const metrics = documentProcessor.calculateComplexity('');
      
      expect(metrics.charCount).toBe(0);
      expect(metrics.wordCount).toBe(0);
      expect(metrics.sentenceCount).toBe(0);
      expect(metrics.complexity).toBe(0);
    });

    test('should handle null text', () => {
      const metrics = documentProcessor.calculateComplexity(null);
      
      expect(metrics.charCount).toBe(0);
      expect(metrics.wordCount).toBe(0);
      expect(metrics.sentenceCount).toBe(0);
      expect(metrics.complexity).toBe(0);
    });

    test('should cap complexity at 1', () => {
      const longText = 'A'.repeat(1000) + ' ' + 'B'.repeat(1000) + '!';
      const metrics = documentProcessor.calculateComplexity(longText);
      
      expect(metrics.complexity).toBeLessThanOrEqual(1);
    });
  });
});