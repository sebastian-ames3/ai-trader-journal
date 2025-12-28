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
  // New OptionStrat format
  Name?: string;
  'Total Return %'?: string;
  'Total Return $'?: string;
  'Created At'?: string;
  Expiration?: string;
  'Net Debit/Credit'?: string;
  'Max Loss'?: string;
  'Max Profit'?: string;
  // Legacy format support
  Date?: string;
  Symbol?: string;
  Strategy?: string;
  Legs?: string;
  'P/L'?: string;
  Status?: string;
  // Allow any other fields
  [key: string]: string | undefined;
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
  expiration?: string;
  maxLoss?: number;
  maxProfit?: number;
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

  // Plural variations (OptionStrat uses these)
  'long calls': StrategyType.LONG_CALL,
  'long puts': StrategyType.LONG_PUT,
  'short calls': StrategyType.SHORT_CALL,
  'short puts': StrategyType.SHORT_PUT,

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

  // Butterfly variations
  'long call butterfly': StrategyType.BUTTERFLY,
  'long put butterfly': StrategyType.BUTTERFLY,
  'call butterfly': StrategyType.BUTTERFLY,
  'put butterfly': StrategyType.BUTTERFLY,
};

// ============================================
// Parsing Functions
// ============================================

/**
 * Normalize a header name for comparison
 * Handles variations in spacing, capitalization, and special characters
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Normalize multiple spaces
    .replace(/[^\w\s$%]/g, '');  // Remove special chars except $ and %
}

/**
 * Check if a header contains a target (fuzzy match)
 */
function hasHeader(headers: string[], target: string): boolean {
  const normalizedTarget = normalizeHeader(target);
  return headers.some(h => {
    const normalized = normalizeHeader(h);
    return normalized === normalizedTarget ||
           normalized.includes(normalizedTarget) ||
           normalizedTarget.includes(normalized);
  });
}

/**
 * Find the actual header name that matches a target
 */
function findHeader(headers: string[], target: string): string | undefined {
  const normalizedTarget = normalizeHeader(target);
  return headers.find(h => {
    const normalized = normalizeHeader(h);
    return normalized === normalizedTarget ||
           normalized.includes(normalizedTarget) ||
           normalizedTarget.includes(normalized);
  });
}

/**
 * Detect which format the CSV is in
 */
function detectCSVFormat(headers: string[]): 'optionstrat' | 'legacy' | 'unknown' {
  console.log('[CSV Import] Detecting format. Headers:', headers.slice(0, 10));

  // OptionStrat format has "Name" and "Created At" or "Total Return" columns
  const hasName = hasHeader(headers, 'Name');
  const hasCreatedAt = hasHeader(headers, 'Created At') || hasHeader(headers, 'Created');
  const hasTotalReturn = hasHeader(headers, 'Total Return') || hasHeader(headers, 'Return $') || hasHeader(headers, 'Return');
  const hasExpiration = hasHeader(headers, 'Expiration');

  console.log('[CSV Import] OptionStrat check:', { hasName, hasCreatedAt, hasTotalReturn, hasExpiration });

  if (hasName && (hasCreatedAt || hasTotalReturn || hasExpiration)) {
    return 'optionstrat';
  }

  // Legacy format has "Date", "Symbol", "Strategy" columns
  const hasDate = hasHeader(headers, 'Date');
  const hasSymbol = hasHeader(headers, 'Symbol');
  const hasStrategy = hasHeader(headers, 'Strategy');

  console.log('[CSV Import] Legacy check:', { hasDate, hasSymbol, hasStrategy });

  if (hasDate && hasSymbol && hasStrategy) {
    return 'legacy';
  }
  return 'unknown';
}

/**
 * Check if a row is a leg row (child) vs a trade row (parent) in OptionStrat format
 * Leg rows have symbols starting with "." and no Name value
 */
function isLegRow(row: OptionStratCSVRow): boolean {
  const symbol = row.Symbol || '';
  const name = row.Name || '';
  // Leg rows typically have a symbol starting with "." and empty or minimal Name
  return symbol.startsWith('.') || (symbol.length > 0 && name.length === 0);
}

