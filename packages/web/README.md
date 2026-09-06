# Web

Next.js App Router frontend using React and Apollo Client.

Set the four `NEXT_PUBLIC_FIREBASE_*` values from your Firebase web app in
`.env.local`. Google sign-in state is provided to the app by `AuthProvider`, and
Apollo Client attaches the current Firebase ID token to GraphQL requests. The
Apollo cache is cleared whenever the signed-in Firebase user changes.

The home page lists public boards with loading, empty, and retry states. Selecting
a board opens `/boards/[id]`, where guests can preview its ordered categories and
clue values without receiving prompt, answer, or Daily Double content. Private
board previews use the same route but are returned only to their signed-in owner.
Wide boards scroll horizontally on smaller screens.

Run development commands from the repository root:

```sh
yarn dev:web
yarn workspace web type-check
yarn workspace web build
```

## Testing

Web tests run through Next.js's Jest transformer in a jsdom environment. React
Testing Library and the `@testing-library/jest-dom` matchers are loaded by
`jest.setup.ts`.

Place tests under `src` with a `.test.ts` or `.test.tsx` suffix, then run:

```sh
yarn test:web
```

The web `tsconfig.json` includes Jest and jest-dom types so VS Code recognizes
test globals and DOM matchers.
