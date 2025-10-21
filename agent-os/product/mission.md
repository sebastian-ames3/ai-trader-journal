# Product Mission

## Pitch
AI Trader Journal is a mobile-first options trading journal that helps retail options traders make data-driven trading decisions by providing intelligent volatility analysis that reveals whether options are overpriced or undervalued, enabling traders to consistently identify high-probability trades and manage risk scientifically.

## Users

### Primary Customers
- **Retail Options Traders**: Individual investors actively trading options who need systematic trade tracking and market analysis to improve consistency
- **Swing Traders**: Traders holding positions for days to weeks who analyze volatility conditions to time entries and exits
- **Risk-Conscious Investors**: Traders who prioritize position sizing and risk management over arbitrary trade sizing

### User Personas

**Active Options Trader** (25-45 years old)
- **Role:** Self-directed retail investor trading options 2-5 times per week
- **Context:** Managing personal capital ($10K-$250K) across multiple brokerage accounts, seeking to improve win rates and reduce emotional decision-making
- **Pain Points:** Can't easily compare whether current IV is high or low relative to historical norms; difficult to track what worked and what didn't across dozens of trades; position sizing is guesswork; no systematic way to journal market conditions at entry
- **Goals:** Identify overpriced options to sell premium profitably; avoid buying expensive options; track trading performance with full market context; size positions based on account risk rather than arbitrary share counts

**Volatility-Focused Trader** (30-55 years old)
- **Role:** Options trader specializing in volatility strategies (iron condors, strangles, credit spreads)
- **Context:** Running premium-selling strategies that profit from IV/HV mispricings; needs to quickly assess whether IV is elevated relative to realized volatility
- **Pain Points:** Manual IV/HV comparison is tedious and error-prone; historical volatility requires downloading price data and spreadsheet calculations; can't easily track which IV conditions led to profitable trades
- **Goals:** Systematically identify when IV is inflated vs HV to sell premium; journal trades with complete volatility metrics to refine edge; build a database of what volatility conditions work best for their strategies

## The Problem

### Volatility Analysis is Critical but Inaccessible
Options traders know that comparing Implied Volatility (IV) to Historical Volatility (HV) is essential for determining whether options are overpriced or undervalued. However, most traders lack tools that make this analysis easy. Professional platforms like Bloomberg Terminal cost $20,000+ annually, while retail platforms either don't provide HV data or bury it deep in complex interfaces. As a result, retail traders either skip volatility analysis entirely (leaving edge on the table) or manually calculate HV in spreadsheets (time-consuming and error-prone).

**Our Solution:** AI Trader Journal automatically calculates HV20 and HV30 for any ticker and allows manual IV entry with instant comparison, providing institutional-grade volatility analysis in a mobile-first interface designed for retail traders.

### Trade Journaling Lacks Market Context
Most trade journals focus on basic P&L tracking but fail to capture the market conditions that existed when a trade was opened. Without recording IV levels, HV ratios, and pricing context at entry, traders can't systematically learn what conditions lead to winning trades. They're forced to rely on memory or incomplete notes, making it impossible to identify patterns or refine their edge.

**Our Solution:** AI Trader Journal creates comprehensive snapshots at trade entry, capturing IV/HV metrics, Greeks, options chain data, and market conditions. This enables traders to review what worked and build a systematic edge based on data, not gut feel.

### Position Sizing is Arbitrary and Risky
Most traders size positions by asking "how many contracts can I afford?" rather than "what position size aligns with my risk tolerance?" This leads to oversized positions during bull markets and undersized positions when opportunities arise. Without account-level risk management, traders either blow up accounts or miss opportunities.

**Our Solution:** AI Trader Journal enables position sizing based on account risk percentage, ensuring consistent risk exposure across all trades regardless of premium price or account size.

## Differentiators

### Automatic HV Calculation
Unlike basic trade journals that only track P&L, we automatically calculate Historical Volatility (HV20 and HV30) for any ticker using close-to-close log returns methodology. This eliminates manual spreadsheet work and provides instant context for IV analysis.

### IV/HV Comparison at Trade Entry
Unlike most platforms that show IV and HV separately, we directly compare them and highlight whether options are overpriced (IV > HV, good for selling premium) or undervalued (IV < HV, potentially good for buying). This results in faster decision-making and clearer edge identification.

### Comprehensive Market Snapshots
Unlike simple trade logs, we capture complete market state at entry including IV data, HV calculations, Greeks, options chain data, and pricing. This enables traders to retrospectively analyze what conditions led to winning trades, building systematic edge over time.

### Mobile-First Volatility Analysis
Unlike desktop-only platforms like Bloomberg Terminal or ThinkOrSwim, we're designed mobile-first so traders can perform IV/HV analysis and journal trades from anywhere. This results in real-time journaling when ideas strike, not end-of-day data entry.

### Risk-Based Position Sizing
Unlike arbitrary "buy 10 contracts" thinking, we enable position sizing based on account risk percentage. This results in consistent risk exposure and protection against oversized positions that can devastate accounts.

## Key Features

### Core Features
- **Automatic HV Calculation:** Calculate Historical Volatility (HV20 and HV30) for any ticker using close-to-close log returns, providing institutional-grade volatility metrics without manual spreadsheet work
- **Manual IV Entry with Persistence:** Enter Implied Volatility manually with validation (0.1%-400% range) and persist it to the database linked to specific trades
- **IV/HV Comparison Analysis:** Visual comparison showing whether options are overpriced (IV > HV) or undervalued (IV < HV), with color-coded badges for instant recognition
- **Trade Tracking with Market Context:** Comprehensive trade records storing entry details, market conditions, volatility metrics, and Greeks at the moment of trade entry

### Collaboration Features
- **Tags and Categories:** Organize trades by strategy type (credit spreads, iron condors, long calls, etc.) or market conditions (high IV, earnings, technical breakout) for pattern analysis
- **Journal Notes:** Attach detailed notes to trades documenting thesis, market sentiment, and lessons learned for future review
- **Historical Trade Review:** Review past trades with complete market context to identify what conditions led to profitable outcomes

### Advanced Features
- **Risk-Based Position Sizing:** Calculate position sizes based on account risk percentage rather than arbitrary contract counts, ensuring consistent risk exposure
- **Volatility Threshold Alerts:** Set custom IV/HV ratio thresholds and receive alerts when specific tickers meet criteria for premium selling or buying opportunities
- **Options Chain Data Snapshots:** Capture complete options chain data at trade entry for detailed post-trade analysis of bid/ask spreads and liquidity conditions
- **Performance Analytics by Volatility Regime:** Analyze trade performance segmented by IV/HV conditions to identify optimal volatility environments for different strategies
