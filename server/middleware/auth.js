const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid token.'});
        }

        const token = authHeader.slice(7);

        if (!token || token.length === 0) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please login again.' });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token.' });
            }

            if (jwtError.name === 'NotBeforeError') {
                return res.status(401).json({ message: 'Token not active yet' });
            }
            throw jwtError;
        }

        // Validate token payload structure
        if (!decoded.userId || typeof decoded.userId !== 'string') {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        // Fetch user with additional checks
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found. Token may be invalid' });
        }

        req.user = user;
        req.tokenPayload = decoded;
        next();
    } catch (error) {
        console.error("Auth middleware error:", {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        return res.status(500).json({ message: 'Authentication service error' });
    }
};

module.exports = auth;