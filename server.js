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

// Check SMTP configuration on startup
const checkSMTPConfig = () => {
  const hasSMTPUser = !!process.env.SMTP_USER;
  const hasSMTPPass = !!process.env.SMTP_PASS;
  const hasSMTPHost = !!process.env.SMTP_HOST;
  
  console.log('\n📧 Email Configuration Status:');
  if (hasSMTPUser && hasSMTPPass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    
    console.log('✅ SMTP credentials found');
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
    console.log(`   SMTP Port: ${port} (${secure ? 'SSL' : 'TLS'})`);
    console.log(`   SMTP User: ${process.env.SMTP_USER}`);
    console.log(`   Owner Email: ${OWNER_EMAIL}`);
    console.log('✅ Email notifications are ENABLED');
    console.log('   Connection timeout: 60s, Socket timeout: 60s');
    if (port === 587) {
      console.log('   💡 Tip: If you experience connection timeouts, try port 465 with SMTP_SECURE=true\n');
    } else {
      console.log('');
    }
  } else {
    console.log('⚠️  SMTP credentials NOT configured');
    console.log('   SMTP_USER:', hasSMTPUser ? '✅ Set' : '❌ Missing');
    console.log('   SMTP_PASS:', hasSMTPPass ? '✅ Set' : '❌ Missing');
    console.log('⚠️  Email notifications are DISABLED');
    console.log('   Contact form submissions will be saved to MongoDB but no emails will be sent\n');
  }
};

// Check SMTP configuration on startup
checkSMTPConfig();

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

    // Send email to owner (if SMTP credentials are configured)
    const transporter = createTransporter();
    let emailSent = false;
    let emailError = null;
    
    if (transporter) {
      try {
        // Send email directly (skip verification to avoid timeout)
        const info = await transporter.sendMail({
          from: `"Website Contact Form" <${process.env.SMTP_USER}>`,
          to: OWNER_EMAIL,
          replyTo: email,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
        
        emailSent = true;
        console.log('\n✅ Email notification sent successfully');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   From: ${process.env.SMTP_USER}`);
        console.log(`   To: ${OWNER_EMAIL}`);
        console.log(`   Subject: ${emailSubject}\n`);
      } catch (err) {
        emailError = err;
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
        console.error('⚠️  But email notification failed - check your SMTP configuration\n');
        
        // If connection timeout, suggest alternatives
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
          console.error('💡 SUGGESTION: Render.com is blocking SMTP connections on port 587.');
          console.error('   QUICK FIX: Update Render.com environment variables:');
          console.error('     - SMTP_PORT: 465');
          console.error('     - SMTP_SECURE: true');
          console.error('   Then restart your backend service.\n');
        }
      }
    } else {
      console.warn('⚠️  SMTP credentials not configured. Email notification skipped.');
      console.warn('⚠️  To enable email notifications, add SMTP_USER and SMTP_PASS to your .env file');
      console.log('✅ Contact form data saved to MongoDB successfully');
    }

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: savedForm._id,
        submittedAt: savedForm.submittedAt,
        emailSent: emailSent,
        emailError: emailError ? {
          message: emailError.message,
          code: emailError.code
        } : null
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
  const transporter = createTransporter();
  
  if (!transporter) {
    return res.status(400).json({
      success: false,
      message: 'SMTP credentials not configured',
      details: {
        SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
        SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing',
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
        OWNER_EMAIL: OWNER_EMAIL
      }
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
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        from: process.env.SMTP_USER,
        to: OWNER_EMAIL
      }
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: {
        message: error.message,
        code: error.code,
        command: error.command
      }
    });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});