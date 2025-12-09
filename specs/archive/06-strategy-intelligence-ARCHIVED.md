# PRD: Complex Options Strategy Intelligence

## Overview

**Problem Statement:**
Options traders frequently use multi-leg strategies (spreads, iron condors, butterflies) but lack tools that properly attribute P/L to individual legs, visualize aggregate risk, and provide intelligent insights about their overall position.

**Solution:**
A comprehensive options strategy analysis system that calculates aggregate Greeks, generates P/L curves, provides breakeven analysis, and offers AI-powered insights on complex positions.

**Success Metrics:**
- Accurate P/L calculations matching brokerage values within 1%
- Greeks aggregation across unlimited legs
- Interactive P/L visualization with strike/expiration scenarios
- Strategy identification and optimization suggestions
- < 500ms calculation time for complex positions

---

## Research Foundation

This specification is based on extensive research into industry-leading tools:

**Tools Analyzed:**
- OptionStrat (primary reference)
- ThinkorSwim/TastyTrade (brokerage platforms)
- OptionLab (Python library)
- py_vollib (pricing library)

**Key Insights:**
1. Black-Scholes model with adjustments for American options
2. Aggregate Greeks = sum of individual leg Greeks (adjusted for position size/direction)
3. P/L curves computed by iterating theoretical price at each underlying price point
4. IV surfaces for multi-expiration visualization

---

## Mathematical Foundation

### Black-Scholes Option Pricing

**Call Price:**
```
C = S * N(d1) - K * e^(-rT) * N(d2)
```

**Put Price:**
```
P = K * e^(-rT) * N(-d2) - S * N(-d1)
```

**Where:**
```
d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
d2 = d1 - σ√T

S = Current stock price
K = Strike price
T = Time to expiration (years)
r = Risk-free rate
σ = Implied volatility
N() = Standard normal CDF
```

### Greeks Calculations

**Delta (Δ):**
```
Call: N(d1)
Put: N(d1) - 1
```

**Gamma (Γ):**
```
Γ = n(d1) / (S * σ * √T)
where n(d1) = standard normal PDF
```

**Theta (Θ):**
```
Call: -[S * n(d1) * σ / (2√T)] - r * K * e^(-rT) * N(d2)
Put: -[S * n(d1) * σ / (2√T)] + r * K * e^(-rT) * N(-d2)
```

**Vega (ν):**
```
ν = S * √T * n(d1)
```

**Rho (ρ):**
```
Call: K * T * e^(-rT) * N(d2)
Put: -K * T * e^(-rT) * N(-d2)
```

### Aggregate Position Greeks

For a multi-leg position:

```typescript
interface PositionGreeks {
  delta: number;    // Sum of (leg_delta * quantity * multiplier)
  gamma: number;    // Sum of (leg_gamma * quantity * multiplier)
  theta: number;    // Sum of (leg_theta * quantity * multiplier)
  vega: number;     // Sum of (leg_vega * quantity * multiplier)
  rho: number;      // Sum of (leg_rho * quantity * multiplier)
}

function aggregateGreeks(legs: OptionLeg[]): PositionGreeks {
  return legs.reduce((agg, leg) => {
    const direction = leg.side === 'BUY' ? 1 : -1;
    const multiplier = leg.contracts * 100 * direction;

    return {
      delta: agg.delta + leg.greeks.delta * multiplier,
      gamma: agg.gamma + leg.greeks.gamma * multiplier,
      theta: agg.theta + leg.greeks.theta * multiplier,
      vega: agg.vega + leg.greeks.vega * multiplier,
      rho: agg.rho + leg.greeks.rho * multiplier
    };
  }, { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
}
```

### P/L Calculation at Any Price Point

```typescript
function calculatePositionPL(
  legs: OptionLeg[],
  underlyingPrice: number,
  daysUntilExpiry: number,
  iv: number
): number {
  let totalPL = 0;

  for (const leg of legs) {
    const theoreticalPrice = blackScholes({
      S: underlyingPrice,
      K: leg.strike,
      T: daysUntilExpiry / 365,
      r: RISK_FREE_RATE,
      sigma: iv,
      type: leg.optionType
    });

    const direction = leg.side === 'BUY' ? 1 : -1;
    const costBasis = leg.entryPrice * leg.contracts * 100;
    const currentValue = theoreticalPrice * leg.contracts * 100;

    totalPL += (currentValue - costBasis) * direction;
  }

  return totalPL;
}
```

