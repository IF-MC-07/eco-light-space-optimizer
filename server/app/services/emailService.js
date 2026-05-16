import transporter from '../config/email.js';

export const sendDailyDigest = async (admins, activities) => {
  if (!admins || admins.length === 0) return;

  const activitySummary = activities.map(a => 
    `<li>[${new Date(a.timestamp).toLocaleTimeString()}] User ID ${a.user_id || 'System'}: ${a.action}</li>`
  ).join('');

  const mailOptions = {
    from: `"Eco-Light Optimizer" <${process.env.SMTP_USER}>`,
    to: admins.map(admin => admin.email).join(','),
    subject: `Daily System Activity Digest - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #059669;">Daily Activity Digest</h2>
        <p>Here is the summary of system activities for today:</p>
        <ul style="list-style: none; padding: 0;">
          ${activitySummary}
        </ul>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b;">Eco-light Space Optimizer - Automated System Report</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
