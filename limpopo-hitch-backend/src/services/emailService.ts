import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

// ─── Transporter ─────────────────────────────────────────────────────────────
// If SMTP_HOST is not configured, emails are logged to console (dev mode)
const transporter = ENV.SMTP_HOST
  ? nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: Number(ENV.SMTP_PORT) || 587,
      secure: Number(ENV.SMTP_PORT) === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    })
  : null;

// ─── Send Verification PIN Email ─────────────────────────────────────────────
export async function sendVerificationEmail(to: string, pin: string, name: string): Promise<void> {
  if (!transporter) {
    // Dev mode — log PIN to console so developer can test without SMTP
    console.log(`\n📧 [DEV EMAIL] Verification PIN for ${to} (${name}): \x1b[33m${pin}\x1b[0m\n`);
    return;
  }

  await transporter.sendMail({
    from: ENV.SMTP_FROM,
    to,
    subject: "Your Hitch Connect verification code",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🏔 Hitch Connect</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Africa's ride-sharing community</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
                  <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                    Welcome to Hitch Connect! To complete your registration, please enter the verification code below.
                    This code expires in <strong>15 minutes</strong>.
                  </p>
                  <!-- PIN Box -->
                  <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <p style="margin:0 0 4px;color:#15803d;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
                    <p style="margin:0;color:#111827;font-size:40px;font-weight:800;letter-spacing:10px;font-family:monospace;">${pin}</p>
                  </div>
                  <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                    If you didn't create a Hitch Connect account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:11px;">
                    © ${new Date().getFullYear()} Hitch Connect · Built by 
                    <a href="https://dac-technologies.co.za" style="color:#16a34a;text-decoration:none;">DAC Technology</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
