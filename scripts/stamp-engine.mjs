// Records which engine artifact the workbench was built and tested against.
// Usage: node scripts/stamp-engine.mjs   (run after replacing vendor/*.tgz)
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const tgz = readdirSync("vendor").find((f) => f.endsWith(".tgz"));
if (!tgz) throw new Error("no engine tarball in vendor/");
const sha256 = createHash("sha256").update(readFileSync(`vendor/${tgz}`)).digest("hex");
const pkg = JSON.parse(execFileSync("tar", ["-xzOf", `vendor/${tgz}`, "package/package.json"], { encoding: "utf8" }));
const stamp = { package: pkg.name, version: pkg.version, artifact: tgz, sha256, sessionVersion: "1", scenarioVersion: "1" };
writeFileSync("vendor/pairing.json", JSON.stringify(stamp, null, 2) + "\n");
console.log(`stamped ${pkg.name}@${pkg.version} (${sha256.slice(0, 12)})`);
