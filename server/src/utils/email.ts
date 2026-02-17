// server/src/utils/email.ts
import { Resend } from 'resend';
import logger from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Forks & Feedback <onboarding@resend.dev>'; // Resend testing default
const BRAND_COLOR = '#9c27b0'; // Primary Purple
const SECONDARY_COLOR = '#ff9800'; // Secondary Orange

/**
 * Wraps content in a professional HTML email layout
 */
function getEmailLayout(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
        .header { background-color: ${BRAND_COLOR}; padding: 30px; text-align: center; color: white; }
        .content { padding: 40px; background-color: #ffffff; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${SECONDARY_COLOR}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .tagline { font-size: 14px; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Forks & Feedback</div>
          <div class="tagline">Plate & Performance</div>
        </div>
        <div class="content">
          <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">${title}</h2>
          ${body}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Forks & Feedback. All rights reserved.</p>
          <p>You received this email because you are a registered member of our platform.</p>
          <div style="margin-top: 10px;">
            <a href="https://forks-feedback.com/privacy" style="color: #777; text-decoration: underline; margin: 0 10px;">Privacy Policy</a>
            <a href="https://forks-feedback.com/terms" style="color: #777; text-decoration: underline; margin: 0 10px;">Terms of Service</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, username: string) {
  const title = 'Welcome to the Community!';
  const body = `
    <p>Hi ${username},</p>
    <p>We're thrilled to have you join <strong>Forks & Feedback</strong>, the ultimate destination for discovering the perfect intersection of live music and exceptional dining.</p>
    <p>Start exploring local venues, saving your favorite performances, and planning your next unforgettable night out.</p>
    <a href="https://forks-feedback.com" class="button">Start Discovering</a>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Forks & Feedback!',
      html: getEmailLayout(title, body),
    });
    logger.info(`Welcome email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }
}

export async function sendClaimApprovalEmail(to: string, venueName: string) {
  const title = 'Your Venue Claim is Approved!';
  const body = `
    <p>Great news!</p>
    <p>Your claim for <strong>${venueName}</strong> has been officially approved by our administration team.</p>
    <p>You now have full access to your Operator Dashboard, where you can:</p>
    <ul>
      <li>Update your venue's hero image and gallery.</li>
      <li>Schedule upcoming live performances.</li>
      <li>Monitor your venue's performance metrics.</li>
    </ul>
    <a href="https://forks-feedback.com/manage" class="button">Go to Dashboard</a>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Venue Claim Approved!',
      html: getEmailLayout(title, body),
    });
    logger.info(`Claim approval email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send claim approval email:', error);
  }
}

export async function sendSubscriptionUpgradeEmail(to: string, venueName: string) {
  const title = 'Welcome to Forks & Feedback PRO!';
  const body = `
    <p>Congratulations!</p>
    <p><strong>${venueName}</strong> has been successfully upgraded to the <strong>PRO Tier</strong>.</p>
    <p>Your venue now enjoys the following premium benefits:</p>
    <ul>
      <li><strong>Unlimited</strong> event listings.</li>
      <li><strong>15 Gallery Images</strong> to showcase your space.</li>
      <li><strong>Featured Placement</strong> in search results and maps.</li>
      <li><strong>Advanced Analytics</strong> to track user engagement.</li>
    </ul>
    <p>Thank you for being a professional partner of Forks & Feedback.</p>
    <a href="https://forks-feedback.com/manage" class="button">Manage Your Pro Venue</a>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Subscription Upgraded - Welcome to PRO!',
      html: getEmailLayout(title, body),
    });
    logger.info(`Subscription upgrade email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send subscription upgrade email:', error);
  }
}

export async function sendSupportConfirmationEmail(to: string, ticketId: number) {
  const title = 'We Received Your Request';
  const body = `
    <p>Hello,</p>
    <p>Thank you for reaching out to the Forks & Feedback support team. We've received your message and assigned it ticket ID <strong>#${ticketId}</strong>.</p>
    <p>One of our administrators will review your inquiry and get back to you at this email address as soon as possible.</p>
    <p>Current Status: <span style="color: ${SECONDARY_COLOR}; font-weight: bold;">OPEN</span></p>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Support Request Received [#${ticketId}]`,
      html: getEmailLayout(title, body),
    });
    logger.info(`Support confirmation email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send support confirmation email:', error);
  }
}