### Breakeven Calculation

```typescript
function findBreakevens(
  legs: OptionLeg[],
  minPrice: number,
  maxPrice: number,
  precision: number = 0.01
): number[] {
  const breakevens: number[] = [];
  let prevPL = calculatePositionPL(legs, minPrice, 0, avgIV);

  for (let price = minPrice + precision; price <= maxPrice; price += precision) {
    const currentPL = calculatePositionPL(legs, price, 0, avgIV);

    // Detect sign change (crosses zero)
    if ((prevPL < 0 && currentPL >= 0) || (prevPL > 0 && currentPL <= 0)) {
      // Linear interpolation for exact breakeven
      const breakeven = price - precision * (currentPL / (currentPL - prevPL));
      breakevens.push(Math.round(breakeven * 100) / 100);
    }

    prevPL = currentPL;
  }

  return breakevens;
}
```

---

## Strategy Recognition System

### Supported Strategy Types

| Strategy | Legs | Identification Pattern |
|----------|------|----------------------|
| **Long Call** | 1 | Buy call |
| **Long Put** | 1 | Buy put |
| **Covered Call** | 2 | Long stock + short call |
| **Cash-Secured Put** | 1 | Short put with cash collateral |
| **Bull Call Spread** | 2 | Buy call (lower K) + sell call (higher K) |
| **Bear Put Spread** | 2 | Buy put (higher K) + sell put (lower K) |
| **Iron Condor** | 4 | OTM bull put + OTM bear call spread |
| **Iron Butterfly** | 4 | ATM short straddle + OTM long strangle |
| **Straddle** | 2 | Same K call + put (same direction) |
| **Strangle** | 2 | OTM call + OTM put (same direction) |
| **Calendar Spread** | 2 | Same K, different expiries |
| **Diagonal Spread** | 2 | Different K, different expiries |
| **Butterfly** | 3 | 1 ITM + 2 ATM short + 1 OTM (or reverse) |
| **Ratio Spread** | 2+ | Unequal quantities at different strikes |
| **Jade Lizard** | 3 | Short put + short call spread |
| **Big Lizard** | 3 | Short straddle + long OTM call |

### Strategy Detection Algorithm

