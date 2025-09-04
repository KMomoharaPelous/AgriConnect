const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Test Route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Auth routes are working!" });
});

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { name, username, displayName, email, password, location, farmType } = req.body;

    // Validation - checks required fields
    if (!name || !username || !email || !password) {
        return res.status(400).json({
            message: 'Please provide name, username, email, and password'
        });
    }

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        if (existingUser.email === email) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        if (existingUser.username === username) {
            return res.status(400).json({ message: 'Username already taken' });
        }
    }

    // Hash Password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create New User
    const newUser = new User({
        name,
        username: username.toLowerCase(),
        displayName: displayName || name,
        email: email.toLowerCase(),
        password: hashedPassword,
        location,
        farmType
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
        { userId: savedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Send response (don't send password back)
    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
            id: savedUser._id,
            name: savedUser.name,
            username: savedUser.username,
            displayName: savedUser.displayName,
            email: savedUser.email,
            location: savedUser.location,
            farmType: savedUser.farmType
        }
    });
  } catch (error) {
    console.error('❌ Error registering user:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: messages.join(', ')});
    }

    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  res.json({ message: "Login Endpoint - In progress" });
});

module.exports = router;
