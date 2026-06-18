import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';

import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';

const isDev = process.env.NODE_ENV !== 'production';

/* =========================
   LOGGER
========================= */

console.warn = () => {};

const logger = createLogger();
const originalError = logger.error;

logger.error = (msg, options) => {
	if (options?.error?.toString()?.includes('CssSyntaxError: [postcss]')) {
		return;
	}
	originalError(msg, options);
};

/* =========================
   VITE CONFIG
========================= */

export default defineConfig({
	// 🔴 ESSENCIAL PARA PRODUÇÃO
	base: '/',

	customLogger: logger,

	plugins: [
		...(isDev
			? [
					inlineEditPlugin(),
					editModeDevPlugin(),
					iframeRouteRestorationPlugin(),
					selectionModePlugin(),
			  ]
			: []),
		react(),
	],

	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		emptyOutDir: true,
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types',
			],
		},
	},
});
