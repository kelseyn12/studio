/** Fields Sync may write. An account that already exists keeps the label typed in Studio. */
export function fieldsFromSync(
  account: { username: string; network: string; nickname?: string; isActive?: number | boolean },
  existing: boolean,
): { username: string; network: string; isActive: boolean; nickname?: string } {
  const shared = {
    username: account.username,
    network: account.network,
    isActive: Boolean(account.isActive ?? true),
  };
  if (existing) return shared;
  return { ...shared, nickname: account.nickname || "" };
}
