import fs from 'fs';
import chalk from "chalk";
import path from "path";


// helper function to create a directory if it doesn't exist
export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ------------------ HELPERS ------------------

export function walkAllFiles(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walkAllFiles(full));
        } else {
            files.push(path.resolve(full));
        }
    }
    return files;
}

export function logChange(change, options = {}) {
    const { verbose = false } = options;
    const rel = change.relative;

    const tag = {
        MATCHES: chalk.gray("[MATCHES]"),
        MISSING: chalk.yellow("[MISSING]"),
        DIFFERS: chalk.green("[DIFFERS]"),
        WRITTEN: chalk.cyan("[WRITTEN]"),
        SKIP: chalk.dim("[SKIP]"),
        DELETE: chalk.red("[DELETE]"),
    }[change.status] || `[${change.status}]`;

    // Skip quiet statuses unless verbose
    if ((change.status === "MATCHES" || change.status === "SKIP") && !verbose) return;

    console.log(`${tag} ${rel}`);
}