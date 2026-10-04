"use client";

import { useActionState } from "react";
import { updateCodenameAction, type AuthFormState } from "@/app/actions/auth";

export function CodenameForm({ codename }: { codename: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(updateCodenameAction, {});
  const value = state.codename ?? codename;
  return (
    <form action={action} className="mt-3">
      <label htmlFor="codename" className="label-ink">
        Codename
      </label>
      <div className="mt-1.5 flex gap-3">
        <input
          key={value}
          id="codename"
          name="codename"
          defaultValue={value}
          required
          minLength={2}
          maxLength={24}
          autoComplete="nickname"
          className="min-w-0 flex-1 border-b-2 border-[#1d1a14]/40 bg-transparent px-1 py-2 font-mono text-[15px] text-[#1d1a14] outline-none focus:border-crimson-600"
        />
        <button type="submit" disabled={pending} className="btn btn-sm border-[#1d1a14]/50 text-[#1d1a14] hover:bg-[#1d1a14]/10">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-crimson-600">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-2 text-sm text-[#3d5a3a]">
          {state.ok}
        </p>
      )}
    </form>
  );
}
