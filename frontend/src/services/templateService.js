// frontend/src/services/templateService.js - 增强功能
import api from './api';

export const templateService = {
  // 1. 模板管理
  createTemplate: async (templateData) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  getUserTemplates: async () => {
    const response = await api.get('/templates');
    return response.data;
  },

  deleteTemplate: async (templateId) => {
    await api.delete(`/templates/${templateId}`);
  },

  // 2. 文档评估
  assessDocument: async (documentId, templateId, options = {}) => {
    const response = await api.post(`/documents/${documentId}/assess`, {
      templateId,
      options
    });
    return response.data;
  },

  // 3. 预定义模板（用于演示）
  getPredefinedTemplates: () => {
    return [
      {
        id: 'research-paper',
        name: 'Research Paper Template',
        description: 'Standard academic research paper structure',
        sections: [
          { name: 'Title', required: true, minParagraphs: 1 },
          { name: 'Abstract', required: true, minParagraphs: 1 },
          { name: 'Introduction', required: true, minParagraphs: 3 },
          { name: 'Literature Review', required: false, minParagraphs: 2 },
          { name: 'Methodology', required: true, minParagraphs: 4 },
          { name: 'Results', required: true, minParagraphs: 3 },
          { name: 'Discussion', required: true, minParagraphs: 3 },
          { name: 'Conclusion', required: true, minParagraphs: 2 },
          { name: 'References', required: true, minParagraphs: 1 }
        ],
        rules: {
          requireAbstract: true,
          requireReferences: true,
          minTotalParagraphs: 20
        }
      },
      {
        id: 'business-report',
        name: 'Business Report Template',
        description: 'Professional business analysis report',
        sections: [
          { name: 'Executive Summary', required: true, minParagraphs: 2 },
          { name: 'Introduction', required: true, minParagraphs: 2 },
          { name: 'Methodology', required: false, minParagraphs: 1 },
          { name: 'Findings', required: true, minParagraphs: 4 },
          { name: 'Analysis', required: true, minParagraphs: 3 },
          { name: 'Recommendations', required: true, minParagraphs: 3 },
          { name: 'Conclusion', required: true, minParagraphs: 2 },
          { name: 'Appendices', required: false, minParagraphs: 0 }
        ],
        rules: {
          requireExecutiveSummary: true,
          requireRecommendations: true,
          minTotalParagraphs: 16
        }
      },
      {
        id: 'technical-spec',
        name: 'Technical Specification',
        description: 'Technical documentation and specifications',
        sections: [
          { name: 'Overview', required: true, minParagraphs: 2 },
          { name: 'Requirements', required: true, minParagraphs: 3 },
          { name: 'Design', required: true, minParagraphs: 4 },
          { name: 'Implementation', required: true, minParagraphs: 4 },
          { name: 'Testing', required: true, minParagraphs: 2 },
          { name: 'Deployment', required: true, minParagraphs: 2 },
          { name: 'Maintenance', required: false, minParagraphs: 1 }
        ],
        rules: {
          requireDesignSection: true,
          requireTestingSection: true,
          minTotalParagraphs: 18
        }
      }
    ];
  },

  // 4. 解析上传的模板文件
  parseTemplateFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          
          // 尝试解析JSON
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const template = JSON.parse(content);
            resolve(this.validateTemplateStructure(template));
          }
          // 解析文本格式
          else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const template = this.parseTextTemplate(content);
            resolve(template);
          }
          else {
            reject(new Error('Unsupported file format. Use .json or .txt'));
          }
        } catch (error) {
          reject(new Error('Failed to parse template file: ' + error.message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // 5. 解析文本格式模板
  parseTextTemplate: (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const sections = lines.map(line => {
      // 解析格式: "Section Name [required] [min:3]"
      const parts = line.split(' ');
      const name = parts[0];
      const required = line.includes('[required]');
      const minMatch = line.match(/\[min:(\d+)\]/);
      const minParagraphs = minMatch ? parseInt(minMatch[1]) : 1;
      
      return { name, required, minParagraphs };
    });

    return {
      name: 'Custom Template',
      description: 'Uploaded from text file',
      sections: sections,
      rules: {
        minTotalParagraphs: sections.reduce((sum, section) => sum + section.minParagraphs, 0)
      }
    };
  },

  // 6. 验证模板结构
  validateTemplateStructure: (template) => {
    const requiredFields = ['name', 'sections'];
    
    for (const field of requiredFields) {
      if (!template[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(template.sections)) {
      throw new Error('Sections must be an array');
    }

    // 验证每个section的结构
    template.sections.forEach((section, index) => {
      if (!section.name) {
        throw new Error(`Section ${index + 1} missing name`);
      }
      if (section.required === undefined) {
        section.required = true; // 默认设为required
      }
      if (!section.minParagraphs) {
        section.minParagraphs = 1; // 默认最小段落数
      }
    });

    return template;
  },

  // 7. 模拟评估（用于中期演示）
  simulateAssessment: (document, template) => {
    // 模拟文档结构分析
    const documentSections = this.extractDocumentSections(document);
    
    // 对比模板
    const analysis = {
      templateName: template.name,
      documentTitle: document.title || 'Untitled Document',
      timestamp: new Date().toISOString(),
      
      // 结构对比
      structureAnalysis: {
        totalTemplateSections: template.sections.length,
        totalDocumentSections: documentSections.length,
        matchingSections: [],
        missingSections: [],
        extraSections: []
      },
      
      // 完整性评估
      completenessAnalysis: {
        overallScore: 0,
        sectionScores: {},
        recommendations: []
      },
      
      // 详细报告
      detailedReport: {}
    };

    // 分析每个模板section
    template.sections.forEach(templateSection => {
      const found = documentSections.find(docSection => 
        this.sectionNameMatches(docSection.name, templateSection.name)
      );

      if (found) {
        analysis.structureAnalysis.matchingSections.push({
          templateSection: templateSection.name,
          documentSection: found.name,
          paragraphCount: found.paragraphCount,
          requiredMinimum: templateSection.minParagraphs,
          meetsRequirement: found.paragraphCount >= templateSection.minParagraphs
        });
        
        // 计算该section的分数
        const sectionScore = Math.min(100, (found.paragraphCount / templateSection.minParagraphs) * 100);
        analysis.completenessAnalysis.sectionScores[templateSection.name] = sectionScore;
        
        if (!templateSection.required && found.paragraphCount < templateSection.minParagraphs) {
          analysis.completenessAnalysis.recommendations.push(
            `Consider expanding "${found.name}" section (${found.paragraphCount} paragraphs, recommended: ${templateSection.minParagraphs}+)`
          );
        }
      } else if (templateSection.required) {
        analysis.structureAnalysis.missingSections.push(templateSection.name);
        analysis.completenessAnalysis.recommendations.push(
          `Add "${templateSection.name}" section (required)`
        );
      }
    });

    // 识别额外sections
    documentSections.forEach(docSection => {
      const hasMatch = template.sections.some(templateSection =>
        this.sectionNameMatches(docSection.name, templateSection.name)
      );
      if (!hasMatch) {
        analysis.structureAnalysis.extraSections.push(docSection.name);
      }
    });

    // 计算总体分数
    const requiredSections = template.sections.filter(s => s.required);
    const foundRequiredSections = requiredSections.filter(reqSection =>
      documentSections.some(docSection =>
        this.sectionNameMatches(docSection.name, reqSection.name)
      )
    ).length;

    const structureScore = (foundRequiredSections / requiredSections.length) * 50;
    
    // 段落完整性分数
    const completenessScores = Object.values(analysis.completenessAnalysis.sectionScores);
    const avgCompletenessScore = completenessScores.length > 0 
      ? completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length 
      : 0;
    
    analysis.completenessAnalysis.overallScore = Math.round(
      structureScore + (avgCompletenessScore * 0.5)
    );

    return analysis;
  },

  // 8. 辅助函数：提取文档结构
  extractDocumentSections: (document) => {
    // 模拟文档结构提取
    // 实际实现应该分析文档内容，识别标题和段落
    return [
      { name: 'Introduction', paragraphCount: 3 },
      { name: 'Methodology', paragraphCount: 5 },
      { name: 'Results', paragraphCount: 4 },
      { name: 'Discussion', paragraphCount: 3 }
    ];
  },

  // 9. 辅助函数：匹配section名称
  sectionNameMatches: (docSectionName, templateSectionName) => {
    // 简单的名称匹配（可扩展为更智能的匹配）
    const docName = docSectionName.toLowerCase().replace(/[^a-z]/g, '');
    const templateName = templateSectionName.toLowerCase().replace(/[^a-z]/g, '');
    return docName.includes(templateName) || templateName.includes(docName);
  }
};

export default templateService;