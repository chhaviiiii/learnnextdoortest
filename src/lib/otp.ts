/**
 * OTP adapter.
 *
 * Email OTP delivery is wired through Resend (https://resend.com).
 * SMS OTP delivery is wired through Twilio Programmable Messaging.
 * WhatsApp OTP can also use Twilio if TWILIO_WHATSAPP_FROM is configured.
 *
 * Delivery mode selection:
 *   - OTP_DEV_MODE=true  → local-only dev mode for every channel.
 *   - Any other value    → real delivery for every channel, with a clear error if
 *                          that channel's provider env vars are missing.
 *
 * Required env vars for real email delivery:
 *   RESEND_API_KEY   — e.g. "re_xxxxxxxxxxxx"
 *   EMAIL_FROM       — e.g. "LearnNextDoor <noreply@yourdomain.com>"
 *                     MUST be a verified sender in Resend, OR "onboarding@resend.dev"
 *                     for pre-domain-verification testing.
 *
 * Required env vars for real SMS delivery:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET preferred for production
 *   TWILIO_AUTH_TOKEN fallback for local/testing
 *   TWILIO_SMS_FROM   — Twilio phone number in E.164 format, e.g. "+15551234567"
 */

import type { OtpChannel } from "@/lib/identifiers";

export function generateOtp(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

export function isDevMode(channel: OtpChannel = "email") {
  return process.env.OTP_DEV_MODE === "true";
}

export async function deliverOtp(
  channel: OtpChannel,
  identifier: string,
  code: string
) {
  if (isDevMode(channel)) {
    // eslint-disable-next-line no-console
    console.log(
      `\n===== [DEV] OTP ${channel.toUpperCase()} → ${identifier} =====\n  ${code}\n===== expires in 10 min =====\n`
    );
    return { ok: true as const, dev: true as const };
  }

  if (channel === "email") return sendEmail(identifier, code);
  if (channel === "whatsapp") return sendWhatsApp(identifier, code);
  if (channel === "sms") return sendSms(identifier, code);
  throw new Error(`Unknown OTP channel: ${channel}`);
}

async function sendEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "LearnNextDoor <onboarding@resend.dev>";
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to your .env / Vercel env vars.");
  }

  const subject = "Your LearnNextDoor verification code";
  const html = emailTemplate(code);
  const text = `Your LearnNextDoor verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: email, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error("[OTP] Resend API error:", res.status, body);
    throw new Error(
      `Email delivery failed (${res.status}). Check EMAIL_FROM is verified in Resend, or use onboarding@resend.dev for testing.`
    );
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true as const, dev: false as const, providerId: data.id };
}

async function sendWhatsApp(phone: string, code: string) {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error("TWILIO_WHATSAPP_FROM is not set. Add it to your .env / Vercel env vars.");
  }
  return sendTwilioMessage(`whatsapp:${phone}`, from, otpText(code));
}

async function sendSms(phone: string, code: string) {
  const from = process.env.TWILIO_SMS_FROM;
  if (!from) {
    throw new Error("TWILIO_SMS_FROM is not set. Add it to your .env / Vercel env vars.");
  }
  return sendTwilioMessage(phone, from, otpText(code));
}

async function sendTwilioMessage(to: string, from: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = twilioAuthHeader();
  if (!sid || !auth) {
    throw new Error(
      "Twilio SMS requires TWILIO_ACCOUNT_SID, TWILIO_SMS_FROM, and either TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET or TWILIO_AUTH_TOKEN.",
    );
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error("[OTP] Twilio API error:", res.status, text);
    throw new Error(`SMS delivery failed (${res.status}). Check your Twilio sender, credentials, and recipient format.`);
  }

  const data = (await res.json().catch(() => ({}))) as { sid?: string };
  return { ok: true as const, dev: false as const, providerId: data.sid };
}

function twilioAuthHeader() {
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  if (apiKeySid && apiKeySecret) {
    return `Basic ${Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64")}`;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  }

  return null;
}

function otpText(code: string) {
  return `Your LearnNextDoor verification code is ${code}. It expires in 10 minutes.`;
}

function emailTemplate(code: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafaff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1340;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaff;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;padding:32px;box-shadow:0 6px 24px -10px rgba(48,28,128,0.12);">
            <tr>
              <td>
                <div style="display:inline-block;background:linear-gradient(135deg,#4c27b0 0%,#ff7e38 100%);padding:10px 14px;border-radius:10px;color:#ffffff;font-weight:700;font-size:18px;letter-spacing:-0.5px;">
                  LearnNextDoor
                </div>
                <h1 style="margin:24px 0 8px;font-size:22px;font-weight:800;color:#1a1340;">
                  Your verification code
                </h1>
                <p style="margin:0 0 24px;color:#6b5ab7;font-size:14px;line-height:1.5;">
                  Enter this code in the app to sign in. It expires in 10 minutes.
                </p>
                <div style="background:#f4f2ff;padding:20px;border-radius:14px;text-align:center;font-family:ui-monospace,Menlo,Monaco,monospace;font-size:32px;letter-spacing:0.4em;font-weight:700;color:#322373;">
                  ${code}
                </div>
                <p style="margin:24px 0 0;color:#6b5ab7;font-size:12px;line-height:1.6;">
                  If you didn't request this code, you can safely ignore this email — someone may have typed your address by mistake.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#8b7fbc;font-size:11px;">
            LearnNextDoor · Hyperlocal learning, Pitampura, Delhi
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
