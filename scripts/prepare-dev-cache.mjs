import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readlinkSync, symlinkSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

if (process.platform === "win32") {
  const project = process.cwd();
  const oneDriveRoots = [process.env.OneDrive, process.env.OneDriveConsumer, process.env.OneDriveCommercial]
    .filter(Boolean)
    .map((root) => resolve(root));
  const inOneDrive = oneDriveRoots.some((root) => {
    const pathFromRoot = relative(root, project);
    return pathFromRoot === "" || (pathFromRoot !== ".." && !pathFromRoot.startsWith(`..${sep}`));
  });

  if (inOneDrive) {
    if (!process.env.LOCALAPPDATA) throw new Error("LOCALAPPDATA is required for the local Next.js cache.");
    const projectKey = createHash("sha256").update(project.toLowerCase()).digest("hex").slice(0, 12);
    const target = resolve(process.env.LOCALAPPDATA, "DeployCheck", "next-dev", projectKey);
    const link = resolve(project, ".next-dev-local");
    mkdirSync(target, { recursive: true });

    ensureJunction(link, target);
    ensureJunction(resolve(target, "node_modules"), resolve(project, "node_modules"));
  }
}

function ensureJunction(link, target) {
  try {
    const stat = lstatSync(link);
    if (!stat.isSymbolicLink() || resolve(readlinkSync(link)) !== target) {
      throw new Error(`${link} exists but is not the expected cache junction. Move it aside before running dev.`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    symlinkSync(target, link, "junction");
  }
}
