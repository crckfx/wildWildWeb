import { resolveAll } from "./diff-spot-2/resolve-all.js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.resolve(projectRoot, 'dist');
const pagesJson = path.resolve(projectRoot, 'pages.json');

// ─── CLI ENTRY ───
if (fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename)) {
    resolveAll(projectRoot, distRoot, pagesJson, {
        write: true,
        clean: true,
        verbose: true,
    }).catch((err) => {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
    });
}