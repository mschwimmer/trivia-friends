'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

export function ApiHealth() {
  const { data, error, loading } = useQuery<{ health: string }>(HEALTH_QUERY);

  const status = loading
    ? 'Connecting to the API…'
    : error
      ? 'API unavailable'
      : data?.health === 'ok'
        ? 'API connected'
        : 'Unexpected API response';

  return (
    <div className="status-card" role="status">
      <span
        aria-hidden="true"
        className={`status-dot ${error ? 'status-dot--error' : ''}`}
      />
      <div>
        <strong>{status}</strong>
        <p>
          {error
            ? 'Start the API with yarn dev:api, then refresh this page.'
            : 'The web app and GraphQL foundation are ready.'}
        </p>
      </div>
    </div>
  );
}
