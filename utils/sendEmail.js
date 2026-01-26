const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4, // 🟢 Force IPv4 (Fixes timeouts on some cloud providers)
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });

  const mailOptions = {
    from: `"PetStore+ Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("📧 Real Email Sent: %s", info.messageId);
};

module.exports = sendEmail;