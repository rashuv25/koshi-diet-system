const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/authMiddleware');
const PatientRecord = require('../models/PatientRecord');
const Ward = require('../models/Ward');

// Create Vendor
router.post('/create', protect, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    console.log('Creating vendor with email:', email);
    const vendor = new Vendor({ name, email, password, phone });
    await vendor.save();
    console.log('Vendor created successfully, password hashed:', vendor.password.startsWith('$2b$'));
    res.status(201).json({ message: 'Vendor created successfully', vendor });
  } catch (err) {
    console.error('Vendor creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get all Vendors
router.get('/', protect, async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Vendor by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all patient records for today, grouped by ward (for vendor)
router.get('/records/today', protect, async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Find all patient records for today
    const records = await PatientRecord.find({ date: formattedDate });
    // Group patients by ward
    const grouped = {};
    records.forEach(record => {
      record.patients.forEach(patient => {
        if (!grouped[patient.ward]) grouped[patient.ward] = [];
        grouped[patient.ward].push(patient);
      });
    });
    res.json({ grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all patient records for a specific date, grouped by ward (for vendor)
router.get('/records/by-date', protect, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date is required in query parameter' });
    }
    // Find all patient records for the given date
    const records = await PatientRecord.find({ date }).populate('userId', 'department');
    // Group patients by ward (use user.department if patient.ward is missing)
    const grouped = {};
    records.forEach(record => {
      const ward = record.userId.department;
      if (!grouped[ward]) grouped[ward] = [];
      record.patients.forEach(patient => {
        grouped[ward].push(patient);
      });
    });
    res.json({ grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all patient records for a date range, for monthly reports (for vendor)
router.get('/records/by-range', protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required in query parameters' });
    }
    
    // Find all patient records within the date range
    const records = await PatientRecord.find({
      date: {
        $gte: start,
        $lte: end
      }
    }).populate('userId', 'department');
    
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all wards (for vendor and admin)
router.get('/wards', protect, async (req, res) => {
  try {
    // Only allow if user is vendor or admin
    if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
    }
    const wards = await Ward.find();
    res.json({ wards });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching wards' });
  }
});

module.exports = router;
