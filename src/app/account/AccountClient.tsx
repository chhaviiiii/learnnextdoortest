"use client";

import { useState } from "react";
import { ProfileField, type VerificationState } from "@/components/ProfileField";

type FieldKey = "name" | "email" | "phone";

type FieldData = {
  value: string;
  state: VerificationState;
};

type ProfileState = Record<FieldKey, FieldData>;

type AccountClientProps = {
  initialUser: {
    name: string;
    email: string;
    phone: string;
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{8,15}$/;

function buildInitialState(initialUser: AccountClientProps["initialUser"]): ProfileState {
  const hasName = Boolean(initialUser.name.trim());
  const hasEmail = Boolean(initialUser.email.trim());
  const hasPhone = Boolean(initialUser.phone.trim());

  return {
    name: {
      value: initialUser.name,
      state: hasName ? "verified" : "empty",
    },
    email: {
      value: initialUser.email,
      state: hasEmail ? "pending" : "empty",
    },
    phone: {
      value: initialUser.phone,
      state: hasPhone ? "pending" : "empty",
    },
  };
}

export function AccountClient({ initialUser }: AccountClientProps) {
  const [profile, setProfile] = useState<ProfileState>(() => buildInitialState(initialUser));

  function saveField(key: FieldKey, nextValue: string) {
    if (key === "name" && !nextValue.trim()) {
      return { ok: false as const, error: "Full Name is required" };
    }

    if (key === "email") {
      if (!nextValue.trim()) {
        return { ok: false as const, error: "Email Address is required" };
      }
      if (!EMAIL_RE.test(nextValue)) {
        return { ok: false as const, error: "Please enter a valid email address" };
      }
    }

    if (key === "phone") {
      if (!nextValue.trim()) {
        return { ok: false as const, error: "Please enter a phone number or cancel" };
      }
      if (!PHONE_RE.test(nextValue.replace(/\s+/g, ""))) {
        return { ok: false as const, error: "Please enter a valid phone number" };
      }
    }

    const nextState: VerificationState = key === "name" ? "verified" : "pending";

    setProfile((prev) => ({
      ...prev,
      [key]: { value: nextValue, state: nextState },
    }));

    return { ok: true as const };
  }

  function verifyField(key: FieldKey) {
    setProfile((prev) => {
      const current = prev[key];
      if (current.state !== "pending") return prev;

      return {
        ...prev,
        [key]: { ...current, state: "verified" },
      };
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">My Account</h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage your personal details. Verification is simulated in this frontend demo.
            </p>
          </header>

          <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
            <ProfileField
              label="Full Name"
              value={profile.name.value}
              state={profile.name.state}
              type="text"
              onSave={(value) => saveField("name", value)}
              onVerify={() => verifyField("name")}
            />

            <ProfileField
              label="Email Address"
              value={profile.email.value}
              state={profile.email.state}
              type="email"
              onSave={(value) => saveField("email", value)}
              onVerify={() => verifyField("email")}
            />

            <ProfileField
              label="Phone Number"
              value={profile.phone.value}
              state={profile.phone.state}
              type="phone"
              onSave={(value) => saveField("phone", value)}
              onVerify={() => verifyField("phone")}
              helperText="Optional — you can add this later"
            />
          </div>
        </section>
      </div>
    </main>
  );
}