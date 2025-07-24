// visitors/backend/index.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const appRoutes = require('./routes/appRoutes'); // Changed from visitorRoutes
const brevo = require('@getbrevo/brevo');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

let apiInstance = new brevo.TransactionalEmailsApi();

let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

console.log(`Brevo API Key: ${process.env.BREVO_API_KEY ? 'Loaded' : 'Not Loaded'}`);



// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Database connection
mongoose.connect('mongodb+srv://harisrini777:RGjDUBMwAps7hhpR@visitors.qxu9fyj.mongodb.net/?retryWrites=true&w=majority&appName=visitors')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process if database connection fails
    });

// Routes
app.use('/api', appRoutes); // Use the combined routes

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Visitor Backend API is running!');
});






// Send welcome email endpoint
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    console.log('Received request to send welcome email:', req.body);
    
    const { email, companyName } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">Welcome to Forza Freedom!</h1>
            <div style="width: 50px; height: 3px; background-color: #3498db; margin: 0 auto;"></div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              Hello ${companyName ? `<strong>${companyName}</strong>` : ''},
            </p>
            
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              We're excited to have you with us! To stay updated with the latest news, offers, and support, we invite you to join our official WhatsApp group.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://whatsapp.com/channel/0029Vaii6L223n3mnHWk773m" 
               style="display: inline-block; background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              👉 Join WhatsApp Group
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; font-size: 14px; line-height: 1.6;">
              Feel free to reach out if you have any questions — we're here to help!
            </p>
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>Forza Freedom Team</strong>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #95a5a6; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Create email object
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    console.log(`Preparing to send email to: ${email}`);
    
    
    sendSmtpEmail.subject = "Welcome to Forza Freedom - Join Our Community!";
    sendSmtpEmail.htmlContent = emailContent;
    sendSmtpEmail.sender = { 
      name: "Forza Freedom", 
      email: process.env.BREVO_SENDER_EMAIL || "noreply@forzafreedom.com" 
    };
    sendSmtpEmail.to = [{ email: email}];
    sendSmtpEmail.replyTo = { 
      email: process.env.BREVO_REPLY_EMAIL || "support@forzafreedom.com", 
      name: "Forza Freedom Support" 
    };

    console.log(`Sending email to: ${email}`);
    

    // Send email
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Email sent successfully:', data);
    
    res.json({
      success: true,
      message: 'Welcome email sent successfully!',
      messageId: data.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    let errorMessage = 'Failed to send email. Please try again.';
    if (error.response?.body?.message) {
      errorMessage = error.response.body.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// Error handling middleware (optional, but good practice)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});