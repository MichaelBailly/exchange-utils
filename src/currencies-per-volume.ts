import pThrottle from 'p-throttle';
import { getKlines, getSymbols } from './exchanges/binance';
import { close as closeMongoConnection, getMongoCollection } from './mongodb';
import { isBinanceKline } from './types/BinanceKline';

const throttle = pThrottle({
  limit: 1,
  interval: 3000,
});

const throttled = throttle(async (symbol: string) => {
  return getKlines(symbol, {
    interval: '1d',
    limit: 31,
  });
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

  await updateMongoCollection(sortedSymbols);
  await closeMongoConnection();
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

type SymbolVolume = {
  pair: string;
  volUsdt: number;
};

run();
