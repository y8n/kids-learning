import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

/**
 * ESLint 扁平配置
 *
 * 分层：JS 基础 → TypeScript → React Hooks → 可访问性 → 关掉与 Prettier 冲突的格式规则
 * 采用「非类型感知」的规则集：速度快、误报少。
 * 后续如果想让 lint 抓更深的类型问题，可换成 tseslint.configs.recommendedTypeChecked，
 * 但需要为 parserOptions 配 project，且要接受更长的执行时间和一批新报错。
 */
export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'assets/characters-source/**', 'public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // 只在开发热更新层面提示，不影响构建
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // 未使用变量：允许 _ 前缀显式忽略
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // 生产代码里不应该有游离的 console；错误边界和兜底逻辑里允许 warn/error
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'properties'],
    },
  },

  // 构建脚本与配置跑在 Node 环境
  {
    files: ['*.config.{js,ts}', 'vite.config.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  // 必须放最后：关掉所有与 Prettier 冲突的格式化规则，格式交给 Prettier 管
  prettier,
)