```typescript
interface StrategyPattern {
  name: string;
  detect: (legs: OptionLeg[]) => boolean;
  maxProfit: (legs: OptionLeg[]) => number | 'unlimited';
  maxLoss: (legs: OptionLeg[]) => number | 'unlimited';
  breakevens: (legs: OptionLeg[]) => number[];
}

function detectStrategy(legs: OptionLeg[]): StrategyPattern | null {
  // Sort legs by strike, then type
  const sorted = [...legs].sort((a, b) => a.strike - b.strike);

  // Single leg strategies
  if (sorted.length === 1) {
    const leg = sorted[0];
    if (leg.optionType === 'CALL' && leg.side === 'BUY') return LONG_CALL;
    if (leg.optionType === 'PUT' && leg.side === 'BUY') return LONG_PUT;
    if (leg.optionType === 'CALL' && leg.side === 'SELL') return NAKED_CALL;
    if (leg.optionType === 'PUT' && leg.side === 'SELL') return CASH_SECURED_PUT;
  }

  // Two leg strategies
  if (sorted.length === 2) {
    const [leg1, leg2] = sorted;

    // Vertical spreads
    if (leg1.expiration === leg2.expiration) {
      if (leg1.optionType === 'CALL' && leg2.optionType === 'CALL') {
        if (leg1.side === 'BUY' && leg2.side === 'SELL') return BULL_CALL_SPREAD;
        if (leg1.side === 'SELL' && leg2.side === 'BUY') return BEAR_CALL_SPREAD;
      }
      if (leg1.optionType === 'PUT' && leg2.optionType === 'PUT') {
        if (leg1.side === 'SELL' && leg2.side === 'BUY') return BULL_PUT_SPREAD;
        if (leg1.side === 'BUY' && leg2.side === 'SELL') return BEAR_PUT_SPREAD;
      }
      // Straddle/Strangle
      if (leg1.optionType !== leg2.optionType && leg1.side === leg2.side) {
        if (leg1.strike === leg2.strike) return leg1.side === 'BUY' ? LONG_STRADDLE : SHORT_STRADDLE;
        return leg1.side === 'BUY' ? LONG_STRANGLE : SHORT_STRANGLE;
      }
    }

    // Calendar/Diagonal spreads
    if (leg1.expiration !== leg2.expiration && leg1.optionType === leg2.optionType) {
      if (leg1.strike === leg2.strike) return CALENDAR_SPREAD;
      return DIAGONAL_SPREAD;
    }
  }

  // Four leg strategies
  if (sorted.length === 4) {
    const strikes = sorted.map(l => l.strike);
    const uniqueStrikes = [...new Set(strikes)];

    // Iron Condor: 4 strikes, put spread + call spread
    if (uniqueStrikes.length === 4) {
      const putLegs = sorted.filter(l => l.optionType === 'PUT');
      const callLegs = sorted.filter(l => l.optionType === 'CALL');

      if (putLegs.length === 2 && callLegs.length === 2) {
        // Check for iron condor pattern
        if (isIronCondorPattern(putLegs, callLegs)) return IRON_CONDOR;
      }
    }

    // Iron Butterfly: 3 strikes (middle shared)
    if (uniqueStrikes.length === 3) {
      if (isIronButterflyPattern(sorted)) return IRON_BUTTERFLY;
    }
  }

  return null; // Custom/unrecognized strategy
}
```

---

## P/L Attribution System

### Per-Leg Attribution

Track P/L contribution from each leg:

```typescript
interface LegAttribution {
  legId: string;
  description: string;      // e.g., "NVDA 150C 12/20"
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  direction: 'LONG' | 'SHORT';

  // P/L components
  intrinsicPL: number;      // From stock movement
  extrinsicPL: number;      // From time/IV changes
  totalPL: number;
  percentPL: number;

  // Greeks contribution
  deltaContribution: number;
  thetaContribution: number;
  vegaContribution: number;
}

function calculateLegAttribution(leg: OptionLeg, currentData: MarketData): LegAttribution {
  const direction = leg.side === 'BUY' ? 1 : -1;
  const multiplier = leg.contracts * 100;

  const entryTotal = leg.entryPrice * multiplier;
  const currentTotal = currentData.optionPrice * multiplier;

  // Intrinsic value
  const intrinsicEntry = Math.max(0,
    leg.optionType === 'CALL'
      ? leg.entryUnderlyingPrice - leg.strike
      : leg.strike - leg.entryUnderlyingPrice
  );
  const intrinsicCurrent = Math.max(0,
    leg.optionType === 'CALL'
      ? currentData.underlyingPrice - leg.strike
      : leg.strike - currentData.underlyingPrice
  );

  const intrinsicChange = (intrinsicCurrent - intrinsicEntry) * multiplier * direction;
  const totalPL = (currentTotal - entryTotal) * direction;

  return {
    legId: leg.id,
    description: `${leg.ticker} ${leg.strike}${leg.optionType[0]} ${formatDate(leg.expiration)}`,
    entryPrice: leg.entryPrice,
    currentPrice: currentData.optionPrice,
    quantity: leg.contracts,
    direction: leg.side === 'BUY' ? 'LONG' : 'SHORT',
    intrinsicPL: intrinsicChange,
    extrinsicPL: totalPL - intrinsicChange,
    totalPL,
    percentPL: (totalPL / entryTotal) * 100,
    deltaContribution: currentData.greeks.delta * multiplier * direction,
    thetaContribution: currentData.greeks.theta * multiplier * direction,
    vegaContribution: currentData.greeks.vega * multiplier * direction
  };
}
```

### Daily P/L Decomposition

