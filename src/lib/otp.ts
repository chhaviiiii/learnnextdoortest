/**
 * OTP adapter.
 *
 * Email OTP delivery is wired through Resend (https://resend.com).
 * SMS and WhatsApp channels are stubbed — plug in Twilio or MSG91 later.
 *
 * Delivery mode selection:
 *   - If OTP_DEV_MODE === "true" (explicit) OR RESEND_API_KEY is missing → dev mode
 *     (print to server console and also return devCode in the /api/auth/send-otp response).
 *   - Otherwise → real delivery via Resend.
 *
 * Required env vars for real email delivery:
 *   RESEND_API_KEY   — e.g. "re_xxxxxxxxxxxx"
 *   EMAIL_FROM       — e.g. "LearnNextDoor <noreply@yourdomain.com>"
 *                     MUST be a verified sender in Resend, OR "onboarding@resend.dev"
 *                     for pre-domain-verification testing.
 */

export function generateOtp(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

export function isDevMode() {
  if (process.env.OTP_DEV_MODE === "true") return true;
  if (!process.env.RESEND_API_KEY) return true;
  return false;
}

export async function deliverOtp(
  channel: "whatsapp" | "sms" | "email",
  identifier: string,
  code: string
) {
  if (isDevMode()) {
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

async function sendWhatsApp(_phone: string, _code: string): Promise<never> {
  throw new Error(
    "WhatsApp OTP is not yet configured. Use Email OTP for now, or wire up Twilio WhatsApp and redeploy."
  );
}

async function sendSms(_phone: string, _code: string): Promise<never> {
  throw new Error(
    "SMS OTP is not yet configured. Use Email OTP for now, or wire up Twilio / MSG91 and redeploy."
  );
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
