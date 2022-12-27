import { getSymbolMap } from './coinmarketcap';
import { getSymbols } from './exchanges/binance';
import { close as closeMongoConnection, getMongoCollection } from './mongodb';
import { CMCTokenDoc } from './types/CMCTokenDoc';
import { CoinMarketCapTokenMap } from './types/CoinMarketCapTokenMap';

async function run() {
  const symbols = await getSymbols();
  const tokens = symbols
    .map((symbol) => symbol.baseAsset)
    .filter(
      (t) =>
        t !== 'BTTC' &&
        t !== 'IOTA' &&
        t !== 'EUR' &&
        t !== 'GBP' &&
        t !== 'AUD'
    );
  const cmcResponse = await getSymbolMap(tokens);
  const filtered = removeDupliates(tokens, cmcResponse);

  printNotFoundTokens(tokens, filtered);

  await updateMongoCollection(toCMCTokenDocs(filtered));
  closeMongoConnection();
}

async function updateMongoCollection(data: CMCTokenDoc[]): Promise<void> {
  const mongoCollection = await getMongoCollection();
  await mongoCollection.deleteMany({});
  await mongoCollection.insertMany(data);
}

function toCMCTokenDocs(cmcResponse: CoinMarketCapTokenMap[]): CMCTokenDoc[] {
  const sorted = cmcResponse.sort((a, b) => a.rank - b.rank);
  const setSize = sorted.length;
  return sorted.map((token, i) => {
    const rank = i + 1;
    return {
      cmcid: token.id,
      baseAsset: token.symbol,
      cmcrank: token.rank,
      rank,
      setSize,
      cmcFamily: getCMCFamily(rank, setSize),
    };
  });
}

function getCMCFamily(rank: number, setSize: number) {
  const percent = rank / setSize;
  if (percent < 0.2) {
    return 'xl';
  } else if (percent < 0.4) {
    return 'l';
  } else if (percent < 0.6) {
    return 'm';
  } else if (percent < 0.8) {
    return 's';
  }
  return 'xs';
}

function printNotFoundTokens(
  tokens: string[],
  cmcResponse: CoinMarketCapTokenMap[]
) {
  const tokensBis = [...tokens];
  cmcResponse.forEach((token) => {
    const index = tokensBis.indexOf(token.symbol);
    if (index > -1) {
      tokensBis.splice(index, 1);
    }
  });
  if (tokensBis.length > 0) {
    console.log('Tokens UNKNOWN on CMC:', tokensBis);
  }
}

function removeDupliates(
  tokens: string[],
  cmcResponse: CoinMarketCapTokenMap[]
): CoinMarketCapTokenMap[] {
  const tmp = tokens
    .map((token) => cmcResponse.find((cmcToken) => cmcToken.symbol === token))
    .filter((v) => v !== undefined);
  if (tmp.every((v) => v !== undefined)) {
    return tmp as CoinMarketCapTokenMap[];
  }
  throw new Error('Invalid response');
}

run();
