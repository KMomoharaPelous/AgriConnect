require('dotenv').config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 5051;

app.get('/api/test', (req, res) => {
    res.json({ message: '🌿 AgriConnect API is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});