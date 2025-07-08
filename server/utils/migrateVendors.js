const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');

// Connect to MongoDB (you'll need to set your MONGO_URI)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for migration'))
    .catch(err => console.error('MongoDB connection error:', err));

async function migrateVendorPasswords() {
    try {
        console.log('Starting vendor password migration...');
        
        // Find all vendors
        const vendors = await Vendor.find({});
        console.log(`Found ${vendors.length} vendors to migrate`);
        
        for (const vendor of vendors) {
            // Check if password is already hashed (bcrypt hashes start with $2b$)
            if (!vendor.password.startsWith('$2b$')) {
                console.log(`Migrating vendor: ${vendor.email}`);
                
                // Hash the plain text password
                const hashedPassword = await bcrypt.hash(vendor.password, 10);
                
                // Update the vendor with hashed password
                await Vendor.findByIdAndUpdate(vendor._id, { password: hashedPassword });
                
                console.log(`Successfully migrated vendor: ${vendor.email}`);
            } else {
                console.log(`Vendor ${vendor.email} already has hashed password`);
            }
        }
        
        console.log('Vendor password migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
migrateVendorPasswords(); 