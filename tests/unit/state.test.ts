import { describe, expect, it } from "vitest";
import {
  applyPersonal,
  applyShared,
  initialPersonal,
  initialShared,
  LIMITS,
  normalizePersonal,
  normalizeShared,
  SharedOpSchema,
  type SharedOp,
} from "@/lib/game-engine/state";

const run = (ops: SharedOp[], s = initialShared()) => ops.reduce(applyShared, s);

describe("shared state reducer", () => {
  it("adds, moves and removes board nodes, dropping their edges", () => {
    const s = run([
      { t: "board.add", node: { id: "n1", kind: "evidence", ref: "E-001", x: 0, y: 0 } },
      { t: "board.add", node: { id: "n2", kind: "evidence", ref: "E-002", x: 10, y: 10 } },
      { t: "edge.add", edge: { id: "e1", source: "n1", target: "n2", kind: "SUPPORTS" } },
      { t: "board.move", id: "n1", x: 50, y: 60 },
    ]);
    expect(s.board.nodes.find((n) => n.id === "n1")).toMatchObject({ x: 50, y: 60 });
    expect(s.board.edges).toHaveLength(1);
    const after = applyShared(s, { t: "board.remove", id: "n2" });
    expect(after.board.nodes.map((n) => n.id)).toEqual(["n1"]);
    expect(after.board.edges).toHaveLength(0);
  });

  it("is idempotent: replaying an op changes nothing", () => {
    const ops: SharedOp[] = [
      { t: "board.add", node: { id: "n1", kind: "note", text: "hm", x: 0, y: 0 } },
      { t: "timeline.place", id: "E-004" },
      { t: "verdict.set", field: "who", value: "marcus_reed" },
      { t: "verdict.attach", slot: "motive", evidence: "E-010" },
      { t: "conflict.mark", id: "C-01", mark: "contradiction" },
    ];
    const once = run(ops);
    const twice = run(ops, once);
    expect(twice).toEqual(once);
  });

  it("ignores edges to nodes that don't exist", () => {
    const s = run([{ t: "edge.add", edge: { id: "e1", source: "ghost", target: "nope", kind: "SUPPORTS" } }]);
    expect(s.board.edges).toHaveLength(0);
  });

  it("caps proof attachments and board size", () => {
    let s = initialShared();
    for (let i = 0; i < LIMITS.attached + 5; i++) s = applyShared(s, { t: "verdict.attach", slot: "means", evidence: `E-${i}` });
    expect(s.verdict.proof.means.length).toBeLessThanOrEqual(LIMITS.attached);
    for (let i = 0; i < LIMITS.nodes + 5; i++) s = applyShared(s, { t: "board.add", node: { id: `n${i}`, kind: "note", x: 0, y: 0 } });
    expect(s.board.nodes.length).toBeLessThanOrEqual(LIMITS.nodes);
  });

  it("rejects malformed ops at the schema", () => {
    expect(SharedOpSchema.safeParse({ t: "board.add", node: { id: "<script>", kind: "note", x: 0, y: 0 } }).success).toBe(false);
    expect(SharedOpSchema.safeParse({ t: "verdict.set", field: "victim", value: "x" }).success).toBe(false);
    expect(SharedOpSchema.safeParse({ t: "board.move", id: "n1", x: Infinity, y: 0 }).success).toBe(false);
    expect(SharedOpSchema.safeParse({ t: "drop.tables" }).success).toBe(false);
  });

  it("normalizes garbage into a valid empty state", () => {
    expect(normalizeShared(null)).toEqual(initialShared());
    expect(normalizeShared({ board: "nope", verdict: 42 })).toEqual(initialShared());
    expect(normalizePersonal(undefined)).toEqual(initialPersonal());
  });
});

describe("personal state", () => {
  it("records seen items once and stores notes", () => {
    let p = initialPersonal();
    p = applyPersonal(p, { t: "seen", id: "E-001" });
    p = applyPersonal(p, { t: "seen", id: "E-001" });
    p = applyPersonal(p, { t: "note", id: "E-001", text: "odd timing" });
    expect(p.seen).toEqual(["E-001"]);
    expect(p.notes["E-001"]).toBe("odd timing");
  });
});
