export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string // Ignore
];

export function isBinanceKline(response: unknown): response is BinanceKline {
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
