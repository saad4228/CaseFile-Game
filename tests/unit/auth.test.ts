import { describe, expect, it } from "vitest";
import { cleanCodename, randomCodename } from "@/lib/auth/codename";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("passwords", () => {
  it("round-trips and rejects the wrong password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("treats malformed hashes as a mismatch", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("codenames", () => {
  it("accepts readable names and trims whitespace", () => {
    expect(cleanCodename("  Grey   Heron ")).toBe("Grey Heron");
    expect(cleanCodename("Det. O'Hara")).toBe("Det. O'Hara");
  });

  it("rejects markup, empty and overlong names", () => {
    expect(cleanCodename("<b>x</b>")).toBeNull();
    expect(cleanCodename("a")).toBeNull();
    expect(cleanCodename("x".repeat(25))).toBeNull();
  });

  it("generates valid guest codenames", () => {
    for (let i = 0; i < 20; i++) expect(cleanCodename(randomCodename())).not.toBeNull();
  });
});
