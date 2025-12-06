const templateSchema = {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    structure: { type: Object, required: true },
    ownerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false }
};

module.exports = templateSchema;