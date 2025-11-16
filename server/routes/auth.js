// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/admin/signup
// @desc    Register a new admin
// @access  Public
router.post('/admin/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        admin = new Admin({ name, email, password });
        await admin.save();

        const token = generateToken(admin._id, admin.role);

        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during admin signup' });
    }
});

// @route   POST /api/auth/admin/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(admin._id, admin.role);

        res.status(200).json({
            message: 'Admin logged in successfully',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during admin login' });
    }
});

// @route   POST /api/auth/user/login
// @desc    Authenticate user (created by admin) & get token
// @access  Public
router.post('/user/login', async (req, res) => {
    const { email, password, department } = req.body;

    if (!email || !password || !department) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ email, department });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials or department' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: 'User logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during user login' });
    }
});

// @route   POST /api/auth/login
// @desc    Unified login for both admin and user
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Login failed: missing email or password');
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // First check if it's an admin
        const admin = await Admin.findOne({ email });
        if (admin) {
            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
                console.log('Admin found but password mismatch:', email);
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            console.log('Admin login successful:', email);
            const token = generateToken(admin._id, admin.role);
            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            });
        }

        // If not admin, check if it's a user
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                console.log('User found but password mismatch:', email);
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            console.log('User login successful:', email);
            const token = generateToken(user._id, user.role);
            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                },
            });
        }
        // If not user, check if it's a vendor
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            console.log('No admin, user, or vendor found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        console.log('Vendor found:', vendor.email);
        console.log('Password type check:', vendor.password && vendor.password.startsWith('$2b$') ? 'Hashed' : 'Plain text');
        
        // Handle both hashed and plain text passwords for vendors
        let isMatch = false;
        try {
            // Try to use the comparePassword method first
            isMatch = await vendor.comparePassword(password);
            console.log('Vendor password comparison result:', isMatch);
        } catch (error) {
            // If comparePassword fails, try direct comparison for plain text passwords
            console.log('Vendor password comparison failed, trying direct comparison');
            isMatch = (vendor.password && vendor.password === password);
            console.log('Direct comparison result:', isMatch);
        }
        
        if (!isMatch) {
            console.log('Vendor found but password mismatch:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('Vendor login successful:', email);
        const token = generateToken(vendor._id, 'vendor');
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: 'vendor',
            },
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;