import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ContactForm from './ContactFormSchema.js';
import { validateContactForm } from './validation.js';

dotenv.config();

const port = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Nodemailer Configuration
const createTransporter = () => {
  // Check if SMTP credentials are provided
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // Return null if credentials are missing
  }
  
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Connection timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // TLS/SSL options for better compatibility
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
      minVersion: 'TLSv1.2'
    },
    // Connection settings for cloud platforms
    pool: false, // Disable connection pooling to avoid timeout issues
    // Disable rate limiting for immediate sends
    maxConnections: 1,
    maxMessages: 1
  });
};

// Get owner email from environment variable
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'mundrusaisrija@gmail.com';

// Check Email configuration on startup
const checkEmailConfig = () => {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasSMTPUser = !!process.env.SMTP_USER;
  const hasSMTPPass = !!process.env.SMTP_PASS;
  
  console.log('\n📧 Email Configuration Status:');
  
  if (hasResendKey) {
    console.log('✅ Resend API configured (RECOMMENDED for Render.com)');
    console.log(`   Resend From: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)'}`);
    console.log(`   Owner Email: ${OWNER_EMAIL}`);
    console.log('✅ Email notifications are ENABLED via Resend API\n');
  } else if (hasSMTPUser && hasSMTPPass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    
    console.log('✅ SMTP credentials found');
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
    console.log(`   SMTP Port: ${port} (${secure ? 'SSL' : 'TLS'})`);
    console.log(`   SMTP User: ${process.env.SMTP_USER}`);
    console.log(`   Owner Email: ${OWNER_EMAIL}`);
    console.log('✅ Email notifications are ENABLED via SMTP');
    console.log('   Connection timeout: 60s, Socket timeout: 60s');
    if (port === 587) {
      console.log('   ⚠️  WARNING: Port 587 may be blocked on Render.com');
      console.log('   💡 RECOMMENDED: Switch to Resend API or use port 465 with SMTP_SECURE=true\n');
    } else {
      console.log('');
    }
  } else {
    console.log('⚠️  No email service configured');
    console.log('   RESEND_API_KEY:', hasResendKey ? '✅ Set' : '❌ Missing (RECOMMENDED)');
    console.log('   SMTP_USER:', hasSMTPUser ? '✅ Set' : '❌ Missing');
    console.log('   SMTP_PASS:', hasSMTPPass ? '✅ Set' : '❌ Missing');
    console.log('⚠️  Email notifications are DISABLED');
    console.log('   Contact form submissions will be saved to MongoDB but no emails will be sent');
    console.log('   💡 To enable emails: Add RESEND_API_KEY (recommended) or SMTP credentials\n');
  }
};

// Check Email configuration on startup
checkEmailConfig();

