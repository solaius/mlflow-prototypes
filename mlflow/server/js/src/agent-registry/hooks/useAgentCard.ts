import { useCallback, useEffect, useState } from 'react';

import { fetchAgentCard } from '../mocks/agentCards';
import type { AgentCardFetch } from '../mocks/agentCards';

/**
 * Fetches an A2A Agent Card through a binding, at view time.
 *
 * RFC-0011: cards are fetched, not stored. The endpoint is the card's system of record, and
 * the UI renders it read-only by fetching through the binding, so what MLflow displays can
 * never drift from what the agent serves. The fetch happens in the browser (never in the
 * registry server), and only when the endpoint permits it, which is why the failure state
 * is a first-class outcome here rather than an error.
 */
export const useAgentCard = (endpointUrl?: string) => {
  const [result, setResult] = useState<AgentCardFetch | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!endpointUrl) {
      setResult(undefined);
      return;
    }
    setLoading(true);
    // A short delay so the "fetching" state is visible: the point of a live fetch is that it
    // happens now, and a result that appears before the click finishes reads as stored.
    const timer = window.setTimeout(() => {
      setResult(fetchAgentCard(endpointUrl));
      setLoading(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [endpointUrl]);

  useEffect(() => {
    const cancel = refresh();
    return () => cancel?.();
  }, [refresh]);

  return { result, loading, refresh };
};
