const userSchema = {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true }
    }
};

module.exports = userSchema;