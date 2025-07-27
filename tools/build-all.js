import { resolveAll } from "./diff-spot-2/resolve-all.js"
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { isCLI } from "./diff-spot-2/etc/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.resolve(projectRoot, 'dist');
const pagesJson = path.resolve(projectRoot, 'pages.json');
const configJson = path.resolve(projectRoot, 'config.json');

// ─── CLI ENTRY ───
if (isCLI(import.meta.url)) {
    resolveAll(projectRoot, distRoot, pagesJson, configJson, {
        write: true,
        clean: true,
        verbose: true,
    }).catch((err) => {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
    });
}