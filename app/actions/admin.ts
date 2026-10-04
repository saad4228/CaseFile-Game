"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin.server";
import { db } from "@/lib/db/prisma";
import { getBundle } from "@/lib/game-engine/cases.server";

export async function setCasePublishedAction(form: FormData) {
  const admin = await requireAdmin();
  const caseId = String(form.get("caseId") ?? "");
  if (!getBundle(caseId)) return;
  const published = form.get("published") === "true";
  await db().caseFile.upsert({
    where: { id: caseId },
    create: { id: caseId, published, updatedById: admin.id },
    update: { published, updatedById: admin.id },
  });
  revalidatePath("/admin");
  revalidatePath("/archive");
}

/** Clear expired sign-ins, spent rate-limit windows and rooms abandoned in the lobby. */
export async function purgeStaleAction() {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  await db().$transaction([
    db().authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db().rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }),
    db().gameSession.deleteMany({ where: { phase: "LOBBY", lastActivityAt: { lt: weekAgo } } }),
  ]);
  revalidatePath("/admin");
}
