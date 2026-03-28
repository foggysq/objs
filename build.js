/**
 * @fileoverview Objs-core build script
 * Builds from objs.js (source, for development) into distribution files.
 *
 * Usage: node build.js
 *
 * Output:
 *   objs.built.js       - ESM + window.o, not minified (import or <script type="module">)
 *   objs.built.min.js   - same, minified (identifier names kept so `o` matches appended exports)
 *   objs.global.js      - classic script: IIFE + window.o, no export (use type="text/javascript" or omit type)
 *   objs.global.min.js  - minified classic script
 *
 * objs.js is left unchanged for library development (classic script, no export).
 */

import * as esbuild from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version || '2.2.0';

const shared = {
	entryPoints: ['objs.js'],
	bundle: false,
	format: 'esm',
};

/** Minify size but keep binding names (`o`, etc.); `minify: true` ignores `minifyIdentifiers: false`. */
const minifyKeepNames = {
	minifyWhitespace: true,
	minifySyntax: true,
	minifyIdentifiers: false,
};

console.log(`Building Objs v${version}...`);

await Promise.all([
	esbuild.build({
		...shared,
		outfile: 'objs.built.js',
		minify: false,
	}),
	esbuild.build({
		...shared,
		outfile: 'objs.built.min.js',
		...minifyKeepNames,
	}),
]);

const exportAndGlobal =
	'\nexport { o };\nexport default o;\nif (typeof window !== "undefined") window.o = o;\n';

const addExportAndGlobal = (file) => {
	let src = readFileSync(file, 'utf8');
	src += exportAndGlobal;
	writeFileSync(file, src);
};

['objs.built.js', 'objs.built.min.js'].forEach(addExportAndGlobal);

const objsSrc = readFileSync('objs.js', 'utf8');
const globalIife = `(function () {\n${objsSrc}\nif (typeof window !== "undefined") window.o = o;\n})();\n`;
writeFileSync('objs.global.js', globalIife);
await esbuild.build({
	stdin: {
		contents: globalIife,
		resolveDir: process.cwd(),
		loader: 'js',
		sourcefile: 'objs.global.js',
	},
	bundle: false,
	outfile: 'objs.global.min.js',
	...minifyKeepNames,
});

// Chrome extension (MV3): classic script for chrome.scripting.executeScript MAIN world (no ESM)
// Wrap in IIFE so re-injection does not throw "Identifier '__DEV__' has already been declared"
// (top-level const shares one global script scope across duplicate script executions).
mkdirSync('objs-extension/lib', { recursive: true });
writeFileSync(
	'objs-extension/lib/objs-inject.js',
	`(function(){\n${objsSrc}\n;if(typeof window!==\"undefined\")window.o=o;\n})();\n`,
);

console.log('Done.');
console.log('  objs.js             — source (development, classic script)');
console.log('  objs.built.js       — ESM + window.o');
console.log('  objs.built.min.js   — ESM + window.o, minified (names preserved)');
console.log('  objs.global.js      — classic script IIFE + window.o');
console.log('  objs.global.min.js  — classic script, minified');
