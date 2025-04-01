import nodemailer from 'nodemailer';
import { ApiError } from "./ApiError.js";

/**
 * Sends an email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export const sendEmail = async (options) => {
  try {
    // Check if we're in development mode with TEST_EMAIL enabled
    if (process.env.NODE_ENV === 'development' && process.env.TEST_EMAIL === 'true') {
      // Log email instead of sending it
      console.log('=============== EMAIL WOULD BE SENT ===============');
      console.log('To:', options.email);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text);
      console.log('HTML:', options.html);
      console.log('==================================================');
      return; // Don't actually send email in test mode
    }

    // Create a transporter (for real email sending)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      // Set secure to true if port is 465, otherwise false
      secure: process.env.EMAIL_PORT === '465'
    });

    // Define email options
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Email error:", error);
    throw new ApiError(500, "Error sending email");
  }
}; 