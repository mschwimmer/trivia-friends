'use client';

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  ApolloProvider as Provider,
  useApolloClient,
} from '@apollo/client/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from './auth-provider';

export function ClearApolloStoreWhenUserChanges() {
  const client = useApolloClient();
  const { user } = useAuth();
  const previousUserUid = useRef(user?.uid);

  useEffect(() => {
    if (previousUserUid.current === user?.uid) {
      return;
    }

    previousUserUid.current = user?.uid;
    void client.resetStore();
  }, [client, user?.uid]);

  return null;
}

export function ApolloProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql',
    });
    const authLink = new SetContextLink(async (previousContext) => {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();

      return {
        headers: {
          ...previousContext.headers,
          ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
        },
      };
    });

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([authLink, httpLink]),
    });
  }, []);

  return (
    <Provider client={client}>
      <ClearApolloStoreWhenUserChanges />
      {children}
    </Provider>
  );
}
