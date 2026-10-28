# Sri Lalith Enterprises Backend

Backend API for the Sri Lalith Enterprises website, built using Node.js and Express.

## Live Backend
- Backend API: https://backend-srija0770-sri-lalith-enterprises.onrender.com/
- Frontend Website: https://srija0770-sri-lalith-enterprises.netlify.app/
## Project Overview
This backend handles business contact form submissions, stores them in MongoDB, validates incoming data, and sends email notifications to the business owner. It is built to support the main frontend website securely and efficiently.

## Features
- Contact form submission API
- MongoDB integration
- Input validation and sanitization
- Email sending via Nodemailer
- Health check endpoint
- Security middleware with Helmet and CORS
- Rate limiting
- Error handling

## Tech Stack
- Node.js
- Express
- MongoDB
- Mongoose
- Nodemailer
- Helmet
- CORS
- Express Rate Limit
- dotenv

## Project Structure
```bash
Backend-Srija0770/
├── server.js
├── validation.js
├── ContactFormSchema.js
├── package.json
├── .env
├── .gitignore
├── README.md
└── package-lock.json

# Backend Setup Instructions

## Prerequisites
- Node.js (version 18 or higher)
- MongoDB database (local installation or MongoDB Atlas account)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the Backend directory with:
```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
OWNER_EMAIL=your_email@gmail.com
```
**Important**: The `.env` file should be in the `Backend` directory (same level as `server.js`).

3. Configure your `.env` file in the Backend directory with the following variables:

### Required Environment Variables

- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
  - Local: `mongodb://localhost:27017/venkatrao-website`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/?appName=FreeCluster`
  - **Important Notes**:
    - Do not include quotes (`'` or `"`) around the connection string in the `.env` file
    - If your password contains special characters like `@`, `#`, `%`, etc., you must URL-encode them:
      - `@` becomes `%40`
      - `#` becomes `%23`
      - `%` becomes `%25`
      - `&` becomes `%26`
    - Example format (without quotes):
      ```
      MONGODB_URI=mongodb+srv://srijasrinivas994_db_user:Database@77@freecluster.3pivvwv.mongodb.net/?appName=FreeCluster
      ```
    - If your password has `@` in it, the connection string should look like:
      ```
      MONGODB_URI=mongodb+srv://username:Database%4077@cluster.mongodb.net/?appName=FreeCluster
      ```
- `SMTP_HOST`: SMTP server host (e.g., `smtp.gmail.com`) - **Optional**
- `SMTP_PORT`: SMTP server port (e.g., `587`) - **Optional**
- `SMTP_SECURE`: Use secure connection (`true` for 465, `false` for 587) - **Optional**
- `SMTP_USER`: Your email address for sending emails - **Optional**
- `SMTP_PASS`: Your email password or app password - **Optional**
- `OWNER_EMAIL`: Email address where contact form submissions will be sent - **Optional**

**Note**: SMTP credentials are optional. If not configured:
- Contact form submissions will still be saved to MongoDB successfully
- Email notifications will be skipped (with a warning in the console)
- The API will still return a success response

### Gmail Setup (Required for Email Notifications)

To receive email notifications when users submit the contact form, you need to configure Gmail SMTP:

**Step 1: Enable 2-Step Verification**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the prompts to enable 2-Step Verification (if not already enabled)

**Step 2: Generate an App Password**
1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "App passwords" (you'll only see this if 2-Step Verification is enabled)
3. Select "Mail" as the app
4. Select "Other (Custom name)" as the device and enter "Website Contact Form"
5. Click "Generate"
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

**Step 3: Add to .env file**
Add these lines to your `.env` file in the Backend directory:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mundrusaisrija@gmail.com
SMTP_PASS=your-16-character-app-password-here
OWNER_EMAIL=mundrusaisrija@gmail.com
```

**Important Notes:**
- Use the **App Password** (16 characters), NOT your regular Gmail password
- Remove spaces from the App Password when pasting (e.g., `abcdefghijklmnop` instead of `abcd efgh ijkl mnop`)
- After adding these to `.env`, restart your server for changes to take effect

## Running the Server

```bash
# Development mode with nodemon (auto-restart)
npm run dev

# Or using node directly
node server.js
```

The server will start on `http://localhost:3001` (or the port specified in `.env`)

## API Endpoints

### POST `/api/contact`
Submit contact form data (customer inquiries).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "company": "Example Company",
  "subject": "Inquiry about BOPP Tapes",
  "message": "I would like to know more about your products."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully. We will get back to you soon!",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "submittedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Please provide a valid full name", "Please provide a valid email address"]
}
```

### GET `/api/health`
Health check endpoint.

## Validation

The contact form validates:
- Full name must be valid
- Email must be valid
- Phone number must be valid
- Subject must be meaningful
- Message must be at least 10 characters

The system filters out common fake data patterns like "test", "demo", "fake", etc.

## Database
Contact form submissions are stored in MongoDB with the following schema:
- `name`: Full name
- `email`: Email address
- `phone`: Phone number
- `company`: Company name (optional)
- `subject`: Message subject
- `message`: Message content
- `submittedAt`: Timestamp
- `ipAddress`: Client IP address
- `createdAt`: Auto-generated timestamp
- `updatedAt`: Auto-generated timestamp

## Email Notifications
When a contact form is submitted:
1. Data is saved to MongoDB
2. An email is sent to the owner email address (`OWNER_EMAIL`)
3. The email includes all form fields in a structured HTML format
4. The reply-to address is set to the submitter's email for easy response

## Author
- Project Owner: MUNDRU SAI SRIJA
- GitHub: @Srija0770
- Role: Project Owner and Developer
## License
This project is proprietary to Sri Lalith Enterprises.
