const documentSchema = {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    ownerId: { type: String, required: true },
    ownerEmail: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    collaborators: [{ 
        userId: String, 
        email: String,
        role: String, 
        status: String,
        joinedAt: Date
    }],
    tags: [String],
    isPublic: { type: Boolean, default: false },
    // 新增：编辑统计
    editStats: {
        totalSaves: { type: Number, default: 0 },      // 总保存次数
        lastSavedAt: { type: Date, default: null },    // 最后保存时间
        paragraphEdits: { type: Object, default: {} }   // 各段落编辑次数
    }
};

module.exports = documentSchema;