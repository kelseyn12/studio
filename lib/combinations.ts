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
  return shuffleList(all).slice(0, Math.max(count, 0));
}

export function pickTracks<T>(tracks: T[], count: number): Array<T | undefined> {
  if (count <= 0) return [];
  if (tracks.length === 0) return Array.from({ length: count }, () => undefined);
  const picked: T[] = [];
  let bag = shuffleList(tracks);
  for (let index = 0; index < count; index += 1) {
    if (bag.length === 0) bag = shuffleList(tracks);
    if (bag.length > 1 && picked.length > 0 && bag[0] === picked[picked.length - 1]) {
      bag.push(bag.shift() as T);
    }
    picked.push(bag.shift() as T);
  }
  return picked;
}

function shuffleList<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swap];
    shuffled[swap] = current;
  }
  return shuffled;
}
