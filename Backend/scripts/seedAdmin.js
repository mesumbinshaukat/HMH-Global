const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const adminEmail = 'admin@hmhglobal.co.uk';
    const tempPassword = 'TempPassword123!';

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Super admin already exists:', adminEmail);
      
      // Update existing admin to ensure proper role and permissions
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      
      console.log('Super admin role updated successfully');
    } else {
      // Create new super admin
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      const superAdmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await superAdmin.save();
      console.log('Super admin created successfully');
      console.log('Email:', adminEmail);
      console.log('Temporary Password:', tempPassword);
      console.log('⚠️  Please change this password immediately after first login!');
    }

    console.log('✅ Super admin seeding completed');
    
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seeding script
seedSuperAdmin();
