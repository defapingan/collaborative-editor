class DataCollector {
    constructor() {
        this.editMetrics = new Map();
    }

    recordEdit(documentId, paragraphId, userId, action) {
        if (!this.editMetrics.has(documentId)) {
            this.editMetrics.set(documentId, new Map());
        }
        
        const docMetrics = this.editMetrics.get(documentId);
        if (!docMetrics.has(paragraphId)) {
            docMetrics.set(paragraphId, {
                editCount: 0,
                editors: new Set(),
                lastUpdated: new Date(),
                totalLength: 0
            });
        }
        
        const paraMetrics = docMetrics.get(paragraphId);
        paraMetrics.editCount++;
        paraMetrics.editors.add(userId);
        paraMetrics.lastUpdated = new Date();
        
        console.log(`📊 Recorded edit: Document ${documentId}, Paragraph ${paragraphId}, User ${userId}`);
        return paraMetrics;
    }

    updateParagraphLength(documentId, paragraphId, length) {
        const docMetrics = this.editMetrics.get(documentId);
        if (docMetrics && docMetrics.has(paragraphId)) {
            docMetrics.get(paragraphId).totalLength = length;
        }
    }

    getVisualizationData(documentId) {
        const docMetrics = this.editMetrics.get(documentId);
        if (!docMetrics) return [];
        
        const data = [];
        let index = 0;
        
        for (const [paragraphId, metrics] of docMetrics) {
            const editCount = metrics.editCount;
            const editorCount = metrics.editors.size;
            const textLength = metrics.totalLength;
            
            data.push({
                id: paragraphId,
                x: index * 2,
                y: editCount,
                z: Math.min(textLength / 100, 10),
                editCount: editCount,
                editorCount: editorCount,
                textLength: textLength,
                color: this.getColorByEditCount(editCount),
                size: Math.min(textLength / 50, 3),
                lastUpdated: metrics.lastUpdated
            });
            index++;
        }
        
        console.log(`📈 Generated ${data.length} data points for visualization`);
        return data;
    }

    getColorByEditCount(editCount) {
        if (editCount === 0) return 0x666666;
        if (editCount < 3) return 0x00ff00;
        if (editCount < 10) return 0xffff00;
        if (editCount < 20) return 0xff9900;
        return 0xff0000;
    }

    getDocumentStats(documentId) {
        const docMetrics = this.editMetrics.get(documentId);
        if (!docMetrics) return null;
        
        let totalEdits = 0;
        let totalEditors = new Set();
        let totalLength = 0;
        
        for (const metrics of docMetrics.values()) {
            totalEdits += metrics.editCount;
            metrics.editors.forEach(editor => totalEditors.add(editor));
            totalLength += metrics.totalLength;
        }
        
        return {
            documentId: documentId,
            totalParagraphs: docMetrics.size,
            totalEdits: totalEdits,
            uniqueEditors: totalEditors.size,
            averageEditsPerParagraph: totalEdits / docMetrics.size,
            totalTextLength: totalLength,
            lastUpdated: new Date()
        };
    }
}

module.exports = new DataCollector();