/**
 * Extract ticker and strategy from OptionStrat "Name" field
 * e.g., "ASPI Apr 17th '26 20 Long Call" -> { ticker: "ASPI", strategy: "Long Call" }
 */
function parseOptionStratName(name: string): { ticker: string; strategy: string; expiration: string } {
  if (!name) {
    return { ticker: '', strategy: '', expiration: '' };
  }

  // Pattern: "TICKER Month Day 'YY Strike Strategy"
  // Examples:
  // "ASPI Apr 17th '26 20 Long Call"
  // "CRCL Apr 17th '26 100/150 Bull Call Spread"
  // "META Mar 20th '26 695/700/705 Long Call Butterfly"

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return { ticker: name, strategy: '', expiration: '' };
  }

  const ticker = parts[0].toUpperCase();

  // Find where the strategy starts (after strike prices)
  // Strategy keywords: Long, Short, Bull, Bear, Iron, Covered, Cash, Naked, Call, Put, Spread, Condor, etc.
  const strategyKeywords = ['long', 'short', 'bull', 'bear', 'iron', 'covered', 'cash', 'naked', 'straddle', 'strangle', 'calendar', 'diagonal', 'butterfly', 'condor', 'ratio'];

  let strategyStartIdx = -1;
  for (let i = 1; i < parts.length; i++) {
    const partLower = parts[i].toLowerCase();
    if (strategyKeywords.some(kw => partLower.startsWith(kw))) {
      strategyStartIdx = i;
      break;
    }
  }

  // Extract expiration (month, day, year between ticker and strategy)
  let expiration = '';
  if (strategyStartIdx > 1) {
    // Look for month/day/year pattern
    const expParts = parts.slice(1, strategyStartIdx).filter(p => {
      // Filter out strike prices (numbers, slashes)
      return !/^[\d\/]+$/.test(p);
    });
    expiration = expParts.join(' ');
  }

  // Extract strategy
  const strategy = strategyStartIdx > 0 ? parts.slice(strategyStartIdx).join(' ') : '';

  return { ticker, strategy, expiration };
}

/**
 * Remove BOM (Byte Order Mark) from CSV content
 */
function removeBOM(content: string): string {
  // Remove UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  }
  // Remove other common BOMs
  const boms = ['\uFEFF', '\uFFFE', '\u0000'];
  for (const bom of boms) {
    if (content.startsWith(bom)) {
      return content.slice(bom.length);
    }
  }
  return content;
}

/**
 * Parse OptionStrat CSV content into trades
 */
