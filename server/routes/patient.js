// server/routes/patient.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const PatientRecord = require('../models/PatientRecord');

// @route   POST /api/patients
// @desc    Add a new patient entry for a specific date
// @access  Private (User only)
router.post('/', protect, authorize('user'), async (req, res) => {
    const { date, patients } = req.body;
    const userId = req.user._id; // Get user ID from authenticated user

    if (!date || !Array.isArray(patients)) {
        return res.status(400).json({ message: 'Please provide date and patient data.' });
    }

    // Validate each patient has required fields
    const isValidData = patients.every(patient => 
        patient.bedNo && 
        patient.ipdNumber &&
        patient.name && 
        patient.age
    );

    if (!isValidData) {
        return res.status(400).json({ message: 'Please provide bed number, IPD number, name, and age for each patient.' });
    }    try {
        // Find or create a record for the given date
        let patientRecord = await PatientRecord.findOne({ userId, date });

        if (patientRecord) {
            // If record exists, update the patients array
            patientRecord.patients = patients;
            await patientRecord.save();
        } else {
            // If no record exists, create a new one
            patientRecord = new PatientRecord({
                userId,
                date,
                patients: patients
            });
            await patientRecord.save();
        }

        res.status(200).json({ message: 'Patient data saved successfully!', patientRecord });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding patient data' });
    }
});

// @route   PUT /api/patients/:date/discharge
// @desc    Mark a patient as discharged for a specific date
// @access  Private (User only)
router.put('/:date/discharge', protect, authorize('user'), async (req, res) => {
    const { date } = req.params;
    const { bedNo, ipdNumber, isActive } = req.body;
    const userId = req.user._id;

    if (!date || !bedNo || !ipdNumber) {
        return res.status(400).json({ message: 'Please provide date, bed number, and IPD number.' });
    }

    try {
        const formattedDate = date.includes('-') ? date : date.replace(/\//g, '-');
        const patientRecord = await PatientRecord.findOne({ userId, date: formattedDate });

        if (!patientRecord) {
            return res.status(404).json({ message: 'No patient record found for this date.' });
        }

        // Find and update the specific patient
        const patientIndex = patientRecord.patients.findIndex(
            p => p.bedNo === bedNo && p.ipdNumber === ipdNumber
        );

        if (patientIndex === -1) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        patientRecord.patients[patientIndex].isActive = isActive;
        await patientRecord.save();

        res.status(200).json({ 
            message: `Patient ${isActive ? 'activated' : 'discharged'} successfully!`,
            patientRecord 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating patient status' });
    }
});

// @route   GET /api/patients/:date
// @desc    Get patient entries for a specific date (with optional userId query parameter)
// @access  Private (Admin & User)
router.get('/:date', protect, async (req, res) => {
    const { date } = req.params;
    const { userId } = req.query;  // Optional userId for admin requests
    try {
        const formattedDate = date.includes('-') ? date : date.replace(/\//g, '-');
        let query = { date: formattedDate };
        // If userId is provided (admin request), use it; otherwise use authenticated user's ID
        if (userId && req.user.role === 'admin') {
            query.userId = userId;
        } else {
            query.userId = req.user._id;
        }
        let patientRecord = await PatientRecord.findOne(query);
        if (!patientRecord) {
            // If no record for this date, find the most recent previous record for this user
            const previousRecord = await PatientRecord.findOne({
                userId: query.userId,
                date: { $lt: formattedDate }
            }).sort({ date: -1 });
            if (previousRecord) {
                // Only return active patients with bedNo, ipdNumber, name, age; diets are set to null
                const patients = previousRecord.patients
                    .filter(p => p.isActive !== false) // Only include active patients
                    .map(p => ({
                        bedNo: p.bedNo,
                        ipdNumber: p.ipdNumber,
                        name: p.name,
                        age: p.age,
                        status: p.isActive !== false ? 'active' : 'inactive',
                        morningMeal: null,
                        morningExtra: null,
                        launch: null,
                        nightMeal: null,
                        nightExtra: null
                    }));
                return res.status(200).json({ patients, previous: true });
            } else {
                return res.status(200).json({ patients: [] }); // No previous records
            }
        }
        
        // Filter out inactive patients for current date records
        const activePatients = patientRecord.patients.filter(p => p.isActive !== false);
        res.status(200).json({ patients: activePatients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching patient data' });
    }
});

// @route   GET /api/patients/user/:userId/month/:month
// @desc    Get all patient records for a user in a given month (YYYY-MM)
// @access  Private (Admin only)
router.get('/user/:userId/month/:month', protect, authorize('admin'), async (req, res) => {
    const { userId, month } = req.params;
    try {
        // Find all records for the user in the given month
        // month format: YYYY-MM
        const regex = new RegExp(`^${month}`); // matches dates like 2025-06-01, 2025-06-15, etc.
        const records = await PatientRecord.find({
            userId,
            date: { $regex: regex }
        });
        res.status(200).json({ records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching monthly patient records' });
    }
});

// @route   GET /api/patients/user/:userId/range
// @desc    Get all patient records for a user between two AD dates (YYYY-MM-DD)
// @access  Private (Admin only)
router.get('/user/:userId/range', protect, authorize('admin'), async (req, res) => {
    const { userId } = req.params;
    const { start, end } = req.query;
    if (!start || !end) {
        return res.status(400).json({ message: 'Start and end dates are required' });
    }
    try {
        // Find all records for the user between the start and end date (inclusive)
        const records = await PatientRecord.find({
            userId,
            date: { $gte: start, $lte: end }
        });
        res.status(200).json({ records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching patient records in range' });
    }
});

// @route   GET /api/patients
// @desc    Get all patient records for a specific date (for vendor dashboard)
// @access  Private (Vendor only)
router.get('/', protect, authorize('vendor'), async (req, res) => {
    const { date, all } = req.query;
    if (!date || !all) {
        return res.status(400).json({ message: 'Date and all=true required' });
    }
    try {
        const records = await PatientRecord.find({ date });
        res.status(200).json({ records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching all patient records' });
    }
});

module.exports = router;