require('dotenv').config();
const sendEmail = require('../utils/sendEmail');

const testEmail = async () => {
    console.log("Attempting to send test email...");
    console.log("User:", process.env.EMAIL_USER ? "Set" : "Not Set");
    console.log("Pass:", process.env.EMAIL_PASS ? "Set" : "Not Set");

    try {
        await sendEmail({
            email: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from PetStore+',
            message: '<h1>It works!</h1><p>Your email configuration is correct.</p>'
        });
        console.log("✅ Email sent successfully!");
    } catch (error) {
        console.error("❌ Email failed:", error);
    }
};

testEmail();
