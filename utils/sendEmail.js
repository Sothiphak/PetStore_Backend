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

  const info = await transporter.sendMail(mailOptions);
  console.log("📧 Real Email Sent: %s", info.messageId);
};

module.exports = sendEmail;

