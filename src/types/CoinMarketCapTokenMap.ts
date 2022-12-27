export type CoinMarketCapTokenMap = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  displayTV: number;
  is_active: number;
  first_historical_data: string;
  last_historical_data: string;
  platform: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    token_address: string;
  };
};

export function isCoinMarketCapTokenMap(
  response: unknown
): response is CoinMarketCapTokenMap {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const coinMarketCapTokenMap = response as CoinMarketCapTokenMap;
  if (
    typeof coinMarketCapTokenMap.id === 'number' &&
    typeof coinMarketCapTokenMap.name === 'string' &&
    typeof coinMarketCapTokenMap.symbol === 'string' &&
    typeof coinMarketCapTokenMap.slug === 'string' &&
    typeof coinMarketCapTokenMap.rank === 'number' &&
    typeof coinMarketCapTokenMap.displayTV === 'number' &&
    typeof coinMarketCapTokenMap.is_active === 'number' &&
    typeof coinMarketCapTokenMap.first_historical_data === 'string' &&
    typeof coinMarketCapTokenMap.last_historical_data === 'string' &&
    typeof coinMarketCapTokenMap.platform === 'object'
  ) {
    return true;
  }

  return false;
}
