require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AgriConnect Server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is healthy!' });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

module.exports = app;