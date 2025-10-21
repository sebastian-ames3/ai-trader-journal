# Product Roadmap

## MVP Features (Current Phase)

1. [ ] Real API Integration for Price Data — Replace mock data system with actual financial data API (yfinance or alternative) to fetch real historical prices for HV calculations and ticker search. Includes error handling, rate limiting, and caching strategy. `M`

2. [ ] Trade Entry Flow — Complete end-to-end trade entry interface allowing users to search ticker, select option contract, enter trade details (strike, expiration, premium, quantity), view IV/HV analysis, and save trade to database with snapshot. `L`

3. [ ] Trade List and Detail Views — Display all user trades in a filterable, sortable list with summary cards showing key metrics (ticker, P&L, IV/HV at entry). Include detailed trade view showing complete snapshot data, Greeks, and market conditions at entry. `M`

4. [ ] Risk-Based Position Sizing Calculator — Interactive calculator that accepts account size, risk percentage (e.g., 2%), and option premium to recommend contract quantity. Include validation and real-time updates as user adjusts inputs. `S`

5. [ ] Tag and Note Management — Allow users to add, edit, and delete tags on trades for categorization (strategy types, market conditions). Enable adding journal notes to trades with timestamp tracking. Include tag filtering in trade list view. `S`

6. [ ] Mobile Responsive Design Polish — Refine mobile-first UI to ensure optimal experience on iOS/Android devices. Focus on touch targets, readable typography, efficient data entry, and performance optimization for mobile networks. `M`

## Phase 2: Enhanced Analytics

7. [ ] Trade Performance Dashboard — Overview dashboard showing aggregate P&L, win rate, average return, and performance breakdown by tag/strategy. Include charts visualizing performance over time and by volatility regime. `L`

8. [ ] IV/HV Historical Charts — Interactive charts showing IV and HV trends over time for specific tickers. Allow users to see how current IV/HV compares to historical ranges (30-day, 90-day, 1-year). `M`

9. [ ] Options Chain Data Capture — Capture and store complete options chain data (strikes, bid/ask, volume, open interest) at trade entry. Display in trade detail view for post-trade analysis of liquidity and pricing conditions. `L`

10. [ ] Advanced Filtering and Search — Enable complex trade filtering by date range, ticker, tag, strategy, IV/HV ratio, P&L status, and custom criteria. Include saved filter presets for common queries. `M`

## Phase 3: Intelligence and Automation

11. [ ] Volatility Threshold Alerts — Allow users to set custom IV/HV ratio thresholds for specific tickers (e.g., alert when AAPL IV/HV > 1.3). Send notifications when conditions are met. Include alert management dashboard. `L`

12. [ ] Trade Pattern Recognition — Analyze historical trades to identify patterns in winning vs losing trades based on entry conditions (IV/HV ratios, days to expiration, strike selection). Surface insights to user as recommendations. `XL`

> Notes
> - Each item represents a complete, testable feature with frontend and backend implementation
> - Features ordered by technical dependencies and value delivery
> - MVP focuses on core volatility analysis and trade journaling workflows
> - Phase 2 adds analytical depth for pattern identification
> - Phase 3 introduces intelligence and proactive features
> - Real API integration is critical first step to move beyond mock data
