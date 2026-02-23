import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

let sessionId: string | null = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return sessionId;
}

export function trackEvent(eventName: string, path?: string) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      path: path || window.location.pathname,
      referrer: document.referrer || null,
      sessionId: getSessionId(),
    }),
  }).catch(() => {});
}

export function usePageTracker() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (location !== prevLocation.current) {
      prevLocation.current = location;
      trackEvent("page_view", location);
    }
  }, [location]);
}
