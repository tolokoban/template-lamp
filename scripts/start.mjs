// Start the LAMP stack on a random free port and open the browser on it.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import { ENV_FILE, ROOT, readEnv } from "./env.mjs";

if (!fs.existsSync(ENV_FILE) || !readEnv().PHP_VERSION) {
    console.log("No configuration found: running `npm run config` first.\n");
    const res = spawnSync(process.execPath, ["scripts/config.mjs"], { cwd: ROOT, stdio: "inherit" });
    if (res.status !== 0) process.exit(res.status ?? 1);
}
const { PHP_VERSION } = readEnv();

function getFreePort() {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.unref();
        srv.on("error", reject);
        srv.listen(0, "127.0.0.1", () => {
            const { port } = srv.address();
            srv.close(() => resolve(port));
        });
    });
}

function openBrowser(url) {
    const [cmd, args] =
        process.platform === "darwin" ? ["open", [url]]
        : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
    spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

async function waitForServer(url, isAlive) {
    while (isAlive()) {
        try {
            await fetch(url, { signal: AbortSignal.timeout(2000) });
            return true;
        } catch {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    return false;
}

const port = await getFreePort();
const url = `http://localhost:${port}`;
console.log(`Starting LAMP stack with PHP ${PHP_VERSION} on ${url} (Ctrl+C to stop)\n`);

const compose = spawn("docker", ["compose", "up", "--build", "--remove-orphans"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, HTTP_PORT: String(port) },
});
let alive = true;
compose.on("error", (err) => {
    console.error("Unable to run `docker compose`:", err.message);
    process.exit(1);
});
compose.on("exit", (code) => {
    alive = false;
    process.exit(code ?? 0);
});
// Ctrl+C reaches docker compose too: let it stop the containers gracefully.
process.on("SIGINT", () => {});

if (await waitForServer(url, () => alive)) {
    console.log(`\n>>> Website:    ${url}\n>>> phpMyAdmin: ${url}/phpMyAdmin/  (admin / admin)\n`);
    openBrowser(url);
}
