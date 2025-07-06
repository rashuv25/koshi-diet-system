const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const PatientRecord = require('../models/PatientRecord');

// Create Vendor
router.post('/create', protect, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = new Vendor({ name, email, password: hashedPassword, phone });
    await vendor.save();
    res.status(201).json({ message: 'Vendor created successfully', vendor });
  } catch (err) {
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

module.exports = router;
