const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register - Đăng ký tài khoản
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentGroup, targetBand } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
      studentGroup: studentGroup || 'support',
      targetBand: targetBand || 6.5
    });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

// GET /api/auth/me - Lấy thông tin cá nhân hiện tại
router.get('/me', authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile', error: error.message });
  }
});

// PUT /api/auth/update-group - Cập nhật nhóm năng lực học viên
router.put('/update-group', authenticateToken, async (req, res) => {
  try {
    const { studentGroup } = req.body;
    if (!['support', 'average', 'excellent'].includes(studentGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid student group' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { studentGroup },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Student group updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update Group Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating student group', error: error.message });
  }
});

// PUT /api/auth/users/:id/override-group - Admin can thiệp điều chỉnh thủ công nhóm học viên (Bài Toán 3 PDF)
router.put('/users/:id/override-group', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentGroup, targetBand } = req.body;
    if (studentGroup && !['support', 'average', 'excellent'].includes(studentGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid student group' });
    }

    const updateFields = {};
    if (studentGroup) updateFields.studentGroup = studentGroup;
    if (targetBand) updateFields.targetBand = targetBand;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Admin manual override successful',
      data: updatedUser
    });
  } catch (error) {
    console.error('Admin Override Error:', error);
    return res.status(500).json({ success: false, message: 'Error performing manual override', error: error.message });
  }
});

module.exports = router;
