require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 5051;

// [🪲 DEBUG]: Check if ENV variable is loaded
console.log('MongoDB URI exists:', !!process.env.MONGO_URI);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
    });

// Routes
app.get('/', (req, res) => {
    res.json({ message: '🌿 AgriConnect API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});