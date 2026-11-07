import balanceJson from '../../config/balance.json';

export type Balance = typeof balanceJson;
export const defaultBalance: Balance = balanceJson;
