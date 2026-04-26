export const OTP_CHANNELS = ["email", "sms", "whatsapp"] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];

export const OTP_ROLES = ["STUDENT", "PROVIDER"] as const;
export type OtpRole = (typeof OTP_ROLES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;

export function isOtpChannel(value: unknown): value is OtpChannel {
  return typeof value === "string" && OTP_CHANNELS.includes(value as OtpChannel);
}

export function normalizeOtpRole(value: unknown): OtpRole {
  return value === "PROVIDER" ? "PROVIDER" : "STUDENT";
}

export function normalizeOtpIdentifier(
  channel: OtpChannel,
  value: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: false, error: "identifier required" };

  if (channel === "email") {
    const email = raw.toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: "Please enter a valid email address." };
    }
    return { ok: true, value: email };
  }

  const compact = raw.replace(/[()\s-]/g, "");
  const normalized = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact.startsWith("+")
      ? compact
      : compact.length === 10
        ? `+91${compact}`
        : `+${compact}`;

  if (!E164_RE.test(normalized)) {
    return {
      ok: false,
      error: "Please enter a valid phone number with country code.",
    };
  }

  return { ok: true, value: normalized };
}
