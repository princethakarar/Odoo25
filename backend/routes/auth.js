const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

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

    // Find or create company based on country
    let company = await Company.findOne({ country: country });
    if (!company) {
      // Create new company if it doesn't exist
      company = new Company({
        name: `${country} Company`,
        country: country,
        currency: 'USD' // Default currency, can be updated later
      });
      await company.save();
    }

    // Create new user
    const newUser = new User({
      name: name.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'Admin', // First user is always Admin
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

// Login endpoint
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
      message: 'Login successful',
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

// Get all users for admin dashboard
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role')
      .select('-passwordHash');

    res.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching users' 
    });
  }
});

// Add new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, role, managerId, companyId, isApprover } = req.body;

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
      managerId: managerId || null,
      isApprover: isApprover || false
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

// Update user approver status
router.put('/users/:userId/approver', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApprover } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isApprover = isApprover;
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('companyId', 'name country currency')
      .populate('managerId', 'name email role')
      .select('-passwordHash');

    res.json({
      success: true,
      message: 'User approver status updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update approver status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating approver status' 
    });
  }
});

module.exports = router;
