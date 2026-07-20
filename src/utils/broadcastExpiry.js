export function isBroadcastExpired(broadcast) {
  if (!broadcast?.expiresAt) return false;

  return Date.now() >= broadcast.expiresAt;
}

export function getTimeRemaining(expiresAt) {
  if (!expiresAt) return "Unknown";

  const remaining = expiresAt - Date.now();

  if (remaining <= 0) return "Expired";

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remaining % (1000 * 60 * 60 * 24)) /
    (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (remaining % (1000 * 60 * 60)) /
    (1000 * 60)
  );

  return `${days}d ${hours}h ${minutes}m remaining`;
}