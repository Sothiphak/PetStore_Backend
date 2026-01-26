const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.googlemail.com', // 🟢 Try googlemail alias to bypass firewall
  port: 465, // SSL works best for Gmail
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Server is ready to take our messages");
  }
});

const sendEmail = async (options) => {
  const mailOptions = {
    from: `"PetStore+ Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Email sent: %s", info.messageId);
};

module.exports = sendEmail;