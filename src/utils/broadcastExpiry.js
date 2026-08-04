export function isBroadcastExpired(broadcast) {
  if (!broadcast?.expiresAt) {
    return false;
  }

  const expiresAt =
    typeof broadcast.expiresAt === "number"
      ? broadcast.expiresAt
      : broadcast.expiresAt?.toMillis
        ? broadcast.expiresAt.toMillis()
        : null;

  if (!expiresAt) {
    return false;
  }

  return Date.now() >= expiresAt;
}

export function getTimeRemaining(expiresAt) {
  if (!expiresAt) {
    return "Unknown";
  }

  const timestamp =
    typeof expiresAt === "number"
      ? expiresAt
      : expiresAt?.toMillis
        ? expiresAt.toMillis()
        : null;

  if (!timestamp) {
    return "Unknown";
  }

  const remaining = timestamp - Date.now();

  if (remaining <= 0) {
    return "Expired";
  }

  const days = Math.floor(
    remaining / (1000 * 60 * 60 * 24)
  );

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