import sharp from "sharp";
import fs from "fs";
const dir = process.argv[2] + "/shots";
for (const n of ["intro-file.png", "intro-brief.png"]) {
  const a = `${dir}/before-${n}`, c = `${dir}/after-${n}`;
  if (!fs.existsSync(a) || !fs.existsSync(c)) { console.log("missing", n); continue; }
  const A = await sharp(a).raw().toBuffer(), C = await sharp(c).raw().toBuffer();
  let d = 0;
  for (let i = 0; i < A.length; i += 3)
    if (Math.abs(A[i] - C[i]) > 6 || Math.abs(A[i+1] - C[i+1]) > 6 || Math.abs(A[i+2] - C[i+2]) > 6) d++;
  console.log(`  ${((d / (A.length / 3)) * 100).toFixed(3).padStart(7)}%  ${n.replace(".png", "")}`);
}