export function parseOptionStratCSV(csvContent: string): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trades: ParsedTrade[] = [];

  // Remove BOM if present
  const cleanedContent = removeBOM(csvContent.trim());

  console.log('[CSV Import] Parsing CSV, first 200 chars:', cleanedContent.slice(0, 200));

  // Parse CSV
  const parseResult = Papa.parse<OptionStratCSVRow>(cleanedContent, {
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

  const headers = parseResult.meta.fields || [];
  const format = detectCSVFormat(headers);

  if (format === 'unknown') {
    // Try to provide helpful error message
    const hasName = headers.includes('Name');
    const hasDate = headers.includes('Date');
    errors.push(
      `Unrecognized CSV format. Found columns: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`
    );
    if (!hasName && !hasDate) {
      errors.push('Expected either "Name" column (OptionStrat format) or "Date" column (legacy format)');
    }
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

  // Process rows based on format
  if (format === 'optionstrat') {
    // Find the actual Name header (handles variations)
    const nameHeader = findHeader(headers, 'Name') || 'Name';
    console.log('[CSV Import] Using name header:', nameHeader);

    // Filter out leg rows (child rows) - we only want parent trade rows
    const tradeRows = parseResult.data.filter(row => {
      const nameValue = row[nameHeader] || row.Name || '';
      const hasName = nameValue && nameValue.length > 0;
      const isLeg = isLegRow(row);
      return hasName && !isLeg;
    });

    console.log('[CSV Import] Found', tradeRows.length, 'trade rows out of', parseResult.data.length, 'total rows');

    tradeRows.forEach((row, index) => {
      const parsed = parseOptionStratRow(row, index, headers);
      trades.push(parsed);

      if (!parsed.isValid) {
        parsed.warnings.forEach((w) => warnings.push(`Row ${index + 2}: ${w}`));
      }
    });
  } else {
    // Legacy format
    parseResult.data.forEach((row, index) => {
      const parsed = parseLegacyRow(row, index);
      trades.push(parsed);

      if (!parsed.isValid) {
        parsed.warnings.forEach((w) => warnings.push(`Row ${index + 2}: ${w}`));
      }
    });
  }

  // Check for duplicates
  const duplicateCount = markDuplicates(trades);

  const validCount = trades.filter((t) => t.isValid && !t.isDuplicate).length;
  const invalidCount = trades.filter((t) => !t.isValid).length;

  return {
    success: errors.length === 0 && validCount > 0,
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
 * Get a value from a row using fuzzy header matching
 */
function getRowValue(row: OptionStratCSVRow, headers: string[], target: string): string {
  // First try direct access
  if (row[target] !== undefined) {
    return row[target] || '';
  }

  // Try to find the actual header name
  const actualHeader = findHeader(headers, target);
  if (actualHeader && row[actualHeader] !== undefined) {
    return row[actualHeader] || '';
  }

  return '';
}

/**
 * Parse an OptionStrat format row
 */
function parseOptionStratRow(row: OptionStratCSVRow, index: number, headers: string[] = []): ParsedTrade {
  const warnings: string[] = [];
  let isValid = true;

  // Get Name value (handles column name variations)
  const nameValue = getRowValue(row, headers, 'Name') || row.Name || '';

  // Parse Name field to extract ticker and strategy
  const { ticker, strategy, expiration: nameExpiration } = parseOptionStratName(nameValue);

  if (!ticker) {
    warnings.push(`Could not extract ticker from Name: "${nameValue}"`);
    isValid = false;
  }

  // Parse date from "Created At" field (format: "12/10/25 9:34" or "12/10/2025 9:34")
  const createdAt = getRowValue(row, headers, 'Created At') || getRowValue(row, headers, 'Created') || row['Created At'] || '';
  const date = parseTradeDate(createdAt);
  if (!date) {
    warnings.push(`Invalid date format: "${createdAt}"`);
    isValid = false;
  }

  // Parse strategy type
  const { strategyType, strategyName } = parseStrategy(strategy);
  if (!strategyType && strategy) {
    warnings.push(`Unknown strategy type: ${strategy}`);
  }

  // Parse P/L from "Total Return $" or similar
  const totalReturn = getRowValue(row, headers, 'Total Return $') || getRowValue(row, headers, 'Total Return') || row['Total Return $'] || '';
  const realizedPL = parsePL(totalReturn);

  // Parse expiration date
  const expirationValue = getRowValue(row, headers, 'Expiration') || row.Expiration || nameExpiration || '';
  const expiration = expirationValue;

  // Parse max loss/profit
  const maxLossValue = getRowValue(row, headers, 'Max Loss') || row['Max Loss'] || '';
  const maxProfitValue = getRowValue(row, headers, 'Max Profit') || row['Max Profit'] || '';
  const maxLoss = parsePL(maxLossValue);
  const maxProfit = parsePL(maxProfitValue);

  // Determine status - if there's a close price or P/L and trade is past expiration, it's closed
  const returnPercent = parseFloat((row['Total Return %'] || '0').replace('%', ''));
  const status = determineTradeStatus(expiration, returnPercent);

  return {
    id: `import-${index}-${Date.now()}`,
    date: date || new Date(),
    symbol: ticker,
    strategyType,
    strategyName: row.Name || strategyName || 'Unknown',
    legs: '', // Legs are in child rows, could aggregate if needed
    realizedPL,
    status,
    expiration,
    maxLoss: maxLoss ?? undefined,
    maxProfit: maxProfit ?? undefined,
    rawRow: row,
    warnings,
    isValid,
  };
}

/**
 * Determine trade status based on expiration and return
 */
function determineTradeStatus(expiration: string, returnPercent: number): ThesisTradeStatus {
  if (!expiration) {
    return ThesisTradeStatus.OPEN;
  }

  // Try to parse expiration date
  const expDate = parseExpirationDate(expiration);
  if (expDate && expDate < new Date()) {
    return ThesisTradeStatus.EXPIRED;
  }

  // If return is exactly 0 or very small, likely still open
  if (Math.abs(returnPercent) < 0.01) {
    return ThesisTradeStatus.OPEN;
  }

  return ThesisTradeStatus.OPEN;
}

/**
 * Parse expiration date from various formats
 * e.g., "4/17/2026 16:00", "4/17/26 16:00", "Apr 17th '26"
 */
function parseExpirationDate(expStr: string): Date | null {
  if (!expStr) return null;

  // Remove time portion
  const dateOnly = expStr.split(' ')[0];

  // Try parsing as date
  const date = parseTradeDate(dateOnly);
  return date;
}

/**
 * Parse a legacy format CSV row into a trade
 */
function parseLegacyRow(row: OptionStratCSVRow, index: number): ParsedTrade {
  const warnings: string[] = [];
  let isValid = true;

  // Parse date
  const date = parseTradeDate(row.Date || '');
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
  const { strategyType, strategyName } = parseStrategy(row.Strategy || '');
  if (!strategyType) {
    warnings.push(`Unknown strategy: ${row.Strategy}`);
  }

  // Parse P/L
  const realizedPL = parsePL(row['P/L'] || '');

  // Parse status
  const status = parseStatus(row.Status || '');

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

  // Remove time portion for parsing (e.g., "12/10/25 9:34" -> "12/10/25")
  const dateOnly = dateStr.split(' ')[0];

  // Try ISO format first (2024-01-15)
  let date = parseISO(dateOnly);
  if (isValid(date)) return date;

  // Try common formats
  const formats = [
    // With time
    'M/d/yy H:mm',
    'M/d/yyyy H:mm',
    'MM/dd/yy H:mm',
    'MM/dd/yyyy H:mm',
    // Without time
    'M/d/yy',
    'M/d/yyyy',
    'MM/dd/yy',
    'MM/dd/yyyy',
    'MM-dd-yyyy',
    'M-d-yyyy',
    'yyyy/MM/dd',
    'MMM dd, yyyy',
    'MMMM dd, yyyy',
  ];

  for (const format of formats) {
    try {
      // Try with full string first (includes time)
      date = parse(dateStr, format, new Date());
      if (isValid(date)) return date;

      // Try with date only
      date = parse(dateOnly, format, new Date());
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

/**
 * Strategy type options for select dropdowns
 */
export const STRATEGY_TYPE_OPTIONS: { value: StrategyType; label: string }[] = [
  { value: 'LONG_CALL', label: 'Long Call' },
  { value: 'LONG_PUT', label: 'Long Put' },
  { value: 'SHORT_CALL', label: 'Short Call' },
  { value: 'SHORT_PUT', label: 'Short Put' },
  { value: 'CALL_SPREAD', label: 'Call Spread' },
  { value: 'PUT_SPREAD', label: 'Put Spread' },
  { value: 'IRON_CONDOR', label: 'Iron Condor' },
  { value: 'IRON_BUTTERFLY', label: 'Iron Butterfly' },
  { value: 'BUTTERFLY', label: 'Butterfly' },
  { value: 'STRADDLE', label: 'Straddle' },
  { value: 'STRANGLE', label: 'Strangle' },
  { value: 'CALENDAR', label: 'Calendar' },
  { value: 'DIAGONAL', label: 'Diagonal' },
  { value: 'RATIO', label: 'Ratio' },
  { value: 'COVERED_CALL', label: 'Covered Call' },
  { value: 'CASH_SECURED_PUT', label: 'Cash Secured Put' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'CUSTOM', label: 'Custom' },
];

// ============================================
// Cache Key Helpers
// ============================================

const IMPORT_CACHE_PREFIX = 'import:csv:';

/**
 * Generate cache key for import preview data
 */
export function getImportCacheKey(batchId: string): string {
  return `${IMPORT_CACHE_PREFIX}${batchId}`;
}