Attribute daily P/L to:
1. **Delta P/L**: Stock price movement
2. **Theta P/L**: Time decay
3. **Vega P/L**: IV changes
4. **Gamma P/L**: Delta changes (second-order)
5. **Unexplained**: Rounding, bid-ask, etc.

```typescript
interface DailyPLDecomposition {
  date: Date;

  // Components
  deltaEffect: number;      // Delta * stock change
  gammaEffect: number;      // 0.5 * Gamma * (stock change)^2
  thetaEffect: number;      // Theta * 1 day
  vegaEffect: number;       // Vega * IV change
  rhoEffect: number;        // Rho * rate change
  unexplained: number;      // Residual

  totalPL: number;
}

function decomposeDailyPL(
  yesterdayPosition: PositionSnapshot,
  todayPosition: PositionSnapshot
): DailyPLDecomposition {
  const stockChange = todayPosition.underlyingPrice - yesterdayPosition.underlyingPrice;
  const ivChange = todayPosition.avgIV - yesterdayPosition.avgIV;

  // Using yesterday's Greeks to explain today's P/L
  const greeks = yesterdayPosition.aggregateGreeks;

  return {
    date: todayPosition.date,
    deltaEffect: greeks.delta * stockChange,
    gammaEffect: 0.5 * greeks.gamma * stockChange * stockChange,
    thetaEffect: greeks.theta,  // 1 day of theta
    vegaEffect: greeks.vega * ivChange * 100,  // IV in percentage points
    rhoEffect: 0,  // Negligible for short-term
    unexplained: todayPosition.totalValue - yesterdayPosition.totalValue
                 - (greeks.delta * stockChange)
                 - (0.5 * greeks.gamma * stockChange * stockChange)
                 - greeks.theta
                 - (greeks.vega * ivChange * 100),
    totalPL: todayPosition.totalValue - yesterdayPosition.totalValue
  };
}
```

---

## Visualization System

### P/L Curve Generation

```typescript
interface PLCurveData {
  underlyingPrices: number[];
  scenarios: {
    label: string;
    daysToExpiry: number;
    pl: number[];
    color: string;
  }[];
  breakevens: number[];
  maxProfit: number | null;
  maxLoss: number | null;
  currentPrice: number;
}

function generatePLCurves(
  legs: OptionLeg[],
  currentPrice: number,
  daysToExpiry: number
): PLCurveData {
  // Price range: -30% to +30% of current price
  const minPrice = currentPrice * 0.7;
  const maxPrice = currentPrice * 1.3;
  const step = (maxPrice - minPrice) / 200;

  const underlyingPrices: number[] = [];
  for (let p = minPrice; p <= maxPrice; p += step) {
    underlyingPrices.push(p);
  }

  // Generate scenarios
  const scenarios = [
    { label: 'At Expiration', days: 0, color: '#16A34A' },
    { label: `${Math.floor(daysToExpiry/2)} Days`, days: Math.floor(daysToExpiry/2), color: '#F97316' },
    { label: 'Today', days: daysToExpiry, color: '#3B82F6' }
  ];

  const curveScenarios = scenarios.map(scenario => ({
    label: scenario.label,
    daysToExpiry: scenario.days,
    pl: underlyingPrices.map(price =>
      calculatePositionPL(legs, price, scenario.days, avgIV)
    ),
    color: scenario.color
  }));

  return {
    underlyingPrices,
    scenarios: curveScenarios,
    breakevens: findBreakevens(legs, minPrice, maxPrice),
    maxProfit: calculateMaxProfit(legs),
    maxLoss: calculateMaxLoss(legs),
    currentPrice
  };
}
```

### React Component with Plotly.js

