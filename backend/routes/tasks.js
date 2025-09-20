
const express = require('express');
const router = express.Router();

// Task Model
const Task = require('../models/Task');

// @route   POST api/tasks
// @desc    Create a task
// @access  Public
router.post('/', (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ msg: 'Title is required' });
        }

        if (typeof req.body.description !== 'string') {
            return res.status(400).json({ error: 'Description must be a string' });
    }

    const newTask = new Task({
        title: req.body.title,
        description: req.body.description
    });

    newTask.save()
        .then(task => res.status(201).json(task))
        .catch(err => {
            // Specific error handling for validation or casting errors
            if (err.name === 'ValidationError' || err.name === 'CastError') {
                return res.status(400).json({ error: `Invalid data: ${err.message}` });
            }
            // Generic error for other cases
            res.status(500).json({ error: 'Server error' });
        });
});

// @route   GET api/tasks
// @desc    Get all tasks
// @access  Public
router.get('/', (req, res) => {
    Task.find()
        .sort({ date: -1 })
        .then(tasks => res.json(tasks))
        .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;
