const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // SSL Port
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
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