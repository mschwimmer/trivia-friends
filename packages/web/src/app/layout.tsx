import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ApolloProvider } from '@/components/apollo-provider';
import { AuthProvider } from '@/components/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trivia Friends',
  description: 'Build and play Jeopardy-style trivia boards with friends.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <ApolloProvider>{children}</ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
