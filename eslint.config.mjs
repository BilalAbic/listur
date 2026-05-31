import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

// NOT: jsx-a11y plugin eslint-config-next içinde zaten tanımlı —
// kuralları doğrudan rules bloğunda override edebiliriz.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React 19 — bazı yerlerde setState içinde initial sync (form fields,
      // realtime subscription cleanup) idiomatik. Warning olarak izleriz.
      'react-hooks/set-state-in-effect': 'warn',

      // ── Kod kalitesi (warning level — build kırmaz, dikkat çeker) ──────────
      // console.log production'a sızmasın; warn/error/info üretici niyetle bırakılır.
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Unused vars: _ prefix istisnası
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Tip importlarını ayır — fix-on-save ile zamanla temizlenir
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // jsx-a11y bazı kuralları sıkı warning (Issue #95'te toplu düzeltilir)
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',

    },
  },
  // Prettier — son sırada: formatting konularını Prettier'e bırakır
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'docs/e2e-test/**',
    'e2e-results.json',
    'e2e-test.js',
  ]),
])

export default eslintConfig
