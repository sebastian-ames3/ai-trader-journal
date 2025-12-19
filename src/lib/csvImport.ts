/**
 * CSV Import Library for OptionStrat CSV exports
 *
 * Parses OptionStrat CSV files and maps them to ThesisTrade records
 */

import Papa from 'papaparse';
import { StrategyType, TradeAction, ThesisTradeStatus } from '@prisma/client';
import { parseISO, parse, isValid } from 'date-fns';

// ============================================
// Types
// ============================================

export interface OptionStratCSVRow {
  Date: string;
  Symbol: string;
  Strategy: string;
  Legs: string;
  'P/L': string;
  Status: string;
}

export interface ParsedTrade {
  id: string; // Temporary ID for UI tracking
  date: Date;
  symbol: string;
  strategyType: StrategyType | null;
  strategyName: string;
  legs: string;
  realizedPL: number | null;
  status: ThesisTradeStatus;
  rawRow: OptionStratCSVRow;
  warnings: string[];
  isValid: boolean;
  isDuplicate?: boolean;
}

export interface CSVParseResult {
  success: boolean;
  trades: ParsedTrade[];
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    validTrades: number;
    invalidTrades: number;
    duplicates: number;
  };
}

export interface ImportPreview {
  trades: ParsedTrade[];
  existingSymbols: string[]; // Symbols that have existing theses
  suggestedTheses: Map<string, string>; // symbol -> suggested thesis name
}

// ============================================
// Strategy Type Mapping
// ============================================

const STRATEGY_MAP: Record<string, StrategyType> = {
  // Standard names
  'iron condor': StrategyType.IRON_CONDOR,
  'iron butterfly': StrategyType.IRON_BUTTERFLY,
  'call spread': StrategyType.CALL_SPREAD,
  'put spread': StrategyType.PUT_SPREAD,
  'covered call': StrategyType.COVERED_CALL,
  'cash secured put': StrategyType.CASH_SECURED_PUT,
  'long call': StrategyType.LONG_CALL,
  'long put': StrategyType.LONG_PUT,
  'short call': StrategyType.SHORT_CALL,
  'short put': StrategyType.SHORT_PUT,
  straddle: StrategyType.STRADDLE,
  strangle: StrategyType.STRANGLE,
  calendar: StrategyType.CALENDAR,
  diagonal: StrategyType.DIAGONAL,
  ratio: StrategyType.RATIO,
  butterfly: StrategyType.BUTTERFLY,
  stock: StrategyType.STOCK,

  // OptionStrat variations
  ic: StrategyType.IRON_CONDOR,
  'bull call spread': StrategyType.CALL_SPREAD,
  'bear call spread': StrategyType.CALL_SPREAD,
  'bull put spread': StrategyType.PUT_SPREAD,
  'bear put spread': StrategyType.PUT_SPREAD,
  'vertical call': StrategyType.CALL_SPREAD,
  'vertical put': StrategyType.PUT_SPREAD,
  'credit spread': StrategyType.PUT_SPREAD, // Usually a put spread
  'debit spread': StrategyType.CALL_SPREAD, // Usually a call spread
  csp: StrategyType.CASH_SECURED_PUT,
  cc: StrategyType.COVERED_CALL,
  'naked put': StrategyType.SHORT_PUT,
  'naked call': StrategyType.SHORT_CALL,
};

// ============================================
// Parsing Functions
// ============================================

/**
 * Parse OptionStrat CSV content into trades
 */
export function parseOptionStratCSV(csvContent: string): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trades: ParsedTrade[] = [];

  // Parse CSV
  const parseResult = Papa.parse<OptionStratCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((error) => {
      errors.push(`Row ${error.row}: ${error.message}`);
    });
  }

  // Validate headers
  const requiredHeaders = ['Date', 'Symbol', 'Strategy', 'Status'];
  const headers = parseResult.meta.fields || [];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    return {
      success: false,
      trades: [],
      errors,
      warnings,
      summary: {
        totalRows: parseResult.data.length,
        validTrades: 0,
        invalidTrades: 0,
        duplicates: 0,
      },
    };
  }

  // Process rows
  parseResult.data.forEach((row, index) => {
    const parsed = parseTradeRow(row, index);
    trades.push(parsed);

    if (!parsed.isValid) {
      parsed.warnings.forEach((w) => warnings.push(`Row ${index + 2}: ${w}`));
    }
  });

  // Check for duplicates
  const duplicateCount = markDuplicates(trades);

  const validCount = trades.filter((t) => t.isValid && !t.isDuplicate).length;
  const invalidCount = trades.filter((t) => !t.isValid).length;

  return {
    success: errors.length === 0,
    trades,
    errors,
    warnings,
    summary: {
      totalRows: trades.length,
      validTrades: validCount,
      invalidTrades: invalidCount,
      duplicates: duplicateCount,
    },
  };
}

/**
 * Parse a single CSV row into a trade
 */