```typescript
// components/PLChart.tsx
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PLChartProps {
  data: PLCurveData;
  height?: number;
}

export function PLChart({ data, height = 400 }: PLChartProps) {
  const traces = data.scenarios.map(scenario => ({
    x: data.underlyingPrices,
    y: scenario.pl,
    type: 'scatter',
    mode: 'lines',
    name: scenario.label,
    line: { color: scenario.color, width: scenario.label === 'At Expiration' ? 3 : 2 },
    hovertemplate: '$%{x:.2f}: %{y:$,.0f}<extra>%{fullData.name}</extra>'
  }));

  // Add zero line
  traces.push({
    x: [data.underlyingPrices[0], data.underlyingPrices[data.underlyingPrices.length - 1]],
    y: [0, 0],
    type: 'scatter',
    mode: 'lines',
    name: 'Breakeven',
    line: { color: '#9CA3AF', width: 1, dash: 'dash' },
    hoverinfo: 'skip'
  });

  // Add current price line
  traces.push({
    x: [data.currentPrice, data.currentPrice],
    y: [Math.min(...data.scenarios.flatMap(s => s.pl)), Math.max(...data.scenarios.flatMap(s => s.pl))],
    type: 'scatter',
    mode: 'lines',
    name: 'Current Price',
    line: { color: '#171717', width: 2, dash: 'dot' },
    hoverinfo: 'skip'
  });

  return (
    <Plot
      data={traces}
      layout={{
        height,
        margin: { l: 60, r: 20, t: 20, b: 40 },
        xaxis: { title: 'Stock Price', tickprefix: '$' },
        yaxis: { title: 'Profit/Loss', tickprefix: '$', zeroline: true },
        showlegend: true,
        legend: { orientation: 'h', y: -0.15 },
        hovermode: 'x unified',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent'
      }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}
```

### Greeks Visualization

```typescript
// components/GreeksDisplay.tsx
interface GreeksDisplayProps {
  greeks: PositionGreeks;
  notional: number;
}

export function GreeksDisplay({ greeks, notional }: GreeksDisplayProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <GreekCard
        name="Delta"
        value={greeks.delta}
        description="$ change per $1 stock move"
        format="shares"
      />
      <GreekCard
        name="Gamma"
        value={greeks.gamma}
        description="Delta change per $1 stock move"
        format="shares"
      />
      <GreekCard
        name="Theta"
        value={greeks.theta}
        description="Daily time decay"
        format="currency"
      />
      <GreekCard
        name="Vega"
        value={greeks.vega}
        description="$ change per 1% IV move"
        format="currency"
      />
      <GreekCard
        name="Rho"
        value={greeks.rho}
        description="$ change per 1% rate move"
        format="currency"
      />
    </div>
  );
}
```

---

## Database Schema

```prisma
// Option leg within a position
model OptionLeg {
  id              String    @id @default(cuid())
  positionId      String
  position        OptionsPosition @relation(fields: [positionId], references: [id], onDelete: Cascade)

  ticker          String
  optionType      OptionType
  strike          Float
  expiration      DateTime
  side            TradeSide
  contracts       Int
  entryPrice      Float
  entryDate       DateTime  @default(now())

  // Entry market context
  entryUnderlyingPrice  Float?
  entryIV               Float?

  // Current values (updated periodically)
  currentPrice    Float?
  currentIV       Float?
  delta           Float?
  gamma           Float?
  theta           Float?
  vega            Float?

  closedAt        DateTime?
  closePrice      Float?
  realizedPL      Float?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([positionId])
  @@index([ticker, expiration])
}

// Multi-leg position
model OptionsPosition {
  id              String    @id @default(cuid())

  ticker          String
  strategyType    StrategyType?
  strategyName    String?   // Custom name from user

  legs            OptionLeg[]

  // Aggregate values (computed)
  totalCost       Float?    // Net debit/credit
  currentValue    Float?
  unrealizedPL    Float?

  // Aggregate Greeks
  netDelta        Float?
  netGamma        Float?
  netTheta        Float?
  netVega         Float?

  // Risk metrics
  maxProfit       Float?
  maxLoss         Float?
  breakevens      Float[]

  status          PositionStatus @default(OPEN)
  openedAt        DateTime  @default(now())
  closedAt        DateTime?

  // Related entries
  entries         Entry[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([ticker])
  @@index([status])
}

// Daily position snapshots for historical analysis
model PositionSnapshot {
  id              String    @id @default(cuid())
  positionId      String

  date            DateTime
  underlyingPrice Float

  // Aggregate values
  marketValue     Float
  unrealizedPL    Float

  // Greeks snapshot
  delta           Float
  gamma           Float
  theta           Float
  vega            Float
  avgIV           Float

  // P/L decomposition
  deltaPL         Float?
  gammaPL         Float?
  thetaPL         Float?
  vegaPL          Float?
  unexplainedPL   Float?

  createdAt       DateTime  @default(now())

  @@unique([positionId, date])
  @@index([positionId])
}

enum OptionType {
  CALL
  PUT
}

enum TradeSide {
  BUY
  SELL
}

enum PositionStatus {
  OPEN
  CLOSED
  EXPIRED
}

enum StrategyType {
  LONG_CALL
  LONG_PUT
  COVERED_CALL
  CASH_SECURED_PUT
  BULL_CALL_SPREAD
  BEAR_CALL_SPREAD
  BULL_PUT_SPREAD
  BEAR_PUT_SPREAD
  IRON_CONDOR
  IRON_BUTTERFLY
  LONG_STRADDLE
  SHORT_STRADDLE
  LONG_STRANGLE
  SHORT_STRANGLE
  CALENDAR_SPREAD
  DIAGONAL_SPREAD
  BUTTERFLY
  CUSTOM
}
```

