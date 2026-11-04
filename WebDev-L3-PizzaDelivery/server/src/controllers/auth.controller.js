const User = require('../models/User');
const { signToken, hashToken, createOneTimeToken, publicUser } = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

const VERIFY_MINUTES = 24 * 60;
const RESET_MINUTES = 15;

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email is already registered' });

  const token = createOneTimeToken(VERIFY_MINUTES);
  const user = await User.create({
    name,
    email,
    password,
    role: 'user', // admins are never created from the public form
    verifyToken: token.hashed,
    verifyTokenExpires: token.expires,
  });

  try {
    await sendVerificationEmail(user, token.raw);
  } catch (err) {
    console.error('Verification email failed:', err.message);
  }

  res.status(201).json({
    message: 'Account created. Please check your email to verify your account.',
  });
};

// GET /api/auth/verify/:token
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({
    verifyToken: hashToken(req.params.token),
    verifyTokenExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Verification link is invalid or has expired' });

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully. You can now log in.' });
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const generic = { message: 'If the account exists and is not verified, a new link has been sent.' };
  if (!user || user.isVerified) return res.json(generic);

  const token = createOneTimeToken(VERIFY_MINUTES);
  user.verifyToken = token.hashed;
  user.verifyTokenExpires = token.expires;
  await user.save();
  await sendVerificationEmail(user, token.raw);

  res.json(generic);
};

// shared by user login and admin login
const loginAs = (role) => async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.role !== role) {
    return res.status(403).json({
      message: role === 'admin' ? 'Admin access only' : 'Please use the admin login page',
    });
  }
  if (role === 'user' && !user.isVerified) {
    return res.status(403).json({ message: 'Please verify your email before logging in', needsVerification: true });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
};

// POST /api/auth/login
exports.login = loginAs('user');

// POST /api/admin/login
exports.adminLogin = loginAs('admin');

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Same answer whether or not the email exists, so accounts can't be discovered
  const generic = { message: 'If this email is registered, a reset link has been sent.' };
  if (!user) return res.json(generic);

  const token = createOneTimeToken(RESET_MINUTES);
  user.resetToken = token.hashed;
  user.resetTokenExpires = token.expires;
  await user.save();
  await sendPasswordResetEmail(user, token.raw);

  res.json(generic);
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: hashToken(req.params.token),
    resetTokenExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' });

  user.password = req.body.password; // hashed by the pre-save hook
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Password updated. You can now log in.' });
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
