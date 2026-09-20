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
  const shuffled = [...all];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swap];
    shuffled[swap] = current;
  }
  return shuffled.slice(0, Math.max(count, 0));
}
