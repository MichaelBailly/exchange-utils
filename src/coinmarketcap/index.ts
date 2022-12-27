import {
  CoinMarketCapTokenMap,
  isCoinMarketCapTokenMap,
} from '../types/CoinMarketCapTokenMap';

const CMC_API_KEY = process.env.CMC_API_KEY;

if (!CMC_API_KEY) {
  throw new Error('CMC_API_KEY env var is required');
}

export async function getSymbolMap(symbols: string[]) {
  if (!CMC_API_KEY) {
    throw new Error('CMC_API_KEY env var is required');
  }
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${symbols.join(
      ','
    )}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        Accept: 'application/json',
      },
    }
  );
  const data = await response.json();
  if (Array.isArray(data.data)) {
    const filtered: CoinMarketCapTokenMap[] = data.data.filter(
      isCoinMarketCapTokenMap
    );
    return filtered;
  }
  console.log(data);
  throw new Error('Invalid response');
}
