import nodemailer from 'nodemailer';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'yellowreignacademy@gmail.com';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return null;
}

export async function sendEmail({ to, subject, html, text, type, details = {} }) {
  const logId = uuidv4();
  const createdAt = new Date().toISOString();
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email Service] SMTP credentials not fully configured in environment variables. Email logged for admin inspection.`);
    const errorMsg = 'SMTP credentials pending in .env (SMTP_HOST, SMTP_USER, SMTP_PASS)';
    db.prepare(`
      INSERT INTO email_logs (id, recipient, subject, type, status, details_json, error_message, created_at)
      VALUES (?, ?, ?, ?, 'PENDING_CONFIG', ?, ?, ?)
    `).run(logId, to, subject, type, JSON.stringify({ ...details, htmlContent: html }), errorMsg, createdAt);

    return {
      success: false,
      status: 'PENDING_CONFIG',
      message: 'SMTP credentials pending in .env. Notification recorded in Admin Email Center.',
      logId
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"Yellow Reign Academy" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html
    });

    console.log(`[Email Service] Sent email to ${to} (MessageId: ${info.messageId})`);
    db.prepare(`
      INSERT INTO email_logs (id, recipient, subject, type, status, details_json, error_message, created_at)
      VALUES (?, ?, ?, ?, 'SENT', ?, NULL, ?)
    `).run(logId, to, subject, type, JSON.stringify({ ...details, messageId: info.messageId }), createdAt);

    return { success: true, status: 'SENT', messageId: info.messageId, logId };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${to}:`, err.message);
    db.prepare(`
      INSERT INTO email_logs (id, recipient, subject, type, status, details_json, error_message, created_at)
      VALUES (?, ?, ?, ?, 'FAILED', ?, ?, ?)
    `).run(logId, to, subject, type, JSON.stringify(details), err.message, createdAt);

    return { success: false, status: 'FAILED', error: err.message, logId };
  }
}

