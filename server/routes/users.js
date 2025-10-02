const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current user profile - GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
    res.json({
        message: 'Profile accessed successfully',
        user: req.user
    });
});

// Uppdate current user profile - PUT /api/users/profile
router.patch('/profile', auth, async (req, res) => {
    try {
        const { name, displayName, email, location, farmType } = req.body;
        const userId = req.user._id;

        // Build update object
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (displayName !== undefined) updates.displayName = displayName.trim();
        if (email !== undefined) updates.email = email.toLowerCase().trim();
        if (location !== undefined) updates.location = location.trim();
        if (farmType !== undefined) updates.farmType = farmType;

        if (updates.name && updates.name.length === 0) {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        if (updates.name && updates.name.length > 25) {
            return res.status(400).json({ message: 'Name must be 25 characters or less' });
        }

        if (updates.displayName && updates.displayName.length > 25) {
            return res.status(400).json({ message: 'Display name must be 25 characters or less'});
        }

        if (updates.farmType && !['hobby', 'small-scale', 'commercial', 'gardener'].includes(updates.farmType)) {
            return res.status(400).json({ message: 'Invalid farm type'});
        }

        // Location validation (City, State format)
        if (updates.location) {
            const locationParts = updates.location.split(',');
            if (locationParts.length !== 2) {
                return res.status(400).json({ message: 'Location must be in format: City, State'});
            }

            const [city, state] = locationParts.map(part => part.trim());
            if (city.length < 2 || state.length !== 2) {
                return res.status(400).json({ message: 'Location must be in format: City, State '});
            }
        }

        //Check for duplicate email if email is being updated
        if (updates.email) {
            const existingUser = await User.findOne({
                email: updates.email,
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update User
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// Get public user profile by username - GET /api/users/:username
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username.toLowerCase() })
            .select('username displayName location farmType createdAt -_id');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User profile retrieved successfully',
            user: user
        });
    } catch (error) {
        console.error('Get public user profile error:', error);
        res.status(500).json({ message: 'Server error retrieving user profile' });
    }
});

// Change Password - PATCH /api/users/change-password
router.patch('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }
        
        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

module.exports = router;