---

## API Endpoints

### Position Management

```typescript
// Create position with legs
POST /api/positions
{
  ticker: string;
  strategyName?: string;
  legs: {
    optionType: 'CALL' | 'PUT';
    strike: number;
    expiration: string;  // ISO date
    side: 'BUY' | 'SELL';
    contracts: number;
    entryPrice: number;
  }[];
}

// Get position with analysis
GET /api/positions/:id
Response: {
  position: OptionsPosition;
  strategyType: StrategyType;
  plCurve: PLCurveData;
  attributions: LegAttribution[];
  riskMetrics: {
    maxProfit: number | 'unlimited';
    maxLoss: number | 'unlimited';
    breakevens: number[];
    probabilityOfProfit: number;
  };
}

// Get P/L decomposition history
GET /api/positions/:id/history
Response: {
  snapshots: PositionSnapshot[];
  decomposition: DailyPLDecomposition[];
}

// Update position (refresh prices/Greeks)
POST /api/positions/:id/refresh
Response: {
  position: OptionsPosition;
  updatedAt: string;
}

// Close leg(s)
POST /api/positions/:id/close
{
  legIds: string[];
  closePrices: { legId: string; price: number; }[];
}
```

### Analysis Endpoints

```typescript
// Analyze strategy without saving
POST /api/analyze/strategy
{
  ticker: string;
  legs: OptionLegInput[];
}
Response: {
  strategyType: StrategyType;
  aggregateGreeks: PositionGreeks;
  plCurve: PLCurveData;
  riskMetrics: RiskMetrics;
}

// Get AI insights for position
POST /api/analyze/insights
{
  positionId: string;
}
Response: {
  summary: string;
  riskAssessment: string;
  optimizationSuggestions: string[];
  similarHistoricalOutcomes: Entry[];
}
```

---

## Python Pricing Service

Extend the existing yfinance service with options pricing:

