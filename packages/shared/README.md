# Shared

Placeholder workspace for types and utilities that are genuinely shared by the
API and web packages. Do not move code here until both packages need it.

## Testing

Shared tests use Jest's Node environment and TypeScript transformer. Place test
files under `src` with a `.test.ts` or `.test.tsx` suffix, then run from the
repository root:

```sh
yarn test:shared
```

The package's main `tsconfig.json` includes Jest globals for VS Code. The root
test command also includes the shared Jest project.
