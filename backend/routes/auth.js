const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');

// Signup endpoint - Admin only, one per company
router.post('/signup', async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if company already has an admin
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      const existingAdmin = await User.findOne({ 
        companyId: existingCompany._id, 
        role: 'Admin' 
      });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Only one admin per company can register'
        });
      }
    }

    // Create or find company
    let company;
    if (existingCompany) {
      company = existingCompany;
    } else {
      company = new Company({
        name: companyName,
        country: 'Global', // Default country
        currency: 'USD' // Default currency
      });
      await company.save();
    }

    // Create new admin user
    const newUser = new User({
      name: companyName.toLowerCase(), // Use company name as user name
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'Admin', // Only admin can signup
      companyId: company._id,
      managerId: null // Admin has no manager
    });

    await newUser.save();

    // Populate the saved user
    const savedUser = await User.findById(newUser._id)
      .populate('companyId', 'name country currency')
      .select('-passwordHash');

    res.status(201).json({
      success: true,
      message: 'Admin signup successful',
      user: savedUser
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup' 
    });
  }
});

// Login endpoint - Admin only
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if user is admin
    if (user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin users can login' 
      });
    }

    // Simple password check (in production, use bcrypt)
    if (user.passwordHash !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      managerId: user.managerId
    };

    res.json({
      success: true,
      message: 'Admin login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get employees for admin dashboard (employees only, not other admins)
router.get('/employees/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get all employees (non-admin users) for the specific company
    const employees = await User.find({ 
      companyId: companyId,
      role: { $ne: 'Admin' } // Exclude admin users
    })
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role')
      .select('-passwordHash');

    res.json({
      success: true,
      employees: employees
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching employees' 
    });
  }
});

// Add new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, role, managerId, companyId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { name: name.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or name already exists'
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create new user
    const newUser = new User({
      name: name.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: tempPassword, // Temporary password
      role: role,
      companyId: companyId,
      managerId: managerId || null
    });

    await newUser.save();

    // Populate the saved user
    const savedUser = await User.findById(newUser._id)
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role')
      .select('-passwordHash');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: savedUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating user' 
    });
  }
});

// Send password to user
router.post('/send-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8);
    
    // Update user password
    user.passwordHash = randomPassword;
    await user.save();

    // In production, send email here
    console.log(`Password for ${user.email}: ${randomPassword}`);

    res.json({
      success: true,
      message: 'Password sent successfully to user email'
    });

  } catch (error) {
    console.error('Send password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while sending password' 
    });
  }
});

module.exports = router;
