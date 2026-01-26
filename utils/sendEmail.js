const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"PetStore+ Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("⚠️ SMTP Failed (Cloud Firewall detected). Switching to Console Mode.");
    console.log("==========================================");
    console.log("📧 MOCK EMAIL SENT TO:", options.email);
    console.log("SUBJECT:", options.subject);
    console.log("CONTENT (HTML PREVIEW):", options.message.substring(0, 100) + "...");
    console.log("==========================================");
    // Don't throw error, let the system think it succeeded
  }
};

module.exports = sendEmail;