// 1. Registration notification sent to yellowreignacademy@gmail.com
export async function sendRegistrationNotification({ name, email, phone, registeredAt }) {
  const subject = `[Yellow Reign Admin] New User Registered: ${name}`;
  const text = `New User Registered on Yellow Reign Academy:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nDate & Time: ${registeredAt}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d0e; color: #f3f4f6; border: 1px solid #eab308; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #18181b 0%, #0c0d0e 100%); padding: 30px; text-align: center; border-bottom: 2px solid #eab308;">
        <h1 style="color: #eab308; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Yellow Reign Academy</h1>
        <p style="color: #a1a1aa; margin: 5px 0 0 0; font-size: 14px;">Digital Magazine Submission & Publishing Portal</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; border-bottom: 1px solid #27272a; padding-bottom: 10px;">
          🔔 New User Registration Alert
        </h2>
        <p style="color: #d4d4d8; line-height: 1.6;">
          A new user has just registered an account on the publishing platform.
        </p>
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; width: 140px; font-weight: 600;">Full Name:</td>
              <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-weight: 600;">Email Address:</td>
              <td style="padding: 8px 0; color: #eab308;"><a href="mailto:${email}" style="color: #eab308; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-weight: 600;">Phone Number:</td>
              <td style="padding: 8px 0; color: #ffffff;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a1a1aa; font-weight: 600;">Registered At:</td>
              <td style="padding: 8px 0; color: #ffffff;">${registeredAt}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/admin/users" style="background: #eab308; color: #000000; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">
            Open Admin Dashboard
          </a>
        </div>
      </div>
      <div style="background: #141416; padding: 20px; text-align: center; border-top: 1px solid #27272a; font-size: 12px; color: #71717a;">
        Sent to Super Admin Sayhan (yellowreignacademy@gmail.com) • Yellow Reign Academy
      </div>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    text,
    html,
    type: 'REGISTRATION',
    details: { name, email, phone, registeredAt }
  });
}

// 2. Magazine submission notification sent to yellowreignacademy@gmail.com
export async function sendSubmissionNotification({
  submitterName,
  email,
  phone,
  magazineTitle,
  description,
  category,
  pageCount,
  submittedAt,
  magazineId
}) {
  const adminReviewUrl = `${APP_URL}/admin/submissions?highlight=${magazineId}`;
  const subject = `[Yellow Reign Admin] New Magazine Submission: "${magazineTitle}" by ${submitterName}`;
  const text = `New Magazine Submitted for Review:\nTitle: ${magazineTitle}\nSubmitter: ${submitterName}\nEmail: ${email}\nPhone: ${phone}\nCategory: ${category}\nPages: ${pageCount}\nDate & Time: ${submittedAt}\nReview URL: ${adminReviewUrl}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #0c0d0e; color: #f3f4f6; border: 1px solid #eab308; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #18181b 0%, #0c0d0e 100%); padding: 30px; text-align: center; border-bottom: 2px solid #eab308;">
        <h1 style="color: #eab308; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Yellow Reign Academy</h1>
        <p style="color: #a1a1aa; margin: 5px 0 0 0; font-size: 14px;">Digital Magazine Submission & Publishing Portal</p>
      </div>
      <div style="padding: 30px;">
        <div style="display: inline-block; background: #eab308; color: #000; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 15px;">
          Pending Admin Approval
        </div>
        <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 15px 0;">
          📄 New Magazine Submission Awaiting Your Review
        </h2>
        <p style="color: #d4d4d8; line-height: 1.6;">
          <strong>${submitterName}</strong> has submitted a new magazine. Submissions remain private until you inspect, approve, and publish them to the public library.
        </p>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #eab308; margin-top: 0; font-size: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">Magazine Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; width: 140px; font-weight: 600;">Title:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: bold; font-size: 15px;">${magazineTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600;">Category:</td>
              <td style="padding: 6px 0; color: #eab308;">${category || 'General'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600;">Total Pages:</td>
              <td style="padding: 6px 0; color: #ffffff;">${pageCount} pages</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600;">Submitted At:</td>
              <td style="padding: 6px 0; color: #ffffff;">${submittedAt}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600; vertical-align: top;">Description:</td>
              <td style="padding: 6px 0; color: #d4d4d8; font-style: italic;">${description || 'No description provided'}</td>
            </tr>
          </table>

          <h3 style="color: #eab308; margin: 20px 0 0 0; font-size: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">Submitter Contact</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; width: 140px; font-weight: 600;">Name:</td>
              <td style="padding: 6px 0; color: #ffffff;">${submitterName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600;">Email:</td>
              <td style="padding: 6px 0; color: #ffffff;"><a href="mailto:${email}" style="color: #eab308;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; font-weight: 600;">Phone:</td>
              <td style="padding: 6px 0; color: #ffffff;"><a href="tel:${phone}" style="color: #eab308;">${phone}</a></td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${adminReviewUrl}" style="background: #eab308; color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);">
            Review & Publish in Admin Dashboard
          </a>
        </div>
      </div>
      <div style="background: #141416; padding: 20px; text-align: center; border-top: 1px solid #27272a; font-size: 12px; color: #71717a;">
        Sent to Super Admin Sayhan (yellowreignacademy@gmail.com) • Yellow Reign Academy
      </div>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    text,
    html,
    type: 'SUBMISSION',
    details: { submitterName, email, phone, magazineTitle, category, pageCount, submittedAt, magazineId, adminReviewUrl }
  });
}

// 3. Test SMTP connection
export async function testSmtpConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      message: 'SMTP credentials missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env'
    };
  }

  try {
    await transporter.verify();
    const testResult = await sendEmail({
      to: ADMIN_EMAIL,
      subject: '[Yellow Reign Admin] SMTP Diagnostic Test Successful',
      text: 'Your SMTP mail server configuration is working properly!',
      html: `
        <div style="background:#0c0d0e; color:#fff; padding:25px; border-radius:10px; border:1px solid #eab308;">
          <h2 style="color:#eab308;">SMTP Diagnostic Test Successful</h2>
          <p>Your SMTP mail server configuration is connected and working seamlessly!</p>
          <p style="color:#a1a1aa;">Sent to: ${ADMIN_EMAIL} at ${new Date().toLocaleString()}</p>
        </div>
      `,
      type: 'TEST'
    });
    return { success: true, message: `SMTP connection verified and test message sent to ${ADMIN_EMAIL}`, testResult };
  } catch (err) {
    return { success: false, message: `SMTP verification failed: ${err.message}` };
  }
}

