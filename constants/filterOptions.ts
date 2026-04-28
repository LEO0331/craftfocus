export const FRIEND_FILTER_OPTIONS = ['all', 'pending', 'accepted', 'rejected'] as const;
export type FriendFilter = (typeof FRIEND_FILTER_OPTIONS)[number];

export const EXCHANGE_FILTER_OPTIONS = ['all', 'pending', 'accepted', 'rejected', 'cancelled'] as const;
export type ExchangeFilter = (typeof EXCHANGE_FILTER_OPTIONS)[number];
