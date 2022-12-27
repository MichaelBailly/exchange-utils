import { MongoClient } from 'mongodb';
import pThrottle from 'p-throttle';
import { BinanceKline, isBinanceKline } from './types/BinanceKline';

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

const throttled = throttle(
  async (symbol: string, interval: string, endTime: number | null = null) => {
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`;
    if (endTime !== null) {
      url += `&endTime=${endTime}`;
    }
    const response = await fetch(url);
    return await response.json();
  }
);

export async function importKlines(pair: string = 'XRPUSDT') {
  const collection = await getMongoCollection();
  let goOn = true;
  let endTime: number | null = null;
  while (goOn) {
    const data = await throttled(pair, '5m', endTime);
    if (!Array.isArray(data) || !data.every(isBinanceKline)) {
      throw new Error('Invalid response');
    }
    if (data.length < 1000) {
      goOn = false;
    }
    if (endTime === null) {
      data.pop();
    }
    const oldestItem: BinanceKline = data[0];
    endTime = oldestItem[0] - 1;
    const newestItem: BinanceKline = data[data.length - 1];
    const startTime = newestItem[6];
    console.log(endTime, startTime);
    console.log(new Date(startTime), new Date(endTime));
    const formattedData = data.map((d) => toMongoDoc(d, pair));
    collection.insertMany(formattedData);
  }
  mongoclient?.close();
}

function toMongoDoc(kline: BinanceKline, pair: string) {
  return {
    o: parseFloat(kline[1]),
    h: parseFloat(kline[2]),
    l: parseFloat(kline[3]),
    c: parseFloat(kline[4]),
    v: parseFloat(kline[5]),
    open: kline[0],
    close: kline[6],
    pair,
  };
}

async function getMongoCollection() {
  if (!MONGO_DB || !MONGO_COLLECTION) {
    throw new Error('MONGO_DB and MONGO_COLLECTION env vars are required');
  }
  mongoclient = new MongoClient(MONGO_DB, {});
  await mongoclient.connect();
  return mongoclient.db().collection(MONGO_COLLECTION);
}

importKlines('MATICUSDT');
