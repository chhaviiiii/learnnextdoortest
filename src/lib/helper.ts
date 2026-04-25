export type FilterState = {
  type: string;
  category: Set<string>;
  sort: string;
};

export function readStateFromParams(params: URLSearchParams): FilterState {
  const raw = params.get("category") ?? params.get("categories") ?? "";

  return {
    type: params.get("type") ?? "",
    sort: params.get("sort") ?? "",
    category: new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  };
}

/** Copies `params`, strips filter keys, then writes them from `state`. */
export function writeStateToParams(params: URLSearchParams, state: FilterState) {
  const sp = new URLSearchParams(params.toString());
  sp.delete("category");
  sp.delete("categories");
  sp.delete("type");
  sp.delete("sort");

  if (state.type) sp.set("type", state.type);
  if (state.sort) sp.set("sort", state.sort);
  if (state.category.size > 0) {
    sp.set("category", Array.from(state.category).join(","));
  }

  return sp;
}

export function activeCount(state: FilterState) {
  let total = 0;

  if (state.type) total += 1;
  if (state.sort) total += 1;
  total += state.category.size;

  return total;
}