```python
# options_service.py additions

from py_vollib.black_scholes import black_scholes as bs
from py_vollib.black_scholes.greeks.analytical import delta, gamma, theta, vega, rho
import numpy as np

RISK_FREE_RATE = 0.05  # 5% - update from Fed funds rate

@app.post("/api/options/price")
async def calculate_option_price(request: OptionPriceRequest):
    """Calculate theoretical option price and Greeks."""
    flag = 'c' if request.option_type == 'CALL' else 'p'
    T = request.days_to_expiry / 365

    try:
        price = bs(flag, request.underlying_price, request.strike, T,
                   RISK_FREE_RATE, request.iv)

        greeks = {
            'delta': delta(flag, request.underlying_price, request.strike, T,
                          RISK_FREE_RATE, request.iv),
            'gamma': gamma(flag, request.underlying_price, request.strike, T,
                          RISK_FREE_RATE, request.iv),
            'theta': theta(flag, request.underlying_price, request.strike, T,
                          RISK_FREE_RATE, request.iv) / 365,  # Daily theta
            'vega': vega(flag, request.underlying_price, request.strike, T,
                        RISK_FREE_RATE, request.iv) / 100,  # Per 1% IV
            'rho': rho(flag, request.underlying_price, request.strike, T,
                      RISK_FREE_RATE, request.iv) / 100  # Per 1% rate
        }

        return {
            'price': round(price, 4),
            'greeks': {k: round(v, 6) for k, v in greeks.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/options/pl-curve")
async def generate_pl_curve(request: PLCurveRequest):
    """Generate P/L curve data for a multi-leg position."""
    min_price = request.current_price * 0.7
    max_price = request.current_price * 1.3
    prices = np.linspace(min_price, max_price, 200)

    scenarios = []
    for days_label, days in [('Expiration', 0), ('Midpoint', request.days_to_expiry // 2), ('Today', request.days_to_expiry)]:
        pl_values = []
        for price in prices:
            total_pl = 0
            for leg in request.legs:
                theoretical = calculate_theoretical_price(
                    leg.option_type, price, leg.strike, days, leg.iv
                )
                direction = 1 if leg.side == 'BUY' else -1
                cost_basis = leg.entry_price * leg.contracts * 100
                current_value = theoretical * leg.contracts * 100
                total_pl += (current_value - cost_basis) * direction
            pl_values.append(total_pl)

        scenarios.append({
            'label': days_label,
            'days': days,
            'pl': [round(v, 2) for v in pl_values]
        })

    # Find breakevens from expiration curve
    breakevens = find_breakevens(prices, scenarios[0]['pl'])

    return {
        'prices': [round(p, 2) for p in prices],
        'scenarios': scenarios,
        'breakevens': breakevens,
        'max_profit': find_max_value(scenarios[0]['pl']),
        'max_loss': find_min_value(scenarios[0]['pl'])
    }
```

---

## UI Components

### Position Builder

```
┌─────────────────────────────────────────┐
│  Build Options Strategy                  │
├─────────────────────────────────────────┤
│  Ticker: [NVDA________]  Price: $138.50 │
│                                         │
│  ── Add Legs ──                         │
│  ┌─────────────────────────────────────┐│
│  │ Type [Call ▼] Strike [140____]      ││
│  │ Exp [Dec 20 ▼] Side [Buy ▼]         ││
│  │ Contracts [1___] @ $[3.50___]       ││
│  │                        [+ Add Leg]   ││
│  └─────────────────────────────────────┘│
│                                         │
│  ── Current Legs ──                     │
│  │ + 1x NVDA 140C 12/20 @ $3.50        │
│  │ - 1x NVDA 145C 12/20 @ $1.80  [x]   │
│                                         │
│  Detected: Bull Call Spread             │
│  Net Debit: $170.00                     │
│                                         │
│  [Save Position]  [Analyze Only]        │
└─────────────────────────────────────────┘
```

### Position Dashboard

```
┌─────────────────────────────────────────┐
│  NVDA Bull Call Spread                  │
│  Net P/L: +$85.00 (+50%)    [Refresh]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │         [P/L CHART]                 ││
│  │    ────────────────────             ││
│  │   /                    \            ││
│  │  /        BE: $141.70   \           ││
│  │ ─────────────────────────           ││
│  │            ↑ $138.50                ││
│  └─────────────────────────────────────┘│
│                                         │
│  ── Greeks ──                           │
│  Δ +32    Γ +2.1    Θ -$8    ν +$45    │
│                                         │
│  ── Legs ──                             │
│  Long 140C:  $4.20 (+$70)  Δ+48 Θ-$12  │
│  Short 145C: $1.95 (+$15)  Δ-16 Θ+$4   │
│                                         │
│  ── Risk ──                             │
│  Max Profit: $330 (at $145+)           │
│  Max Loss: $170 (below $140)           │
│  Breakeven: $141.70                     │
│                                         │
│  [Close Position]  [Journal Entry]      │
└─────────────────────────────────────────┘
```

---

## AI Integration

### Strategy Insights (GPT-5)

