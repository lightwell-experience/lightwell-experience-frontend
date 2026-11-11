export type Links = {
  first: string;
  last: string;
  next?: string;
  prev?: string;
};

export type Meta = {
  count: number;
  limit: number;
  offset: number;
};

/** Sort direction for Lightwell list APIs (`sort_by=<field>:<direction>`). */
export type SortDirection = 'asc' | 'desc';
