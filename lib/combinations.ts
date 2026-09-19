export function product<T>(groups: T[][]): T[][] {
  const filled = groups.filter((group) => group.length > 0);
  if (filled.length === 0) return [];
  return filled.reduce<T[][]>((rows, group) => {
    if (rows.length === 0) return group.map((item) => [item]);
    return rows.flatMap((row) => group.map((item) => [...row, item]));
  }, []);
}

export function pickCombos<T>(groups: T[][], count: number, allCombos: boolean): T[][] {
  const all = product(groups);
  if (allCombos) return all;
  return all.slice(0, Math.max(count, 0));
}
