const documentSchema = {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    ownerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    collaborators: [{ userId: String, role: String }],
    tags: [String],
    isPublic: { type: Boolean, default: false }
};

module.exports = documentSchema;