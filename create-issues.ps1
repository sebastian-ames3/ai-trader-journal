# create-issues.ps1
# Save this file in your project directory and run: ./create-issues.ps1

Write-Host "Creating GitHub issues for AI Trader Journal..." -ForegroundColor Green
Write-Host "This will create 10 issues (skipping #1 and #2 which are complete)" -ForegroundColor Yellow

# Create issues one by one with details
$issueCount = 0

# Issue #3
Write-Host "`nCreating Issue #3..." -ForegroundColor Cyan
gh issue create --title "Ticker Entry & Market Data Fetching" --body "**Labels:** feature, UX
**Milestone:** Core Trading Features

### Description
Implement the ticker entry UI and yfinance integration for fetching basic market data.

### Acceptance Criteria
- [ ] Mobile-optimized ticker search/entry component
- [ ] yfinance API integration for price, volume data
- [ ] Loading states and error handling
- [ ] Caching layer for API responses
- [ ] Auto-complete for common tickers
- [ ] Display current price, day change, volume" --label "enhancement"
$issueCount++

# Issue #4
Write-Host "Creating Issue #4..." -ForegroundColor Cyan
gh issue create --title "Historical Volatility (HV) Calculator" --body "**Labels:** feature, data
**Milestone:** Core Trading Features

### Description
Implement automated HV20/HV30 calculation from historical price data.

### Acceptance Criteria
- [ ] Fetch 30+ days of historical prices via yfinance
- [ ] Calculate HV20 (20-day historical volatility)
- [ ] Calculate HV30 (30-day historical volatility)
- [ ] Display HV values with proper formatting
- [ ] Handle edge cases (insufficient data, weekends/holidays)
- [ ] Unit tests with known HV values" --label "enhancement"
$issueCount++

# Issue #5
Write-Host "Creating Issue #5..." -ForegroundColor Cyan
gh issue create --title "Manual IV Entry UI" --body "**Labels:** feature, UX
**Milestone:** Core Trading Features

### Description
Create the manual IV entry interface with validation and persistence.

### Acceptance Criteria
- [ ] Numeric input with decimal support
- [ ] Validation (0-999% reasonable range)
- [ ] Clear labeling and helper text
- [ ] Save IV with timestamp
- [ ] Display last entered IV
- [ ] Quick-fill from clipboard support" --label "enhancement"
$issueCount++

# Issue #6
Write-Host "Creating Issue #6..." -ForegroundColor Cyan
gh issue create --title "IV/HV Comparison Card" --body "**Labels:** feature, UX
**Milestone:** Core Trading Features

### Description
Build the primary IV vs HV visualization card for mobile display.

### Acceptance Criteria
- [ ] Display IV, HV20, HV30 prominently
- [ ] Calculate and show IV/HV ratio
- [ ] Visual indicators (color coding for high/low)
- [ ] Interpretation text (e.g., 'IV is 30% higher than HV')
- [ ] Responsive design for various screen sizes
- [ ] Export/share functionality" --label "enhancement"
$issueCount++

# Issue #7
Write-Host "Creating Issue #7..." -ForegroundColor Cyan
gh issue create --title "Options Chain Display" --body "**Labels:** feature, data
**Milestone:** Core Trading Features

### Description
Fetch and display options chain data with liquidity indicators.

### Acceptance Criteria
- [ ] Fetch chain data via yfinance
- [ ] Display bid/ask spreads
- [ ] Show open interest and volume
- [ ] Highlight liquid vs illiquid strikes
- [ ] Mobile-optimized table/card view
- [ ] Filter by expiration date" --label "enhancement"
$issueCount++

# Issue #8
Write-Host "Creating Issue #8..." -ForegroundColor Cyan
gh issue create --title "Risk-Based Position Sizing" --body "**Labels:** feature
**Milestone:** Core Trading Features

### Description
Implement the risk-based position sizing calculator.

### Acceptance Criteria
- [ ] Input: account size, risk percentage, option price
- [ ] Calculate maximum contracts based on risk
- [ ] Display position size with total risk amount
- [ ] Save risk parameters with trade
- [ ] Preset risk levels (1%, 2%, 5%)
- [ ] Visual risk gauge" --label "enhancement"
$issueCount++

# Issue #9
Write-Host "Creating Issue #9..." -ForegroundColor Cyan
gh issue create --title "Trade Entry & Snapshot" --body "**Labels:** feature, data
**Milestone:** Journal Features

### Description
Create the trade entry form with full context snapshot capability.

### Acceptance Criteria
- [ ] Multi-leg trade support
- [ ] Capture all required fields per MVP spec
- [ ] Auto-populate from ticker analysis
- [ ] Tags and rationale text input
- [ ] Save complete snapshot to database
- [ ] Confirmation and review before save
- [ ] UUID generation for trades" --label "enhancement"
$issueCount++

# Issue #10
Write-Host "Creating Issue #10..." -ForegroundColor Cyan
gh issue create --title "Go/No-Go Precheck System" --body "**Labels:** feature
**Milestone:** Risk Management

### Description
Build the pre-trade validation system with configurable rules.

### Acceptance Criteria
- [ ] Check liquidity thresholds
- [ ] Flag extreme IV levels
- [ ] Warn on wide bid/ask spreads
- [ ] Detect upcoming events (earnings, etc.)
- [ ] Display all warnings clearly
- [ ] Allow override with reason
- [ ] Log precheck results" --label "enhancement"
$issueCount++

# Issue #11
Write-Host "Creating Issue #11..." -ForegroundColor Cyan
gh issue create --title "Journal Search & Filter" --body "**Labels:** feature, UX
**Milestone:** Journal Features

### Description
Implement search and filtering for the trade journal.

### Acceptance Criteria
- [ ] Full-text search across trades/notes
- [ ] Filter by date range
- [ ] Filter by tags
- [ ] Filter by strategy type
- [ ] Filter by P&L status
- [ ] Sort options (date, P&L, ticker)
- [ ] Saved filter sets" --label "enhancement"
$issueCount++

# Issue #12
Write-Host "Creating Issue #12..." -ForegroundColor Cyan
gh issue create --title "CSV/Markdown Import" --body "**Labels:** feature, data
**Milestone:** Data Migration

### Description
Build importers for legacy journal data from CSV and Markdown files.

### Acceptance Criteria
- [ ] CSV parser with field mapping UI
- [ ] Markdown parser for note entries
- [ ] Preview before import
- [ ] Validation and error reporting
- [ ] Duplicate detection
- [ ] Progress indicator for large imports
- [ ] Rollback capability" --label "enhancement"
$issueCount++

Write-Host "`n✅ Success! Created $issueCount issues." -ForegroundColor Green
Write-Host "View them at: https://github.com/sebastian-ames3/ai-trader-journal/issues" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Start with Issue #3 (Ticker Search)" -ForegroundColor White
Write-Host "2. Create branch: git checkout -b feat/ticker-search" -ForegroundColor White
Write-Host "3. Begin coding!" -ForegroundColor White