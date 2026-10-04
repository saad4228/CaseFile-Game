"use client";

import { useActionState, useState } from "react";
import { guestAction, registerAction, signInAction, type AuthFormState } from "@/app/actions/auth";

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  minLength,
  maxLength,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label-ink">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="mt-1.5 w-full border-b-2 border-[#1d1a14]/40 bg-transparent px-1 py-2 font-mono text-[15px] text-[#1d1a14] outline-none transition-colors focus:border-crimson-600"
      />
    </label>
  );
}

function Message({ state }: { state: AuthFormState }) {
  if (state.error)
    return (
      <p role="alert" className="mt-4 border-l-4 border-crimson-600 bg-crimson-600/10 px-3 py-2 text-sm text-[#5a1a1a]">
        {state.error}
      </p>
    );
  if (state.ok) return <p className="mt-4 text-sm text-[#3d5a3a]">{state.ok}</p>;
  return null;
}

export function AuthForms({
  next,
  providers,
  initialMode,
  isGuest,
  oauthError,
}: {
  next: string;
  providers: ("google" | "github")[];
  initialMode: "signin" | "register";
  isGuest: boolean;
  oauthError?: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [signInState, signIn, signingIn] = useActionState(signInAction, {});
  const [registerState, doRegister, registering] = useActionState(registerAction, {});

  return (
    <div className="paper torn relative w-full max-w-md px-7 pb-9 pt-8 md:px-10">
      <div role="tablist" className="flex gap-6 border-b border-[#1d1a14]/20">
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => setMode(m)}
            className={`-mb-px border-b-2 pb-3 font-mono text-[11px] uppercase tracking-[0.22em] ${
              mode === m ? "border-crimson-600 text-[#1d1a14]" : "border-transparent text-[#1d1a14]/50 hover:text-[#1d1a14]"
            }`}
          >
            {m === "signin" ? "Sign in" : isGuest ? "Keep your file" : "Open a file"}
          </button>
        ))}
      </div>

      {oauthError && (
        <p role="alert" className="mt-5 border-l-4 border-crimson-600 bg-crimson-600/10 px-3 py-2 text-sm text-[#5a1a1a]">
          {oauthError}
        </p>
      )}

      {mode === "signin" ? (
        <form action={signIn} className="mt-6 space-y-5">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={signInState.email} key={`si-${signInState.email}`} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={200} />
          <Message state={signInState} />
          <button type="submit" disabled={signingIn} className="btn btn-primary w-full disabled:opacity-60">
            {signingIn ? "Checking the records…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={doRegister} className="mt-6 space-y-5">
          <input type="hidden" name="next" value={next} />
          {isGuest && (
            <p className="font-mono text-[11px] leading-relaxed text-[#1d1a14]/70">
              You&apos;re investigating as a guest. Register to keep your cases and record on any device.
            </p>
          )}
          <Field label="Codename" name="codename" autoComplete="nickname" minLength={2} maxLength={24} defaultValue={registerState.codename} key={`rc-${registerState.codename}`} />
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={registerState.email} key={`re-${registerState.email}`} />
          <Field label="Password (8+ characters)" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={200} />
          <Message state={registerState} />
          <button type="submit" disabled={registering} className="btn btn-primary w-full disabled:opacity-60">
            {registering ? "Filing…" : "Open my detective file"}
          </button>
        </form>
      )}

      {providers.length > 0 && (
        <div className="mt-8">
          <p className="label-ink text-center">or</p>
          <div className="mt-3 grid gap-2">
            {providers.map((p) => (
              <a
                key={p}
                href={`/api/auth/oauth/${p}?next=${encodeURIComponent(next)}`}
                className="btn btn-sm w-full border-[#1d1a14]/50 text-[#1d1a14] hover:bg-[#1d1a14]/5"
              >
                Continue with {p === "google" ? "Google" : "GitHub"}
              </a>
            ))}
          </div>
        </div>
      )}

      {!isGuest && (
        <form action={guestAction} className="mt-6 text-center">
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1d1a14]/60 underline-offset-4 hover:text-[#1d1a14] hover:underline">
            Continue as a guest →
          </button>
        </form>
      )}
    </div>
  );
}
