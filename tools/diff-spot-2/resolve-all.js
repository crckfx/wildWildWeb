#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { flattenPages } from "./read/flatten-pages.js";
import { compareEntry } from "./read/compare-entry.js";
import { renderPage } from "./render/render.js";
import { applyChanges } from "./copy/write.js";
import { logChange, walkAllFiles } from "./copy/misc.js";

// 🧠 Main function
export async function resolveAll(projectRoot, distRoot, pagesJsonPath, options = {}) {
    const { write = false, clean = false, verbose = false } = options;

    const absProjectRoot = path.resolve(projectRoot);
    const absDistRoot = path.resolve(distRoot);

    const defaultHeadContentPath = 'components/head-content.html';
    const defaultHeaderPath = 'components/header.html';
    const defaultFooterPath = 'components/footer.html';
    const defaultTemplatePath = 'templates/page.ejs';

    const raw = fs.readFileSync(pagesJsonPath, "utf-8");
    const nested = JSON.parse(raw);
    const flatPages = flattenPages(nested);

    const expectedPaths = new Set();
    const allChanges = [];
    let totalScanned = 0;
    let totalWritten = 0;
    let totalRendered = 0;
    let totalDeleted = 0;

    for (const page of flatPages) {
        const {
            title, contentPath, outputPath, pageId,
            imports = [], styles = [], scripts = [],
        } = page;

        // All remaining paths: resolve user-provided or default to expected project-relative paths
        const templatePath = path.resolve(absProjectRoot, page.templatePath ?? defaultTemplatePath);
        const headContentPath = path.resolve(absProjectRoot, page.headContentPath ?? defaultHeadContentPath);
        const headerPath = path.resolve(absProjectRoot, page.headerPath ?? defaultHeaderPath);
        const footerPath = path.resolve(absProjectRoot, page.footerPath ?? defaultFooterPath);

        // ── Rendering Phase ──
        if (!contentPath || !outputPath) {
            if (verbose) console.warn(chalk.gray(`[SKIP] ${pageId}: no contentPath or outputPath`));
        } else {
            const pagePath = path.resolve(absProjectRoot, contentPath);
            const outputHtmlPath = path.resolve(absProjectRoot, outputPath);

            if (fs.existsSync(pagePath)) {
                await renderPage({
                    title,
                    pagePath,
                    outputPath: outputHtmlPath,
                    headContentPath,
                    headerPath,
                    footerPath,
                    templatePath,
                    scripts,
                    styles,
                });
                totalRendered++;
            } else {
                console.warn(chalk.red(`[MISSING] ${pageId}: ${contentPath}`));
            }
        }

        // ── Resolve Imports Phase ──
        const result = compareEntry(absProjectRoot, page, {
            verbose,
            pageId,
        });

        totalScanned += result.scanned;
        allChanges.push(...result.changes);
        for (const p of result.expectedPaths) {
            expectedPaths.add(p);
        }

        // Track output HTML path as expected (rendered output)
        if (outputPath) {
            const htmlOut = path.resolve(absProjectRoot, outputPath);
            expectedPaths.add(htmlOut);
        }

        // Also track expected import destinations
        const outputDir = path.resolve(absProjectRoot, path.dirname(outputPath));
        for (const importPath of imports) {
            const dst = path.join(outputDir, path.basename(importPath));
            expectedPaths.add(path.resolve(dst));
        }
    }

    console.log(`\n📄 Total files scanned: ${totalScanned}`);
    if (write) {
        const pendingWrites = allChanges.filter(c => c.status !== "MATCHES");
        const written = applyChanges(pendingWrites);
        written.forEach(entry => {
            logChange({ ...entry, status: "WRITTEN" });
            expectedPaths.add(path.resolve(entry.dstPath));
        });
        totalWritten = written.length;
        console.log(`✍️  Total files written: ${totalWritten}`);
    }

    console.log(`✅ Rendered ${totalRendered} pages.`);

    if (clean) {
        const allDistFiles = walkAllFiles(absDistRoot);
        for (const abs of allDistFiles) {
            if (!expectedPaths.has(abs)) {
                const rel = path.relative(absDistRoot, abs);
                logChange({ status: "DELETE", relative: rel });
                fs.unlinkSync(abs);
                totalDeleted++;
            }
        }
        console.log(`🗑️  Orphans deleted: ${totalDeleted}`);
    }

    return {
        scanned: totalScanned,
        written: totalWritten,
        rendered: totalRendered,
        deleted: totalDeleted,
    };
}

// ─── CLI ENTRY ───
if (fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
    const args = process.argv.slice(2);
    const [projectRootArg, distRootArg, pagesJsonArg, ...rest] = args;

    if (!projectRootArg || !distRootArg || !pagesJsonArg) {
        console.error(
            chalk.red("Usage: node resolve-all.js <projectRoot> <distRoot> <pagesJson> [--write] [--clean] [--verbose]")
        );
        process.exit(1);
    }

    const writeMode = rest.includes("--write");
    const cleanMode = rest.includes("--clean");
    const verboseMode = rest.includes("--verbose");

    resolveAll(projectRootArg, distRootArg, pagesJsonArg, {
        write: writeMode,
        clean: cleanMode,
        verbose: verboseMode,
    }).catch((err) => {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
    });
}
