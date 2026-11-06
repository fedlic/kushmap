import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Preserve the project's existing React 18 behavior during the Next 16
    // security upgrade. These compiler-oriented rules can be re-enabled when
    // the client state flows are migrated to React 19 patterns.
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),
])
