import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForms } from "@/components/auth/AuthForms";
import { Rain } from "@/components/illustrations/Rain";
import { TopNav } from "@/components/landing/TopNav";
import { enabledProviders } from "@/lib/auth/oauth";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

const oauthErrors: Record<string, string> = {
  provider: "That sign-in provider isn't configured on this deployment.",
  state: "The sign-in attempt expired. Try again.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(sp.next, "/archive");
  const user = await getCurrentUser();
  const mode = sp.mode === "register" ? "register" : "signin";
  if (user && !user.isGuest) redirect(next);
  const err = typeof sp.error === "string" ? (oauthErrors[sp.error] ?? sp.error.slice(0, 200)) : undefined;

  return (
    <>
      <TopNav tone="solid" />
      <main className="relative flex min-h-[calc(100svh-77px)] items-center justify-center overflow-hidden px-4 py-16">
        <Rain className="absolute inset-0 h-full w-full opacity-50" density={0.5} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(240,174,85,0.14),transparent_70%)]" />
        <div className="relative grid w-full max-w-5xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="label">Vesper City PD — Personnel</p>
            <h1 className="font-display mt-4 text-5xl leading-[0.95] md:text-7xl">
              Identify
              <br />
              <em className="text-amber-300">yourself.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-bone-100/70">
              Your detective file keeps every case you close, your scores, and the teams you&apos;ve
              worked with. You can also start as a guest and register later — nothing is lost.
            </p>
          </div>
          {hasDatabase() ? (
            <AuthForms
              next={next}
              providers={enabledProviders()}
              initialMode={mode}
              isGuest={Boolean(user?.isGuest)}
              oauthError={err}
            />
          ) : (
            <div className="paper torn px-8 py-10">
              <p className="label-ink">Demo mode</p>
              <p className="font-display mt-3 text-3xl text-[#1d1a14]">The personnel office is closed.</p>
              <p className="mt-4 text-sm leading-relaxed text-[#1d1a14]/80">
                This deployment has no database, so accounts, profiles and team rooms are switched off.
                The demo case is fully playable and saves on this device.
              </p>
              <Link href="/cases/047" className="btn btn-primary mt-8">
                Play the demo case
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
