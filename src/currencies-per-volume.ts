import { MongoClient } from 'mongodb';
import pThrottle from 'p-throttle';

const MONGO_DB = process.env.MONGO_DB;
const MONGO_COLLECTION = process.env.MONGO_COLLECTION;

if (!MONGO_DB || !MONGO_COLLECTION) {
  throw new Error('MONGO_DB and MONGO_COLLECTION env vars are required');
}
let mongoclient: null | MongoClient = null;

const throttle = pThrottle({
  limit: 1,
  interval: 3000,
});

const throttled = throttle(async (symbol) => {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=31`
  );
  return await response.json();
});

async function run() {
  const symbols = await getSymbols();
  const symbolsWithVolume = [];
  for (const symbol of symbols) {
    const data = await throttled(symbol.symbol);

    if (!Array.isArray(data) || !data.every(isBinanceKline)) {
      throw new Error('Invalid response');
    }
    data.pop();

    const formattedData =
      data
        .map((item) => {
          return parseFloat(item[4]) * parseFloat(item[5]);
        })
        .reduce((a, b) => a + b, 0) / 30;
    symbolsWithVolume.push({
      pair: symbol.symbol,
      volUsdt: formattedData,
    });
  }

  const sortedSymbols = symbolsWithVolume.sort((a, b) => {
    return b.volUsdt - a.volUsdt;
  });

  sortedSymbols.forEach((symbol) => {
    console.log(`${symbol.pair} -> ${symbol.volUsdt}`);
  });
  updateMongoCollection(sortedSymbols);
  if (mongoclient) {
    mongoclient.close();
  }
}

async function getSymbols() {
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

async function updateMongoCollection(data: SymbolVolume[]): Promise<void> {
  const mongoCollection = await getMongoCollection();
  await mongoCollection.deleteMany({});
  await mongoCollection.insertMany(
    data.map((item) => {
      return {
        pair: item.pair,
        volUsdt: item.volUsdt,
      };
    })
  );
}

async function getMongoCollection() {
  if (!MONGO_DB || !MONGO_COLLECTION) {
    throw new Error('MONGO_DB and MONGO_COLLECTION env vars are required');
  }
  mongoclient = new MongoClient(MONGO_DB, {});
  await mongoclient.connect();
  return mongoclient.db().collection(MONGO_COLLECTION);
}

function isExchangeInfoResponse(
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

function isBinanceKline(response: unknown): response is BinanceKline {
  if (!Array.isArray(response)) {
    return false;
  }
  if (response.length !== 12) {
    return false;
  }
  if (!(typeof response[0] === 'number')) {
    return false;
  }
  if (!(typeof response[1] === 'string')) {
    return false;
  }
  if (!(typeof response[2] === 'string')) {
    return false;
  }
  if (!(typeof response[3] === 'string')) {
    return false;
  }
  if (!(typeof response[4] === 'string')) {
    return false;
  }
  if (!(typeof response[5] === 'string')) {
    return false;
  }
  if (!(typeof response[6] === 'number')) {
    return false;
  }
  if (!(typeof response[7] === 'string')) {
    return false;
  }
  if (!(typeof response[8] === 'number')) {
    return false;
  }
  if (!(typeof response[9] === 'string')) {
    return false;
  }
  if (!(typeof response[10] === 'string')) {
    return false;
  }
  if (!(typeof response[11] === 'string')) {
    return false;
  }

  return true;
}

type ExchangeInfoResponse = {
  timezone: string;
  serverTime: number;
  symbols: BinanceSymbol[];
};

type BinanceSymbol = {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  permissions: string[];
};

type BinanceKline = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string // Ignore
];

type SymbolVolume = {
  pair: string;
  volUsdt: number;
};

run();