function parseTradeRow(row: OptionStratCSVRow, index: number): ParsedTrade {
  const warnings: string[] = [];
  let isValid = true;

  // Parse date
  const date = parseTradeDate(row.Date);
  if (!date) {
    warnings.push('Invalid date format');
    isValid = false;
  }

  // Parse symbol
  const symbol = row.Symbol?.toUpperCase() || '';
  if (!symbol) {
    warnings.push('Missing symbol');
    isValid = false;
  }

  // Parse strategy
  const { strategyType, strategyName } = parseStrategy(row.Strategy);
  if (!strategyType) {
    warnings.push(`Unknown strategy: ${row.Strategy}`);
  }

  // Parse P/L
  const realizedPL = parsePL(row['P/L']);

  // Parse status
  const status = parseStatus(row.Status);

  return {
    id: `import-${index}-${Date.now()}`,
    date: date || new Date(),
    symbol,
    strategyType,
    strategyName: strategyName || row.Strategy || 'Unknown',
    legs: row.Legs || '',
    realizedPL,
    status,
    rawRow: row,
    warnings,
    isValid,
  };
}

/**
 * Parse date from various formats
 */
function parseTradeDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try ISO format first (2024-01-15)
  let date = parseISO(dateStr);
  if (isValid(date)) return date;

  // Try common formats
  const formats = [
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM-dd-yyyy',
    'M-d-yyyy',
    'yyyy/MM/dd',
    'MMM dd, yyyy',
    'MMMM dd, yyyy',
  ];

  for (const format of formats) {
    try {
      date = parse(dateStr, format, new Date());
      if (isValid(date)) return date;
    } catch {
      // Continue trying other formats
    }
  }

  return null;
}

/**
 * Parse strategy name into StrategyType
 */
export function parseStrategy(strategyStr: string): {
  strategyType: StrategyType | null;
  strategyName: string;
} {
  if (!strategyStr) {
    return { strategyType: null, strategyName: '' };
  }

  const normalized = strategyStr.toLowerCase().trim();
  const strategyType = STRATEGY_MAP[normalized] || null;

  // Try partial matches
  if (!strategyType) {
    for (const [key, type] of Object.entries(STRATEGY_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return { strategyType: type, strategyName: strategyStr };
      }
    }
  }

  return { strategyType, strategyName: strategyStr };
}

/**
 * Parse P/L string into number
 * Handles formats: +$245, -$100, $50, 245, -100
 */
export function parsePL(plStr: string): number | null {
  if (!plStr) return null;

  // Remove currency symbols and whitespace
  let cleaned = plStr.replace(/[$,\s]/g, '');

  // Handle +/- prefix
  const isNegative = cleaned.startsWith('-') || plStr.includes('(');
  cleaned = cleaned.replace(/[+\-()]/g, '');

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;

  return isNegative ? -value : value;
}

/**
 * Parse status string
 */
function parseStatus(statusStr: string): ThesisTradeStatus {
  if (!statusStr) return ThesisTradeStatus.OPEN;

  const normalized = statusStr.toLowerCase().trim();

  if (normalized === 'closed' || normalized === 'complete') {
    return ThesisTradeStatus.CLOSED;
  }
  if (normalized === 'expired') {
    return ThesisTradeStatus.EXPIRED;
  }

  return ThesisTradeStatus.OPEN;
}

/**
 * Mark duplicate trades based on date, symbol, and strategy
 */
function markDuplicates(trades: ParsedTrade[]): number {
  const seen = new Set<string>();
  let duplicateCount = 0;

  trades.forEach((trade) => {
    const key = `${trade.date.toISOString().split('T')[0]}-${trade.symbol}-${trade.strategyName}`;

    if (seen.has(key)) {
      trade.isDuplicate = true;
      duplicateCount++;
    } else {
      seen.add(key);
    }
  });

  return duplicateCount;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate CSV file before parsing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}

// ============================================
// Import Helpers
// ============================================

/**
 * Map strategy type to TradeAction
 * Returns INITIAL for new trades, CLOSE for closed trades
 */
export function mapToTradeAction(status: ThesisTradeStatus): TradeAction {
  if (status === ThesisTradeStatus.CLOSED || status === ThesisTradeStatus.EXPIRED) {
    return TradeAction.CLOSE;
  }
  return TradeAction.INITIAL;
}

/**
 * Generate a description from parsed trade data
 */
export function generateTradeDescription(trade: ParsedTrade): string {
  const parts: string[] = [];

  if (trade.strategyName) {
    parts.push(trade.strategyName);
  }

  if (trade.legs) {
    parts.push(`(${trade.legs})`);
  }

  if (trade.realizedPL !== null) {
    const plStr = trade.realizedPL >= 0 ? `+$${trade.realizedPL}` : `-$${Math.abs(trade.realizedPL)}`;
    parts.push(`P/L: ${plStr}`);
  }

  return parts.join(' ') || `${trade.symbol} trade`;
}

/**
 * Format strategy type for display
 */
export function formatStrategyType(type: StrategyType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
