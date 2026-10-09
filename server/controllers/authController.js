const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'novastack-secret', {
  expiresIn: '7d'
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, className, grade } = req.body;

    const totalUsers = await User.countDocuments();
    const isFirstUser = totalUsers === 0;

    if (!isFirstUser && req.user && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can create accounts.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const createdRole = isFirstUser ? 'admin' : (role || 'student');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: createdRole,
      className: className || 'General',
      grade: grade || 'Grade 10'
    });

    const safeUser = await User.findById(user._id).select('-password');
    return res.status(201).json({
      message: isFirstUser ? 'Administrator account created successfully.' : 'Account created successfully.',
      user: safeUser,
      token: generateToken(user._id)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error while creating account.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const safeUser = await User.findById(user._id).select('-password');
    return res.json({
      message: 'Login successful.',
      token: generateToken(user._id),
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  return res.json({ user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  return res.json({ message: 'Password updated successfully.' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'No account found with that email.' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 60 * 60 * 1000;
  await user.save();

  return res.json({
    message: 'Password reset token generated successfully.',
    resetToken
  });
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired password reset token.' });
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password reset successful.' });
};

module.exports = { registerUser, loginUser, getMe, changePassword, forgotPassword, resetPassword };
