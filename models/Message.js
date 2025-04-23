const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
