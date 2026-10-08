/** Index a list by id, for the many places that look an item up by reference. */
export const keyBy = <T extends { id: string }>(items: readonly T[]) => new Map(items.map((x) => [x.id, x]));