```typescript
async function generateStrategyInsights(position: OptionsPosition): Promise<StrategyInsights> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',  // Complex reasoning
    messages: [{
      role: 'user',
      content: `Analyze this options position and provide insights:

        Strategy: ${position.strategyType}
        Ticker: ${position.ticker}
        Current Stock Price: ${currentPrice}

        Legs:
        ${position.legs.map(l =>
          `${l.side} ${l.contracts}x ${l.ticker} ${l.strike}${l.optionType[0]} ${formatDate(l.expiration)} @ $${l.entryPrice}`
        ).join('\n')}

        Greeks:
        Delta: ${position.netDelta}
        Theta: ${position.netTheta}/day
        Vega: ${position.netVega}

        Max Profit: ${position.maxProfit}
        Max Loss: ${position.maxLoss}
        Breakevens: ${position.breakevens.join(', ')}

        Provide:
        1. Strategy summary (1-2 sentences)
        2. Risk assessment (bullish/bearish bias, key risks)
        3. Optimal exit scenarios
        4. Potential adjustments if trade moves against
        5. Historical context (how this strategy performs in current market conditions)`
    }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Journal Integration

When creating a journal entry, detect positions and suggest context:

```typescript
// In entry form, when ticker is detected
if (ticker && hasOpenPosition(ticker)) {
  const position = await getOpenPosition(ticker);
  suggestedContext = {
    hasPosition: true,
    strategyType: position.strategyType,
    currentPL: position.unrealizedPL,
    greeksSnapshot: position.aggregateGreeks,
    suggestedTags: ['position-update', position.strategyType.toLowerCase()]
  };
}
```

---

## Implementation Phases

### Phase 1: Core Pricing Engine (Week 1-2)
- [ ] Install py_vollib in Python service
- [ ] Add `/api/options/price` endpoint
- [ ] Add `/api/options/pl-curve` endpoint
- [ ] Create TypeScript Black-Scholes implementation (fallback)
- [ ] Unit tests for pricing accuracy

### Phase 2: Database & API (Week 2-3)
- [ ] Run Prisma migration for new models
- [ ] Implement position CRUD endpoints
- [ ] Implement strategy detection algorithm
- [ ] Create Greeks aggregation service
- [ ] Add breakeven calculation

### Phase 3: Visualization (Week 3-4)
- [ ] Install react-plotly.js
- [ ] Create PLChart component
- [ ] Create GreeksDisplay component
- [ ] Create position builder UI
- [ ] Create position dashboard page

### Phase 4: Attribution & Insights (Week 4-5)
- [ ] Implement leg attribution calculations
- [ ] Create daily snapshot cron job
- [ ] Implement P/L decomposition
- [ ] Add GPT-5 insights generation
- [ ] Create history/decomposition view

### Phase 5: Integration (Week 5-6)
- [ ] Connect positions to journal entries
- [ ] Add position context to entry form
- [ ] Create position-related tags
- [ ] End-to-end testing
- [ ] Performance optimization

---

## Cost Estimates

| Component | Usage | Monthly Cost |
|-----------|-------|-------------|
| GPT-5 (insights) | 50 analyses | $0.15 |
| GPT-5 Nano (detection) | 200 operations | $0.02 |
| Python service | Railway hosting | $5.00 |
| yfinance | Free tier | $0.00 |
| **Total** | | **~$5.17/month** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Pricing accuracy vs real market | High | Validate against brokerage prices; show "theoretical" disclaimer |
| Complex strategy edge cases | Medium | Start with common strategies; mark unknown as "Custom" |
| Performance on large positions | Medium | Cache calculations; lazy load P/L curves |
| yfinance data delays | Low | Show data timestamp; allow manual price override |

---

## Success Criteria

**MVP (Launch):**
- [ ] Accurate pricing for single-leg options (within 2% of market)
- [ ] Support for top 10 strategy types
- [ ] P/L curve visualization working
- [ ] Greeks aggregation accurate
- [ ] Position linked to journal entries

**Post-MVP (30 days):**
- [ ] P/L attribution matching brokerage within 5%
- [ ] AI insights rated helpful by 70%+ users
- [ ] 50%+ of options-related entries linked to positions
- [ ] < 500ms calculation time for 4-leg strategies
