export function connectionFromBuddyPayload(buddy, fallback = "offline") {
  if (buddy?.mood === "teleported") {
    return "online";
  }

  if (buddy?.mood === "sleeping") {
    return "offline";
  }

  return fallback;
}
