'use client';

import React, { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { initApolloClient } from './client';

/**
 * Apollo Client Provider Component
 * Wraps the app with Apollo Client context
 * Must be a client component in Next.js 13+
 */
export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const [client] = React.useState(() => initApolloClient());

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
