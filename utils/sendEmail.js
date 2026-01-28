const sgMail = require('@sendgrid/mail');

// Set API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const msg = {
    to: options.email,
    from: {
      email: process.env.EMAIL_FROM || 'sopheapsothiphak@gmail.com',
      name: 'PetStore+ Support'
    },
    subject: options.subject,
    html: options.message,
  };

  try {
    await sgMail.send(msg);
    console.log("SendGrid Email Sent to:", options.email);
  } catch (error) {
    console.error("SendGrid Error:", error);

    if (error.response) {
      console.error(error.response.body);
    }
  }
};

module.exports = sendEmail;