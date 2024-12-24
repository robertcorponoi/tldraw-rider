import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
	{
		/**
		 * Ignore the generated JavaScript files.
		 */
		ignores: ["dist"],
	},
	{
		/**
		 * Extends the default recommened ESLint configurations for JavaScript
		 * and TypeScript.
		 */
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		/**
		 * The path to the files to lint.
		 */
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			/**
			 * The version of ECMA to support.
			 */
			ecmaVersion: 2020,
			/**
			 * Objects to add to the global scope while linting. Since it's a
			 * browser application, we add the browser globals.
			 *
			 * https://github.com/sindresorhus/globals
			 */
			globals: globals.browser,
		},
		plugins: {
			/**
			 * Enforces the rule of hooks.
			 *
			 * https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
			 */
			"react-hooks": reactHooks,
			/**
			 * Validates that our components can safely be updated with Fast
			 * Refresh.
			 *
			 * https://github.com/ArnaudBarre/eslint-plugin-react-refresh
			 */
			"react-refresh": reactRefresh,
		},
		rules: {
			/**
			 * Enforces the rules of hooks.
			 */
			...reactHooks.configs.recommended.rules,
			/**
			 * The only rule provided by the React Refresh plugin.
			 */
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
		},
	}
);
