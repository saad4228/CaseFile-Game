import "server-only";
import { db } from "@/lib/db/prisma";
import { hasDatabase } from "@/lib/env";

// Cases are content-as-code; the CaseFile table only lets an admin pull a case from the
// archive without a deploy. No row (or no database) means published.

export async function isCasePublished(caseId: string): Promise<boolean> {
  if (!hasDatabase()) return true;
  try {
    const row = await db().caseFile.findUnique({ where: { id: caseId }, select: { published: true } });
    return row?.published ?? true;
  } catch {
    return true;
  }
}

export async function unpublishedCaseIds(): Promise<Set<string>> {
  if (!hasDatabase()) return new Set();
  try {
    const rows = await db().caseFile.findMany({ where: { published: false }, select: { id: true } });
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}
