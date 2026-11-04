const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// JWT used for authenticated requests
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// One-time tokens for email verification / password reset.
// The raw token goes in the email link; only its hash is stored in the database.
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const createOneTimeToken = (minutesValid) => {
  const raw = crypto.randomBytes(32).toString('hex');
  return {
    raw,
    hashed: hashToken(raw),
    expires: new Date(Date.now() + minutesValid * 60 * 1000),
  };
};

// Shape of the user object returned to the client
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

module.exports = { signToken, hashToken, createOneTimeToken, publicUser };
