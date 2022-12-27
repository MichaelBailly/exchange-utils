import { isBinanceKline } from '../../types/BinanceKline';
import { isExchangeInfoResponse } from '../../types/ExchangeInfoResponse';

export async function getSymbols() {
  const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
  const data = await response.json();
  if (!isExchangeInfoResponse(data)) {
    throw new Error('Invalid response');
  }
  const symbols = data.symbols;
  const filteredSymbols = symbols.filter((symbol) => {
    return symbol.status === 'TRADING' && symbol.quoteAsset === 'USDT';
  });

  return filteredSymbols;
}

export type KlineOpts = {
  interval?: string;
  limit?: number;
};

const defaultKlineOpts: KlineOpts = {
  interval: '1d',
  limit: 365,
};

export async function getKlines(symbol: string, opts: KlineOpts) {
  const { interval, limit } = { ...defaultKlineOpts, ...opts };
  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.append('symbol', symbol);
  if (interval) {
    url.searchParams.append('interval', interval);
  }
  if (limit) {
    url.searchParams.append('limit', limit.toString());
  }
  const response = await fetch(url);
  const data = await response.json();
  if (!Array.isArray(data) || !data.every(isBinanceKline)) {
    throw new Error('Invalid response');
  }
  return data;
}
