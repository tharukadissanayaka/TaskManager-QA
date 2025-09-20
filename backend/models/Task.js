
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const TaskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                // Ensure the value is a string if it exists
                return typeof v === 'string' || v == null;
            },
            message: 'Description must be a string.'
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', TaskSchema);
