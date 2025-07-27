import { readFile, writeFile } from 'fs/promises';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { ensureDir } from '../etc/helpers.js';



// helper function to read file as utf8
const readTextFile = (filePath) => readFile(filePath, 'utf8');

// main function
export async function renderPage({
    title,
    pagePath,
    templatePath,
    headContentPath,
    headerPath,
    footerPath,
    outputPath,
    scripts,
    modules,
    styles
}) {
    // define the main variables
    const [head, header, footer, body] = await Promise.all([
        readTextFile(headContentPath),
        readTextFile(headerPath),
        readTextFile(footerPath),
        readTextFile(pagePath),
    ]);

    const scriptTags = (Array.isArray(scripts) ? scripts : [])
        .map(src => `<script src="${src}"></script>`)
        .join('\n');

    const moduleTags = (Array.isArray(modules) ? modules : [])
        .map(src => `<script type="module" src="${src}"></script>`)
        .join('\n');

    const styleTags = (Array.isArray(styles) ? styles : [])
        .map(href => `<link rel="stylesheet" href="${href}">`)
        .join('\n');

    // create the html
    const html = await ejs.renderFile(templatePath, {
        title: title ?? 'Untitled Page',
        head,
        header,
        footer,
        body,
        scripts: scriptTags,
        modules: moduleTags,
        styles: styleTags,
    });

    // save the file
    ensureDir(path.dirname(outputPath));
    await writeFile(outputPath, html);
    console.log(`Rendered ${outputPath}`);
}

// CLI entry point (outdated)
if (fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
    const args = process.argv.slice(2);
    const [pagePath, templatePath, headContentPath, headerPath, footerPath, outputPath] = args;

    if (!pagePath || !templatePath || !headContentPath || !headerPath || !footerPath || !outputPath) {
        console.log("error - one of your args is missing");
    } else {
        await renderPage({
            pagePath, templatePath, headContentPath, headerPath, footerPath, outputPath
        });
    }
}