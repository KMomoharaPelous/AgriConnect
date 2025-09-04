const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Test Route
router.get('/test', (req, res) => {
    res.json({ message: '✅ Auth routes are working!' });
})

// Register Route
router.post('/register', async (req, res) => {
    res.json({ message: 'Register Endpoint - In progress' });
});

// Login Route
router.post('/login', async (req, res) => {
    res.json({ message: 'Login Endpoint - In progress' });
});

module.exports = router;