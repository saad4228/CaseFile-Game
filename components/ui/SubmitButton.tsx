"use client";

import { useFormStatus } from "react-dom";

/** A submit button that disables itself while its form's server action runs. */
export function SubmitButton({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? <span className="animate-pulse">{pendingText ?? children}</span> : children}
    </button>
  );
}
