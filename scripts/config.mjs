// Ask which PHP version to use and store it in `.env`.
import readline from "node:readline/promises";
import { readEnv, writeEnv } from "./env.mjs";

// Fallback when Docker Hub cannot be reached.
const KNOWN = ["7.0", "7.1", "7.2", "7.3", "7.4", "8.0", "8.1", "8.2", "8.3", "8.4", "8.5"];

/** Probe Docker Hub for every `X.Y-apache` tag from 7.0 onward. */
async function fetchAvailableVersions() {
    const candidates = [];
    for (let major = 7; major <= 9; major++)
        for (let minor = 0; minor <= 9; minor++) candidates.push(`${major}.${minor}`);
    const found = await Promise.all(
        candidates.map(async (v) => {
            try {
                const res = await fetch(
                    `https://hub.docker.com/v2/repositories/library/php/tags/${v}-apache`,
                    { signal: AbortSignal.timeout(8000) },
                );
                return res.ok ? v : null;
            } catch {
                return null;
            }
        }),
    );
    const versions = found.filter(Boolean);
    return versions.length > 0 ? versions : null;
}

const env = readEnv();
console.log("Fetching available PHP versions from Docker Hub...");
let versions = await fetchAvailableVersions();
if (!versions) {
    console.log("Docker Hub unreachable, using the built-in list.");
    versions = KNOWN;
}

const current = env.PHP_VERSION ?? versions[versions.length - 1];
versions.forEach((v, i) =>
    console.log(`  ${String(i + 1).padStart(2)}) PHP ${v}${v === current ? "  (current)" : ""}`),
);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let choice;
while (!choice) {
    const answer = (await rl.question(`PHP version [${current}]: `)).trim();
    if (answer === "") choice = current;
    else if (versions.includes(answer)) choice = answer;
    else if (/^\d+$/.test(answer) && versions[Number(answer) - 1]) choice = versions[Number(answer) - 1];
    else console.log("Invalid choice: type a number from the list or a version like 8.3.");
}
rl.close();

writeEnv({ ...env, PHP_VERSION: choice });
console.log(`PHP ${choice} saved in .env. Run \`npm start\` to launch the server.`);
