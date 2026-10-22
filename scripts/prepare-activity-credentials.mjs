import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const keyPath = path.join(root, ".cache", "activity-owner-key.txt");
const varsPath = path.join(root, "workers", "activity", ".dev.vars");
for (const file of [keyPath, varsPath]) {
  try { await access(file); throw new Error("Activity credentials already exist. Refusing to replace an existing key. Follow the rotation procedure in docs/OWNED_ANALYTICS.md."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const owner = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(owner).digest("hex");
const hmac = randomBytes(32).toString("hex");
await mkdir(path.dirname(keyPath), { recursive: true });
await writeFile(keyPath, owner + "\n", { mode: 0o600, flag: "wx" });
await writeFile(varsPath, `VISITOR_HMAC_KEY=${hmac}\nREPORT_TOKEN_SHA256=${hash}\n`, { mode: 0o600, flag: "wx" });
console.log("Created local owner key and Worker secret inputs. No secrets were printed. Keep both files private and out of version control.");
