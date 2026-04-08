import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

/**
 * Create Apollo Client configured for BookMyTrip GraphQL API
 * Automatically adds auth token and request ID headers
 */
export const initApolloClient = () => {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
    credentials: 'include', // Include cookies if needed
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      // Add auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const headers = new Headers(init?.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return fetch(input, {
        ...init,
        headers,
      });
    },
  });

  const authLink = new ApolloLink((operation, forward) => {
    // Add request ID for tracing
    operation.setContext(({ headers }) => ({
      headers: {
        ...headers,
        'x-request-id': generateRequestId(),
      },
    }));

    return forward(operation);
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            searchFlights: {
              merge(_existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'cache-first',
      },
    },
  });

  return client;
};

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
