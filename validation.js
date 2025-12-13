// Validation middleware to check for meaningful and real data (not fake data)

// Common fake data patterns to detect
const fakePatterns = {
  names: [
    /^test\s/i,
    /^demo\s/i,
    /^fake\s/i,
    /^sample\s/i,
    /^xyz\s/i,
    /^abc\s/i,
    /^user\s/i,
    /^admin\s/i,
    /^temp\s/i,
    /^dummy\s/i,
    /^[a-z]{1,2}\s*$/i, // Single or double letter names
    /^[0-9]+$/, // Only numbers
    /^[a-z]+[0-9]+$/i // Name with only numbers (like "test123")
  ],
  emails: [
    /test@test/i,
    /demo@demo/i,
    /fake@fake/i,
    /sample@sample/i,
    /xyz@xyz/i,
    /abc@abc/i,
    /user@user/i,
    /admin@admin/i,
    /temp@temp/i,
    /dummy@dummy/i,
    /test\d+@test/i,
    /example@example/i
  ],
  subjects: [
    /^test$/i,
    /^demo$/i,
    /^fake$/i,
    /^sample$/i,
    /^xyz$/i,
    /^abc$/i,
    /^asdf$/i,
    /^qwerty$/i,
    /^123$/,
    /^[a-z]{1,3}$/i // Very short subjects
  ],
  messages: [
    /^test$/i,
    /^demo$/i,
    /^fake$/i,
    /^sample$/i,
    /^xyz$/i,
    /^abc$/i,
    /^asdf$/i,
    /^qwerty$/i,
    /^123$/,
    /^[a-z]{1,5}$/i, // Very short messages
    /^[0-9]+$/, // Only numbers
    /^[a-z\s]{1,10}$/i // Very short meaningless text
  ]
};

// Check if a value matches fake patterns
const isFakeData = (value, patterns) => {
  if (!value || typeof value !== 'string') return false;
  const normalizedValue = value.trim().toLowerCase();
  return patterns.some(pattern => pattern.test(normalizedValue));
};

// Validate phone number format (should be realistic)
const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  // Should have 10-15 digits (international format)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
  // Check for obvious fake patterns like all same digits (1111111111, 0000000000, etc.)
  if (/^(\d)\1{9,}$/.test(digitsOnly)) return false;
  return true;
};

// Validate email domain (should be a real domain)
const isValidEmailDomain = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1];
  if (!domain) return false;
  // Check for common fake domains
  const fakeDomains = ['test.com', 'test.org', 'test.net', 'example.com', 'example.org', 
                       'fake.com', 'demo.com', 'sample.com', 'xyz.com', 'abc.com'];
  if (fakeDomains.includes(domain.toLowerCase())) return false;
  // Should have a valid TLD (at least 2 characters)
  const parts = domain.split('.');
  if (parts.length < 2 || parts[parts.length - 1].length < 2) return false;
  return true;
};

// Main validation function
export const validateContactForm = (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;
  const errors = [];

  // Validate Full Name
  if (!name || name.trim().length < 2) {
    errors.push('Full Name must be at least 2 characters long');
  } else if (isFakeData(name, fakePatterns.names)) {
    errors.push('Please provide a valid full name');
  }

  // Validate Email Address
  if (!email || !email.trim()) {
    errors.push('Email Address is required');
  } else if (!isValidEmailDomain(email)) {
    errors.push('Please provide a valid email address with a real domain');
  } else if (isFakeData(email, fakePatterns.emails)) {
    errors.push('Please provide a valid email address');
  }

  // Validate Phone Number
  if (!phone || !phone.trim()) {
    errors.push('Phone Number is required');
  } else if (!isValidPhoneNumber(phone)) {
    errors.push('Please provide a valid phone number');
  }

  // Validate Mail Subject
  if (!subject || subject.trim().length < 3) {
    errors.push('Mail Subject must be at least 3 characters long');
  } else if (isFakeData(subject, fakePatterns.subjects)) {
    errors.push('Please provide a meaningful subject');
  }

  // Validate Mail Message
  if (!message || message.trim().length < 10) {
    errors.push('Mail Message must be at least 10 characters long');
  } else if (isFakeData(message, fakePatterns.messages)) {
    errors.push('Please provide a meaningful message');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

