export const FRIEND_FILTER_VALUES = ['all', 'pending', 'accepted', 'rejected'] as const;
export type FriendFilter = (typeof FRIEND_FILTER_VALUES)[number];

export const EXCHANGE_FILTER_VALUES = ['all', 'pending', 'accepted', 'rejected', 'cancelled'] as const;
export type ExchangeFilter = (typeof EXCHANGE_FILTER_VALUES)[number];

type FilterOption<T extends string> = {
  value: T;
  labelKey: `filter.${T}`;
};

export const FRIEND_FILTER_OPTIONS: ReadonlyArray<FilterOption<FriendFilter>> = FRIEND_FILTER_VALUES.map((value) => ({
  value,
  labelKey: `filter.${value}`,
}));

export const EXCHANGE_FILTER_OPTIONS: ReadonlyArray<FilterOption<ExchangeFilter>> = EXCHANGE_FILTER_VALUES.map(
  (value) => ({
    value,
    labelKey: `filter.${value}`,
  })
);
