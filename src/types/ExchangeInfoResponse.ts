import { BinanceSymbol } from './BinanceSymbol';

export type ExchangeInfoResponse = {
  timezone: string;
  serverTime: number;
  symbols: BinanceSymbol[];
};

export function isExchangeInfoResponse(
  response: unknown
): response is ExchangeInfoResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const exchangeInfoResponse = response as ExchangeInfoResponse;
  if (!Array.isArray(exchangeInfoResponse.symbols)) {
    return false;
  }

  if (
    exchangeInfoResponse.symbols.every(
      (s) =>
        typeof s.symbol === 'string' &&
        typeof s.status === 'string' &&
        typeof s.quoteAsset === 'string'
    )
  ) {
    return true;
  }

  return false;
}
