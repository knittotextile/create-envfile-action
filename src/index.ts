import * as core from "@actions/core";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const transformKey = (key: string, value: string): string => {
  if (value.includes("\n")) {
    return `${key.split("INPUT_ENVKEY_")[1]}="${value.replace(/\r?\n/g, "\\n")}"\n`;
  }
  return `${key.split("INPUT_ENVKEY_")[1]}=${value}\n`;
};

const main = async (): Promise<void> => {
  try {
    const sortKeys = core.getInput("sort_keys") === "true";

    let envKeys: string[] = [];
    envKeys = Object.keys(process.env);
    envKeys = sortKeys ? envKeys.sort((a, b) => a.localeCompare(b)) : envKeys;

    if (!envKeys.length) {
      console.warn("No env keys found.");
    }

    let outFile = "";
    for (const key of envKeys) {
      if (key.startsWith("INPUT_ENVKEY_")) {
        const value = process.env[key] || "";

        if (!value && core.getInput("fail_on_empty") === "true") {
          throw new Error(`Empty env key found: ${key}`);
        }

        outFile += transformKey(key, value);
      }
    }

    let baseDir = "";
    baseDir = process.env["GITHUB_WORKSPACE"] || ".";
    baseDir = !baseDir || baseDir === "None" ? "." : baseDir;

    let directory = "";
    directory = core.getInput("directory") || "";
    directory = directory.replace(/^\.\//, "");

    if (path.isAbsolute(directory)) {
      throw new Error("Absolute paths are not allowed. Please use a relative path.");
    }

    const fileName = core.getInput("file_name") || ".env";
    const filePath = path.join(baseDir, directory, fileName);

    core.debug(`Creating file: ${filePath}`);

    await fs.writeFile(filePath, outFile);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
};

main();
