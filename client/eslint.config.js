import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier'; // 'prettier' 대신 'prettierConfig'로 명확하게 이름 변경

export default [
  { ignores: ['dist'] },
  js.configs.recommended, // eslint:recommended 설정을 직접 포함
  prettierConfig,         // prettier 설정을 직접 포함
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // reactHooks.configs.recommended.rules를 포함 (extends 된 것처럼)
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'quotes': ['error', 'single'] // 이 규칙이 자동 수정 대상
    },
  },
];