const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text'); // ✅ Correct
// Check your html-to-text version (npm list html-to-text).
// If using v8+, replace htmlToText.fromString(html) with convert(html).
// If using v7.1.2 or lower, keep using fromString(html).
// If needed, downgrade to v7.1.2 (npm install html-to-text@7.1.2).
// convert() is an exported function, not the default export.
// If you're using CommonJS (require), you must extract convert from the module:

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Le Ngoc Sang <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SENDGRID
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send the actual email
  async send(template, subject) {
    // 1. RENDER HTML BASED ON A PUG TEMPLATE
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2. DEFINE EMAIL OPTIONS
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    // 3. CREATE A TRANSFORT AND SEND EMAIL
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    console.log(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
    await this.send('welcome', 'Welcome to the Natours Family');
    // 'Welcome' refers to the name of the Pug template file (e.g., Welcome.pug) inside the views/emails/ directory.
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};
