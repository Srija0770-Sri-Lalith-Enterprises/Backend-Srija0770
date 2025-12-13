# Security Checklist & Configuration

## ✅ Security Fixes Applied

### 1. **CORS Configuration** ✅
- **Before**: `app.use(cors())` - Allowed all origins (security risk)
- **After**: Restricted to specific allowed origins
- **Configuration**: Set `FRONTEND_URL` environment variable with your production frontend URL
- **Allowed Origins**:
  - `http://localhost:3000` (development)
  - Your production frontend URL (set via `FRONTEND_URL` env var)
  - Common hosting platforms (Vercel, Netlify) - update as needed

### 2. **XSS Protection** ✅
- **Before**: User input directly inserted into HTML email template (XSS vulnerability)
- **After**: All user inputs are sanitized using `sanitizeHtml()` and `escapeHtml()` functions
- **Protection**: HTML entities are escaped (`<`, `>`, `&`, `"`, `'`, `/`)

### 3. **TLS/SSL Security** ✅
- **Before**: `rejectUnauthorized: false` - Accepted self-signed certificates (security risk)
- **After**: `rejectUnauthorized: process.env.NODE_ENV === 'production'` - Rejects unauthorized certs in production
- **Note**: In development, self-signed certs are allowed for testing

### 4. **Rate Limiting** ✅
- **General API**: 100 requests per 15 minutes per IP
- **Contact Form**: 5 submissions per 15 minutes per IP
- **Package**: `express-rate-limit`

### 5. **Security Headers** ✅
- **Package**: `helmet` - Adds security headers automatically
- **Headers Added**:
  - Content Security Policy (CSP)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - And more...

### 6. **Test Endpoint Protection** ✅
- **Before**: `/api/test-email` accessible in production
- **After**: Disabled in production (returns 403)
- **Usage**: Only available in development mode

### 7. **Environment Variables** ✅
- **Before**: Hardcoded email fallback
- **After**: `OWNER_EMAIL` is required (no fallback)
- **Validation**: Server warns if `OWNER_EMAIL` is not set

### 8. **Input Validation** ✅
- **Package**: Custom validation middleware
- **Protection**: Validates and filters fake/test data
- **Checks**: Name, email, phone, subject, message formats

### 9. **Payload Size Limit** ✅
- **Configuration**: `express.json({ limit: '10mb' })`
- **Protection**: Prevents large payload attacks

## 🔒 Required Environment Variables

Make sure these are set on Render.com (or your hosting platform):

### Required:
- `MONGODB_URI` - MongoDB connection string
- `OWNER_EMAIL` - Email address to receive contact form submissions
- `PORT` - Server port (default: 3001)

### Email Configuration (Choose One):
**Option 1: Resend API (Recommended)**
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Optional (defaults to `onboarding@resend.dev`)

**Option 2: SMTP**
- `SMTP_HOST` - SMTP server (e.g., `smtp.gmail.com`)
- `SMTP_PORT` - SMTP port (e.g., `465` or `587`)
- `SMTP_SECURE` - `true` for port 465, `false` for 587
- `SMTP_USER` - Your email address
- `SMTP_PASS` - Your email password or app password

### Optional:
- `FRONTEND_URL` - Your frontend URL for CORS (defaults to `http://localhost:3000`)
- `NODE_ENV` - Set to `production` for production environment

## 📋 Pre-Deployment Checklist

- [ ] All environment variables are set on Render.com
- [ ] `OWNER_EMAIL` is configured
- [ ] Email service (Resend or SMTP) is configured
- [ ] `FRONTEND_URL` is set to your production frontend URL
- [ ] `NODE_ENV` is set to `production` (if applicable)
- [ ] MongoDB connection string is secure (not exposed)
- [ ] API keys are stored in environment variables (not in code)
- [ ] `.env` file is in `.gitignore` (already done ✅)
- [ ] Test endpoint is disabled in production (already done ✅)

## 🚨 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore` ✅
2. **Use strong MongoDB passwords** - Use URL encoding for special characters
3. **Rotate API keys regularly** - Update `RESEND_API_KEY` periodically
4. **Monitor rate limit logs** - Watch for abuse patterns
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use HTTPS in production** - Ensure your hosting platform uses HTTPS
7. **Review logs regularly** - Check for suspicious activity

## 📦 New Dependencies Added

- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

Install with:
```bash
cd Backend
npm install
```

## 🔍 Testing Security

1. **Test CORS**: Try accessing API from unauthorized origin (should fail)
2. **Test Rate Limiting**: Submit contact form 6 times quickly (5th should fail)
3. **Test XSS Protection**: Try submitting HTML/JavaScript in form fields
4. **Test Test Endpoint**: Try `/api/test-email` in production (should return 403)

## 📝 Notes

- All sensitive data is stored in environment variables
- No hardcoded credentials in the codebase
- Input sanitization prevents XSS attacks
- Rate limiting prevents API abuse
- Security headers protect against common web vulnerabilities

