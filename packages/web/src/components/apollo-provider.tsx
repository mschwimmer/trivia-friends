'use client';

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider as Provider } from '@apollo/client/react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export function ApolloProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new HttpLink({
          uri:
            process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql',
        }),
      }),
    []
  );

  return <Provider client={client}>{children}</Provider>;
}
