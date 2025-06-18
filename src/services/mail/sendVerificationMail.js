const nodemailer = require("nodemailer");
require("dotenv").config();

const sendVerificationMail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  console.log(process.env.EMAIL_SERVER_HOST, "process.env.EMAIL_SERVER_HOST");

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Верификация в GaiQA`,
    html: `<div>
            ${token}
          </div>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationMail;
