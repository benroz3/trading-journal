export interface SymbolPreset {
  symbol: string;
  name: string;
  tickSize: number | string;
  tickValue: number;
  assetClass: string;
}

export const SYMBOL_PRESETS: SymbolPreset[] = [
  { symbol: 'ES', name: 'E-mini S&P 500', tickSize: 0.25, tickValue: 12.50, assetClass: 'EQUITY_INDEX' },
  { symbol: 'NQ', name: 'E-mini Nasdaq', tickSize: 0.25, tickValue: 5.00, assetClass: 'EQUITY_INDEX' },
  { symbol: 'YM', name: 'E-mini Dow', tickSize: 1, tickValue: 5.00, assetClass: 'EQUITY_INDEX' },
  { symbol: 'RTY', name: 'E-mini Russell', tickSize: 0.10, tickValue: 5.00, assetClass: 'EQUITY_INDEX' },
  { symbol: 'CL', name: 'Crude Oil', tickSize: 0.01, tickValue: 10.00, assetClass: 'ENERGY' },
  { symbol: 'GC', name: 'Gold', tickSize: 0.10, tickValue: 10.00, assetClass: 'METALS' },
  { symbol: 'SI', name: 'Silver', tickSize: 0.005, tickValue: 25.00, assetClass: 'METALS' },
  { symbol: 'NG', name: 'Natural Gas', tickSize: 0.001, tickValue: 10.00, assetClass: 'ENERGY' },
  { symbol: 'ZB', name: '30yr Bond', tickSize: '1/32', tickValue: 31.25, assetClass: 'INTEREST_RATE' },
  { symbol: '6E', name: 'Euro FX', tickSize: 0.00005, tickValue: 6.25, assetClass: 'CURRENCY' },
  { symbol: 'MES', name: 'Micro S&P', tickSize: 0.25, tickValue: 1.25, assetClass: 'EQUITY_INDEX' },
  { symbol: 'MNQ', name: 'Micro Nasdaq', tickSize: 0.25, tickValue: 0.50, assetClass: 'EQUITY_INDEX' },
  { symbol: 'XAUUSD', name: 'Gold Spot', tickSize: 0.01, tickValue: 1, assetClass: 'CURRENCY' },
  { symbol: 'XAGUSD', name: 'Silver Spot', tickSize: 0.001, tickValue: 1, assetClass: 'CURRENCY' },
  { symbol: 'EURUSD', name: 'EUR/USD', tickSize: 0.00001, tickValue: 1, assetClass: 'CURRENCY' },
  { symbol: 'GBPUSD', name: 'GBP/USD', tickSize: 0.00001, tickValue: 1, assetClass: 'CURRENCY' },
  { symbol: 'BTCUSD', name: 'Bitcoin', tickSize: 0.01, tickValue: 1, assetClass: 'CRYPTO' },
];

export const OUTCOME_OPTIONS = [
  { value: 'TP', label: 'Take Profit' },
  { value: 'SL', label: 'Stop Loss' },
  { value: 'BE', label: 'Breakeven' },
];

export const DIRECTION_OPTIONS = [
  { value: 'LONG', label: 'Long' },
  { value: 'SHORT', label: 'Short' },
];

export const SESSION_OPTIONS = [
  { value: 'ASIA', label: 'Asia' },
  { value: 'LONDON', label: 'London' },
  { value: 'NEW_YORK', label: 'New York' },
  { value: 'OVERLAP', label: 'Overlap' },
  { value: 'OFF_HOURS', label: 'Off Hours' },
];

export const ASSET_CLASS_OPTIONS = [
  { value: 'EQUITY_INDEX', label: 'Equity Index' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'METALS', label: 'Metals' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'INTEREST_RATE', label: 'Interest Rate' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'OTHER', label: 'Other' },
];

export const EMOTIONAL_STATES = [
  'Confident',
  'Calm',
  'Focused',
  'Anxious',
  'FOMO',
  'Greedy',
  'Fearful',
  'Frustrated',
  'Revenge Trading',
  'Bored',
  'Overconfident',
  'Neutral',
];
