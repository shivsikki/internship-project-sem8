const nodemailer = require('nodemailer');

/**
 * Professional Email Service for Clinical Notifications
 */
const sendConsultationEmail = async (patientEmail, patientName, doctorName, roomName) => {
  try {
    // Configure Transporter (Defaults to Gmail - needs App Password in .env)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/video-call/${roomName}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8faf8; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e1e8e1;">
        <div style="background: linear-gradient(135deg, #395744 0%, #2f4738 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Hippocrates Lab</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0 0; font-size: 14px;">Clinical Care Connect</p>
        </div>
        
        <div style="padding: 40px; background-color: white;">
          <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">Safe Consultation Started</h2>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Hi <strong>${patientName}</strong>,
          </p>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Your clinical provider, <strong>Dr. ${doctorName}</strong>, has initiated your secure video consultation session and is waiting for you in the clinical room.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${joinUrl}" style="background-color: #395744; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(57, 87, 68, 0.3);">
              Join Secure Meeting
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; line-height: 1.5; border-top: 1px solid #edf2f7; padding-top: 20px;">
            <strong>Quick Instructions:</strong><br/>
            - Open your Enquiries Hub at Hippocrates Lab.<br/>
            - Ensure your camera and microphone are enabled.<br/>
            - Click the button above to join instantly.
          </p>
        </div>
        
        <div style="background-color: #f1f5f1; padding: 20px; text-align: center; border-top: 1px solid #e1e8e1;">
          <p style="margin: 0; color: #718096; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Hippocrates Lab. This is an automated clinical alert.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Hippocrates Lab" <${process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: 'Urgent: Your Clinical Consultation has Started',
      html: htmlContent
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️  [EMAIL SKIPPED]: Set EMAIL_USER and EMAIL_PASS in .env to send real emails.');
      console.log('\x1b[36m%s\x1b[0m', `[PREVIEW URL]: ${joinUrl}`);
      return { success: false, message: 'Email credentials not configured' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('\x1b[32m%s\x1b[0m', `📧  [EMAIL SENT]: Consultation invite sent to ${patientEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Service Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendConsultationEmail
};
