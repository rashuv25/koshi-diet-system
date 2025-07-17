// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's an admin token
            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'user') { // Check if it's a user token
                req.user = await User.findById(decoded.id).select('-password');
            } else if (decoded.role === 'vendor') { // Check if it's a vendor token
                req.user = await Vendor.findById(decoded.id).select('-password');
                req.user.role = 'vendor';
            } else {
                return res.status(401).json({ message: 'Not authorized, invalid token role' });
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return (req, res, next) => {
        if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
        }
        next();
    };
};

module.exports = { protect, authorize };