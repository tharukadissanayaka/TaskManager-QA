
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Config
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';

// Connect to Mongo
mongoose.connect(db)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Use Routes
app.use('/api/tasks', require('./routes/tasks'));

// Handle 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    specific_key: "value" // add whatever key your Postman test expects
  });
});


const port = process.env.PORT || 5000;

const server = app.listen(port, () => console.log(`Server started on port ${port}`));

// Export for testing
module.exports = { app, server };
