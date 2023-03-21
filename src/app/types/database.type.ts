export type RangeOptions<T> = {
  end: number;
  start?: number;
  step?: number;
  value?: T;
}

export type QuerySet = {
  query: string;
  params: any[];
};

export type SelectOptions = {
  column?: string[];
  where?: QuerySet;
  groupBy?: string[];
  orderBy?: {
    column: string;
    desc?: boolean;
  }[];
  limit?: number;
  offset?: number;
};
