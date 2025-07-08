// server/routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Ward = require('../models/Ward');

// @route   POST /api/admin/users
// @desc    Admin creates a new user
// @access  Private (Admin only)
router.post('/users', protect, authorize('admin'), async (req, res) => {
    const { name, email, password, phone, department } = req.body;
    const adminId = req.user._id; // Get admin ID from authenticated user

    if (!name || !email || !password || !phone || !department) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        user = new User({ adminId, name, email, password, phone, department });
        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                department: user.department,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during user creation' });
    }
});

// @route   GET /api/admin/users
// @desc    Admin gets all users they created
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
    const adminId = req.user._id;

    try {
        const users = await User.find({ adminId }).select('-password'); // Exclude passwords
        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching created users' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Admin updates a user they created
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
    const adminId = req.user._id;
    const { id } = req.params;
    const { name, email, phone, department } = req.body;
    try {
        // Only allow update if the user was created by this admin
        const user = await User.findOne({ _id: id, adminId });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not managed by you' });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.department = department || user.department;
        await user.save();
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                department: user.department,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating user' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Admin deletes a user they created
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    const adminId = req.user._id;
    const { id } = req.params;
    try {
        const user = await User.findOneAndDelete({ _id: id, adminId });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not managed by you' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

// @route   GET /api/admin/users/all
// @desc    Get all users (for vendor dashboard)
// @access  Private (Vendor only)
router.get('/users/all', protect, authorize('vendor'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching all users' });
    }
});

// Get all wards
router.get('/wards', protect, authorize('admin'), async (req, res) => {
  try {
    const wards = await Ward.find();
    res.json({ wards });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching wards' });
  }
});

// Create a new ward
router.post('/wards', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Ward name is required' });
    const existing = await Ward.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Ward already exists' });
    const ward = new Ward({ name });
    await ward.save();
    res.json({ message: 'Ward created', ward });
  } catch (err) {
    res.status(500).json({ message: 'Error creating ward' });
  }
});

// Update a ward
router.put('/wards/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    const ward = await Ward.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!ward) return res.status(404).json({ message: 'Ward not found' });
    res.json({ message: 'Ward updated', ward });
  } catch (err) {
    res.status(500).json({ message: 'Error updating ward' });
  }
});

// Delete a ward
router.delete('/wards/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) return res.status(404).json({ message: 'Ward not found' });
    res.json({ message: 'Ward deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting ward' });
  }
});

module.exports = router;