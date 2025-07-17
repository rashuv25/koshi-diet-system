// server/models/PatientRecord.js
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    bedNo: { type: String, required: true },
    ipdNumber: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    isActive: { type: Boolean, default: true }, // Track if patient is discharged
    admissionDate: { type: Date, default: Date.now }, // Track when patient was admitted
    morningMeal: { 
        type: String, 
        enum: ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'],
        default: null
    },
    morningExtra: { 
        type: String, 
        enum: ['Egg', 'Milk', 'High protein'],
        default: null
    },
    launch: { 
        type: String, 
        enum: ['Biscuit', 'Satu'],
        default: null
    },
    nightMeal: { 
        type: String, 
        enum: ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'],
        default: null
    },
    nightExtra: { 
        type: String, 
        enum: ['Egg', 'Milk', 'High protein'],
        default: null
    },
    timestamp: { type: Date, default: Date.now }
});

const PatientRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    patients: [PatientSchema], // Array of patient entries for the day
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

PatientRecordSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);