/**
 * @fileoverview Objs-core build script
 * Builds from objs.js (source, for development) into distribution files.
 *
 * Usage: node build.js
 *
 * Output:
 *   objs.built.js     - ESM + window.o, not minified
 *   objs.built.min.js - ESM + window.o, minified
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
		minify: true,
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

// Chrome extension (MV3): classic script for chrome.scripting.executeScript MAIN world (no ESM)
// Wrap in IIFE so re-injection does not throw "Identifier '__DEV__' has already been declared"
// (top-level const shares one global script scope across duplicate script executions).
mkdirSync('objs-extension/lib', { recursive: true });
const objsSrc = readFileSync('objs.js', 'utf8');
writeFileSync(
	'objs-extension/lib/objs-inject.js',
	`(function(){\n${objsSrc}\n;if(typeof window!==\"undefined\")window.o=o;\n})();\n`,
);

console.log('Done.');
console.log('  objs.js          — source (development, classic script)');
console.log('  objs.built.js    — built ESM + window.o');
console.log('  objs.built.min.js — built ESM + window.o, minified');
