/**
 * @fileoverview Objs-core build script
 * Generates production and minified variants from objs.js using esbuild.
 *
 * Usage: node build.js
 *
 * Output:
 *   objs.prod.js      - dev code stripped (if (__DEV__) blocks removed), not minified
 *   objs.min.js       - dev version minified
 *   objs.prod.min.js  - dev code stripped and minified
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

const shared = {
	entryPoints: ['objs.js'],
	bundle: false,
	format: 'esm',
};

const prodDefine = { __DEV__: 'false' };

console.log('Building Objs v1.2...');

await Promise.all([
	// Dev minified
	esbuild.build({
		...shared,
		outfile: 'objs.min.js',
		minify: true,
	}),

	// Prod (dev code stripped, readable)
	esbuild.build({
		...shared,
		outfile: 'objs.prod.js',
		define: prodDefine,
		treeShaking: true,
		minify: false,
	}),

	// Prod minified
	esbuild.build({
		...shared,
		outfile: 'objs.prod.min.js',
		define: prodDefine,
		treeShaking: true,
		minify: true,
	}),
]);

// Source objs.js has no export so it can be loaded as classic <script> in examples.
// Built files get export + window.o so ESM and script-tag usage both work.
const exportAndGlobal =
	'\nexport { o };\nexport default o;\nif (typeof window !== "undefined") window.o = o;\n';

const addExportAndGlobal = (file) => {
	let src = readFileSync(file, 'utf8');
	src += exportAndGlobal;
	writeFileSync(file, src);
};

['objs.prod.js', 'objs.min.js', 'objs.prod.min.js'].forEach(addExportAndGlobal);

// ESM dev entry: objs.js content + export + window.o (objs.js itself stays script-tag only)
const objsSource = readFileSync('objs.js', 'utf8');
writeFileSync('objs.dev.js', objsSource + exportAndGlobal);

console.log('Done.');
console.log('  objs.js          — source, classic script (examples)');
console.log('  objs.dev.js      — dev ESM entry (export + window.o)');
console.log('  objs.prod.js     — production (dev code stripped)');
console.log('  objs.min.js      — dev version minified');
console.log('  objs.prod.min.js — production minified');