// Contact Form Submission Endpoint
app.post('/api/contact', validateContactForm, async (req, res) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;
    
    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '';

    // Save to MongoDB
    const contactForm = new ContactForm({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      company: company ? company.trim() : '',
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: ipAddress
    });

    const savedForm = await contactForm.save();

    // Prepare email content
    const emailSubject = `New Contact Form Submission: ${subject}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #138808;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .field {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
          }
          .field:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #138808;
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
          }
          .value {
            color: #555;
            font-size: 16px;
            padding-left: 10px;
          }
          .message-box {
            background-color: white;
            padding: 15px;
            border-left: 4px solid #138808;
            margin-top: 10px;
            border-radius: 3px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">Full Name:</span>
            <span class="value">${name}</span>
          </div>
          
          <div class="field">
            <span class="label">Email Address:</span>
            <span class="value">${email}</span>
          </div>
          
          <div class="field">
            <span class="label">Phone Number:</span>
            <span class="value">${phone}</span>
          </div>
          
          ${company ? `
          <div class="field">
            <span class="label">Company Name:</span>
            <span class="value">${company}</span>
          </div>
          ` : ''}
          
          <div class="field">
            <span class="label">Subject:</span>
            <span class="value">${subject}</span>
          </div>
          
          <div class="field">
            <span class="label">Message:</span>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent from the contact form on your website.</p>
            <p>Submitted at: ${new Date(savedForm.submittedAt).toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
New Contact Form Submission

Full Name: ${name}
Email Address: ${email}
Phone Number: ${phone}
${company ? `Company Name: ${company}\n` : ''}Subject: ${subject}

Message:
${message}

---
Submitted at: ${new Date(savedForm.submittedAt).toLocaleString()}
    `;

    // Send email to owner
    let emailSent = false;
    
    // Try Resend API first (more reliable on Render.com)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Website Contact Form <onboarding@resend.dev>',
            to: [OWNER_EMAIL],
            reply_to: email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
          })
        });

        if (resendResponse.ok) {
          const resendData = await resendResponse.json();
          console.log('\n✅ Email notification sent successfully via Resend');
          console.log(`   From: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}`);
          console.log(`   To: ${OWNER_EMAIL}`);
          console.log(`   Subject: ${emailSubject}`);
          console.log(`   Resend ID: ${resendData.id}\n`);
          emailSent = true;
        } else {
          const errorData = await resendResponse.json();
          throw new Error(`Resend API error: ${errorData.message || resendResponse.statusText}`);
        }
      } catch (resendError) {
        console.error('\n❌ Resend API email sending failed:');
        console.error('   Error:', resendError.message);
        console.error('   Falling back to SMTP...\n');
      }
    }
    
    // Fallback to SMTP if Resend failed or not configured
    if (!emailSent) {
      const transporter = createTransporter();
      
      if (transporter) {
        try {
          const info = await transporter.sendMail({
            from: `"Website Contact Form" <${process.env.SMTP_USER}>`,
            to: OWNER_EMAIL,
            replyTo: email,
            subject: emailSubject,
            text: emailText,
            html: emailHtml
          });
          
          console.log('\n✅ Email notification sent successfully via SMTP');
          console.log(`   Message ID: ${info.messageId}`);
          console.log(`   From: ${process.env.SMTP_USER}`);
          console.log(`   To: ${OWNER_EMAIL}`);
          console.log(`   Subject: ${emailSubject}\n`);
          emailSent = true;
        } catch (err) {
          // Log email error but don't fail the request since data is already saved
          console.error('\n❌ EMAIL SENDING FAILED:');
          console.error('   Error:', err.message);
          console.error('   Code:', err.code || 'N/A');
          console.error('   Command:', err.command || 'N/A');
          if (err.response) {
            console.error('   Response:', err.response);
          }
          console.error('   Full error:', err);
          console.error('✅ Contact form data saved to MongoDB successfully');
          console.error('⚠️  But email notification failed - check your SMTP configuration');
          
          // If connection timeout, suggest alternatives
          if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
            console.error('💡 SUGGESTION: Render.com is blocking SMTP connections.');
            console.error('   RECOMMENDED FIX: Use Resend API instead (more reliable on cloud platforms)');
            console.error('   1. Sign up at https://resend.com (free tier available)');
            console.error('   2. Get your API key from Resend dashboard');
            console.error('   3. Add to Render.com environment variables:');
            console.error('      - RESEND_API_KEY: re_your-api-key-here');
            console.error('      - RESEND_FROM_EMAIL: your-verified-email@yourdomain.com (optional)');
            console.error('   4. Restart your backend service\n');
            console.error('   ALTERNATIVE: Try port 465 with SSL:');
            console.error('     - SMTP_PORT: 465');
            console.error('     - SMTP_SECURE: true\n');
          } else {
            console.error('');
          }
        }
      } else {
        console.warn('⚠️  No email service configured. Email notification skipped.');
        console.warn('⚠️  To enable email notifications:');
        console.warn('   Option 1: Add RESEND_API_KEY (RECOMMENDED for Render.com)');
        console.warn('   Option 2: Add SMTP_USER and SMTP_PASS');
        console.log('✅ Contact form data saved to MongoDB successfully');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: savedForm._id,
        submittedAt: savedForm.submittedAt,
        emailSent: emailSent
      }
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry detected'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test email endpoint (for debugging)
app.post('/api/test-email', async (req, res) => {
  let emailSent = false;
  let errorDetails = null;
  
  // Try Resend API first
  if (process.env.RESEND_API_KEY) {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Website Contact Form <onboarding@resend.dev>',
          to: [OWNER_EMAIL],
          subject: 'Test Email from Contact Form',
          html: '<p>This is a <strong>test email</strong> to verify email configuration.</p>',
          text: 'This is a test email to verify email configuration.'
        })
      });

      if (resendResponse.ok) {
        const resendData = await resendResponse.json();
        return res.json({
          success: true,
          message: 'Test email sent successfully via Resend',
          details: {
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: OWNER_EMAIL,
            resendId: resendData.id
          }
        });
      } else {
        const errorData = await resendResponse.json();
        errorDetails = { message: errorData.message, via: 'Resend API' };
      }
    } catch (error) {
      errorDetails = { message: error.message, via: 'Resend API' };
    }
  }
  
  // Fallback to SMTP
  const transporter = createTransporter();
  
  if (!transporter) {
    return res.status(400).json({
      success: false,
      message: 'No email service configured',
      details: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'Missing (RECOMMENDED)',
        SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
        SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing',
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
        OWNER_EMAIL: OWNER_EMAIL
      },
      suggestion: 'Add RESEND_API_KEY (recommended) or SMTP credentials to enable email notifications',
      previousError: errorDetails
    });
  }

  try {
    const testEmail = {
      from: `"Website Contact Form" <${process.env.SMTP_USER}>`,
      to: OWNER_EMAIL,
      subject: 'Test Email from Contact Form',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a <strong>test email</strong> to verify SMTP configuration.</p>'
    };

    await transporter.sendMail(testEmail);
    
    return res.json({
      success: true,
      message: 'Test email sent successfully via SMTP',
      details: {
        from: process.env.SMTP_USER,
        to: OWNER_EMAIL
      },
      previousError: errorDetails
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: {
        message: error.message,
        code: error.code,
        command: error.command,
        via: 'SMTP'
      },
      previousError: errorDetails,
      suggestion: 'Try using Resend API instead (add RESEND_API_KEY to environment variables)'
    });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});