/**
 * Middleware to validate registration (signup) payload
 */
export const validateSignup = (req, res, next) => {
  const { college_id, name, department, campus, year, email, phone, password, role } = req.body;

  const errors = [];

  // Required checks
  if (!college_id || !college_id.trim()) errors.push('College ID is required');
  if (!name || !name.trim()) errors.push('Name is required');
  if (!department || !department.trim()) errors.push('Department is required');
  if (!campus || !campus.trim()) errors.push('Campus is required');
  if (!year || !year.toString().trim()) errors.push('Year is required');
  if (!email || !email.trim()) errors.push('Email is required');
  if (!phone || !phone.trim()) errors.push('Phone is required');
  if (!password) errors.push('Password is required');

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Password minimum length validation (>= 6)
  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Optional role validation if provided
  if (role && !['player', 'admin'].includes(role.toLowerCase())) {
    errors.push("Role must be either 'player' or 'admin'");
  }
  if ((!role || role === 'player') && (!Array.isArray(req.body.sports) || req.body.sports.length === 0)) {
    errors.push('Select at least one sport');
  }
  if ((!role || role === 'player') && Array.isArray(req.body.sports) && req.body.sports.some(sport => typeof sport !== 'string' || !sport.trim() || sport.trim().length > 60)) {
    errors.push('Each selected sport must be between 1 and 60 characters');
  }

  if (req.body.profile_photo) {
    const photo = req.body.profile_photo;
    if (typeof photo !== 'string' || photo.length > 180000 || !/^data:image\/(jpeg|png|webp);base64,/.test(photo)) {
      errors.push('Profile photo must be a small JPEG, PNG, or WebP image');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

/**
 * Middleware to validate login payload
 */
export const validateLogin = (req, res, next) => {
  const { college_id, password } = req.body;

  if (!college_id || !college_id.trim()) {
    return res.status(400).json({
      success: false,
      message: 'College ID is required'
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }

  next();
};
