# PRD: Social/Mentor Sharing System

## Overview

**Problem Statement:**
Traders often work in isolation, missing opportunities for accountability, external perspective, and mentorship. Sharing raw journal entries feels too personal, while P/L screenshots lack psychological context.

**Solution:**
A privacy-first sharing system that allows traders to share curated insights, anonymized entries, and progress reports with mentors, accountability partners, or trading communities.

**Success Metrics:**
- 30%+ of users create at least one share link
- Mentor-mentee connections average 2+ interactions/week
- Users with accountability partners show 40% better streak retention
- Zero privacy incidents (no unintended data exposure)

---

## Core Principles

### Privacy-First Design
1. **Opt-in only**: Nothing shared without explicit action
2. **Granular control**: Share specific entries, not entire journal
3. **Anonymization**: Strip sensitive data by default
4. **Revocable**: All shares can be disabled instantly
5. **Expiring links**: Optional auto-expiration

### Sharing Hierarchy
```
Level 1: Public Stats (Anonymous)
├── Win rate, streak length, bias distribution
├── No specific trades, tickers, or amounts
└── Leaderboard-safe

Level 2: Curated Insights (Semi-Private)
├── Selected entries with redacted P/L
├── Patterns and insights (anonymized)
└── For trading communities

Level 3: Mentor Access (Private)
├── Full entries with context
├── P/L data included
├── Read-only or comment-enabled
└── For trusted mentors only

Level 4: Full Export (Personal)
├── Complete data export
├── For backup/migration
└── Owner only
```

---

## User Stories

### Accountability Partners
1. As a trader, I want to share my journaling streak with a friend so we can hold each other accountable.
2. As a trader, I want to see when my accountability partner journals so I stay motivated.
3. As a trader, I want to compare our bias distributions without revealing specific trades.

### Mentor Sharing
4. As a mentee, I want to share specific entries with my mentor for feedback.
5. As a mentor, I want to see my mentee's patterns over time without accessing every entry.
6. As a mentor, I want to leave comments on shared entries.
7. As a mentee, I want to revoke mentor access if the relationship ends.

### Community Sharing
8. As a trader, I want to share my weekly insights (anonymized) on Twitter/Discord.
9. As a trader, I want to generate a shareable image of my streak or stats.
10. As a trader, I want to share a specific insight without revealing my full journal.

---

## Feature Specifications

### 1. Share Link System

**Link Types:**
```typescript
enum ShareType {
  SINGLE_ENTRY = 'single_entry',      // One specific entry
  ENTRY_COLLECTION = 'collection',    // Multiple selected entries
  WEEKLY_INSIGHTS = 'weekly',         // Weekly insights view
  STATS_SUMMARY = 'stats',            // Anonymous statistics
  MENTOR_ACCESS = 'mentor',           // Ongoing mentor view
  ACCOUNTABILITY = 'accountability'   // Mutual streak tracking
}

interface ShareLink {
  id: string;
  userId: string;
  type: ShareType;

  // Content
  entryIds?: string[];        // For entry-based shares
  weekOffset?: number;        // For weekly insights
  includeFields: string[];    // Which fields to include

  // Access control
  accessCode?: string;        // Optional password
  recipientEmail?: string;    // For tracking
  expiresAt?: Date;
  maxViews?: number;
  viewCount: number;

  // Privacy settings
  redactPL: boolean;
  redactTickers: boolean;
  redactDates: boolean;
  anonymize: boolean;

  // Status
  isActive: boolean;
  createdAt: Date;
}
```

**Share URL Structure:**
```
https://traderjournal.app/share/{shareId}
https://traderjournal.app/share/{shareId}?code={accessCode}
```

### 2. Entry Sharing Interface

```
┌─────────────────────────────────────────┐
│  Share Entry                     [×]    │
├─────────────────────────────────────────┤
│                                         │
│  Entry: "NVDA breakout thesis..."       │
│  Date: Dec 5, 2025                      │
│                                         │
│  ── Privacy Options ──                  │
│                                         │
│  [✓] Redact P/L amounts                 │
│  [ ] Redact ticker symbols              │
│  [✓] Show mood and conviction           │
│  [✓] Include AI insights                │
│                                         │
│  ── Preview ──                          │
│  ┌─────────────────────────────────────┐│
│  │ 📝 Trade Idea • Confident • High   ││
│  │                                      ││
│  │ "Looking at [TICKER] breakout...    ││
│  │ Target: [REDACTED]                   ││
│  │                                      ││
│  │ AI Tags: #bullish #breakout          ││
│  └─────────────────────────────────────┘│
│                                         │
│  ── Access Settings ──                  │
│                                         │
│  Expires: [Never ▼]                     │
│  Password: [________] (optional)        │
│                                         │
│  [Create Share Link]                    │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Mentor Dashboard

**Mentor View:**
```
┌─────────────────────────────────────────┐
│  Mentees                         [+Add] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 👤 Alex T.                          ││
│  │ Connected: 3 weeks ago              ││
│  │ Last active: 2 hours ago            ││
│  │                                      ││
│  │ Stats (past 7 days):                ││
│  │ • 12 entries • 5-day streak         ││
│  │ • Top bias: Confirmation            ││
│  │ • Mood trend: Improving ↗           ││
│  │                                      ││
│  │ [View Shared]  [Message]            ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 👤 Jordan M.                        ││
│  │ Connected: 1 month ago              ││
│  │ Last active: 3 days ago ⚠️          ││
│  │                                      ││
│  │ Stats (past 7 days):                ││
│  │ • 2 entries • Streak broken         ││
│  │ • Top bias: FOMO                    ││
│  │ • Mood trend: Declining ↘           ││
│  │                                      ││
│  │ [View Shared]  [Check In]           ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

**Mentee View:**
```
┌─────────────────────────────────────────┐
│  Mentor Access                          │
├─────────────────────────────────────────┤
│                                         │
│  Connected to: Sarah K. (Mentor)        │
│  Since: Nov 15, 2025                    │
│                                         │
│  ── Sharing Permissions ──              │
│                                         │
│  [✓] Weekly insights summary            │
│  [✓] Bias patterns & trends             │
│  [ ] Individual entries (ask first)     │
│  [ ] P/L data                           │
│                                         │
│  ── Shared Entries (5) ──               │
│                                         │
│  • Dec 5: NVDA thesis [Unshare]        │
│  • Dec 3: Loss reflection [Unshare]    │
│  • Nov 28: Monthly review [Unshare]    │
│                                         │
│  [Manage Access] [Disconnect]           │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Accountability Partners

**Mutual Streak Tracking:**
```typescript
interface AccountabilityPair {
  id: string;
  user1Id: string;
  user2Id: string;

  // What's shared
  shareStreak: boolean;
  shareEntryCount: boolean;
  shareBiasDistribution: boolean;
  shareMoodTrend: boolean;

  // Notifications
  notifyOnJournal: boolean;      // "Alex just journaled!"
  notifyOnStreakMilestone: boolean;
  notifyOnStreakBreak: boolean;

  // Status
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  createdAt: Date;
}
```

**Partner Widget:**
```
┌─────────────────────────────────────────┐
│  Accountability Partner                 │
├─────────────────────────────────────────┤
│                                         │
│     You          vs         Alex        │
│   🔥 12 days              🔥 8 days     │
│                                         │
│  This week:                             │
│     You: ✓ ✓ ✓ ✓ ✓        Alex: ✓ ✓ ✓ - │
│                                         │
│  💪 You're ahead! Keep it up.          │
│                                         │
│  [Nudge Alex]  [View Comparison]        │
│                                         │
└─────────────────────────────────────────┘
```

### 5. Social Image Generation

**Shareable Stats Card:**
```typescript
interface ShareableImage {
  type: 'streak' | 'weekly' | 'milestone' | 'custom';
  data: {
    stat: string;       // "12-day streak"
    subtitle?: string;  // "Trading Psychology Journal"
    icon?: string;      // Emoji or icon
    color?: string;     // Theme color
  };
  dimensions: {
    width: number;   // 1200 for Twitter
    height: number;  // 675 for Twitter
  };
}
```

**Generated Image Example:**
```
┌─────────────────────────────────────────┐
│                                         │
│     🔥 12-Day Journaling Streak         │
│                                         │
│     ████████████░░░░░░░░                │
│     60% to my 20-day goal               │
│                                         │
│     AI Trader Journal                   │
│     traderjournal.app                   │
│                                         │
└─────────────────────────────────────────┘
```

### 6. Community Integration

**Discord Integration:**
```typescript
// Webhook for posting achievements
interface DiscordWebhook {
  id: string;
  userId: string;
  webhookUrl: string;

  triggers: {
    onStreakMilestone: boolean;    // 7, 14, 30, 60, 90 days
    onWeeklyInsights: boolean;     // Post weekly summary
    onPatternBreak: boolean;       // "Broke my FOMO pattern!"
  };

  anonymize: boolean;
  includeStats: boolean;
}

async function postToDiscord(webhook: DiscordWebhook, event: ShareEvent) {
  const embed = buildDiscordEmbed(event, webhook.anonymize);

  await fetch(webhook.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
}
```

---

## Database Schema

```prisma
// Share links
model ShareLink {
  id            String    @id @default(cuid())
  userId        String

  type          ShareType
  slug          String    @unique  // URL-friendly ID

  // Content references
  entryIds      String[]
  weekOffset    Int?
  includeFields String[]

  // Access control
  accessCode    String?   // Hashed if set
  recipientEmail String?
  expiresAt     DateTime?
  maxViews      Int?
  viewCount     Int       @default(0)

  // Privacy
  redactPL      Boolean   @default(true)
  redactTickers Boolean   @default(false)
  redactDates   Boolean   @default(false)
  anonymize     Boolean   @default(false)

  // Status
  isActive      Boolean   @default(true)
  lastViewedAt  DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([slug])
}

// Mentor relationships
model MentorRelationship {
  id            String    @id @default(cuid())

  mentorId      String
  menteeId      String

  // Permissions (what mentee shares)
  shareWeeklyInsights Boolean @default(true)
  shareBiasPatterns   Boolean @default(true)
  shareIndividualEntries Boolean @default(false)
  sharePLData         Boolean @default(false)

  // Shared entries (explicit shares)
  sharedEntryIds String[]

  // Communication
  lastInteraction DateTime?
  messageCount    Int       @default(0)

  status        RelationshipStatus @default(PENDING)
  requestedBy   String    // Who initiated

  createdAt     DateTime  @default(now())
  acceptedAt    DateTime?
  endedAt       DateTime?

  @@unique([mentorId, menteeId])
  @@index([mentorId])
  @@index([menteeId])
}

// Mentor comments on shared entries
model MentorComment {
  id            String    @id @default(cuid())
  relationshipId String
  entryId       String

  authorId      String    // Mentor or mentee
  content       String

  createdAt     DateTime  @default(now())

  @@index([entryId])
}

// Accountability partnerships
model AccountabilityPair {
  id            String    @id @default(cuid())

  user1Id       String
  user2Id       String

  // Sharing settings
  shareStreak           Boolean @default(true)
  shareEntryCount       Boolean @default(true)
  shareBiasDistribution Boolean @default(false)
  shareMoodTrend        Boolean @default(false)

  // Notifications
  notifyOnJournal       Boolean @default(true)
  notifyOnMilestone     Boolean @default(true)
  notifyOnStreakBreak   Boolean @default(false)

  status        PairStatus @default(PENDING)
  requestedBy   String

  createdAt     DateTime  @default(now())
  acceptedAt    DateTime?

  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
}

// Discord webhooks
model DiscordWebhook {
  id            String    @id @default(cuid())
  userId        String

  webhookUrl    String
  serverId      String?   // For tracking
  channelName   String?

  // Triggers
  onStreakMilestone Boolean @default(true)
  onWeeklyInsights  Boolean @default(false)
  onPatternBreak    Boolean @default(false)

  anonymize     Boolean   @default(true)
  includeStats  Boolean   @default(false)

  isActive      Boolean   @default(true)
  lastUsedAt    DateTime?

  createdAt     DateTime  @default(now())

  @@index([userId])
}

enum ShareType {
  SINGLE_ENTRY
  ENTRY_COLLECTION
  WEEKLY_INSIGHTS
  STATS_SUMMARY
  MENTOR_ACCESS
  ACCOUNTABILITY
}

enum RelationshipStatus {
  PENDING
  ACTIVE
  PAUSED
  ENDED
}

enum PairStatus {
  PENDING
  ACTIVE
  PAUSED
  ENDED
}
```

---

## API Endpoints

### Share Links

```typescript
// Create share link
POST /api/share/links
{
  type: ShareType;
  entryIds?: string[];
  weekOffset?: number;
  settings: {
    redactPL?: boolean;
    redactTickers?: boolean;
    expiresIn?: number;  // hours
    maxViews?: number;
    accessCode?: string;
  };
}
Response: {
  link: ShareLink;
  url: string;
}

// Get share link content (public)
GET /api/share/links/:slug
Query: ?code={accessCode}
Response: {
  type: ShareType;
  content: SharedContent;
  viewCount: number;
}

// List user's share links
GET /api/share/links
Response: {
  links: ShareLink[];
}

// Revoke share link
DELETE /api/share/links/:id
```

### Mentor Relationships

```typescript
// Invite mentor
POST /api/mentors/invite
{
  mentorEmail: string;
  permissions: MentorPermissions;
}
Response: {
  relationship: MentorRelationship;
  inviteLink: string;
}

// Accept mentor invite
POST /api/mentors/accept
{
  inviteToken: string;
}

// Get mentor dashboard
GET /api/mentors/dashboard
Response: {
  mentees: MenteeOverview[];
}

// Get mentee's shared content (as mentor)
GET /api/mentors/mentees/:menteeId
Response: {
  overview: MenteeOverview;
  sharedEntries: Entry[];
  weeklyInsights: WeeklyInsights[];
}

// Add comment on shared entry
POST /api/mentors/comments
{
  entryId: string;
  content: string;
}

// End relationship
DELETE /api/mentors/relationships/:id
```

### Accountability

```typescript
// Invite accountability partner
POST /api/accountability/invite
{
  partnerEmail: string;
  settings: AccountabilitySettings;
}

// Get partner status
GET /api/accountability/partner
Response: {
  partner: AccountabilityPair;
  yourStats: Stats;
  partnerStats: Stats;
}

// Nudge partner
POST /api/accountability/nudge
{
  message?: string;
}

// Update settings
PATCH /api/accountability/settings
{
  shareStreak?: boolean;
  notifyOnJournal?: boolean;
  // etc.
}
```

### Social Images

```typescript
// Generate shareable image
POST /api/share/image
{
  type: 'streak' | 'weekly' | 'milestone';
  customText?: string;
}
Response: {
  imageUrl: string;  // Temporary URL
  dimensions: { width: number; height: number };
}
```

---

## Security Considerations

### Access Control

```typescript
// Middleware for share link access
async function validateShareAccess(
  slug: string,
  providedCode?: string
): Promise<ShareLink | null> {
  const link = await prisma.shareLink.findUnique({ where: { slug } });

  if (!link || !link.isActive) return null;

  // Check expiration
  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { isActive: false }
    });
    return null;
  }

  // Check view limit
  if (link.maxViews && link.viewCount >= link.maxViews) {
    return null;
  }

  // Check access code
  if (link.accessCode) {
    if (!providedCode) return null;
    const valid = await bcrypt.compare(providedCode, link.accessCode);
    if (!valid) return null;
  }

  // Increment view count
  await prisma.shareLink.update({
    where: { id: link.id },
    data: { viewCount: { increment: 1 }, lastViewedAt: new Date() }
  });

  return link;
}
```

### Data Redaction

```typescript
function redactEntry(entry: Entry, settings: RedactionSettings): RedactedEntry {
  const redacted = { ...entry };

  if (settings.redactPL) {
    redacted.content = redacted.content.replace(
      /\$[\d,]+(\.\d{2})?/g,
      '[REDACTED]'
    );
    // Also redact percentage gains/losses
    redacted.content = redacted.content.replace(
      /[+-]?\d+(\.\d+)?%/g,
      '[X%]'
    );
  }

  if (settings.redactTickers) {
    redacted.ticker = null;
    redacted.content = redacted.content.replace(
      /\$?[A-Z]{1,5}\b/g,
      '[TICKER]'
    );
  }

  if (settings.redactDates) {
    redacted.createdAt = null;
    redacted.updatedAt = null;
  }

  if (settings.anonymize) {
    redacted.id = generateAnonymousId();
  }

  return redacted;
}
```

---

## UI Components

### Share Button (Entry Card)

```
┌─────────────────────────────────────────┐
│  Trade Idea • NVDA • Confident          │
│                                         │
│  "Looking at NVDA breakout..."          │
│                                         │
│  [Edit] [Delete] [Share ↗]              │
└─────────────────────────────────────────┘
```

### Share Modal

```
┌─────────────────────────────────────────┐
│  Share This Entry              [×]      │
├─────────────────────────────────────────┤
│                                         │
│  [🔗 Copy Link]  [📱 Share to...]       │
│                                         │
│  ── Privacy ──                          │
│  [✓] Hide dollar amounts                │
│  [ ] Hide ticker symbol                 │
│  [✓] Show mood & conviction             │
│                                         │
│  ── Access ──                           │
│  Expires: [1 week ▼]                    │
│  Password: [optional]                   │
│                                         │
│  ── Or Share With ──                    │
│  [👤 My Mentor]  [🤝 Partner]           │
│                                         │
└─────────────────────────────────────────┘
```

### Partner Comparison

```
┌─────────────────────────────────────────┐
│  You vs Alex (This Week)                │
├─────────────────────────────────────────┤
│                                         │
│  Entries:    12  ████████░░   8         │
│  Streak:    12d  ████████░░  8d         │
│  Avg Mood:  7.2  ████████░░  6.8        │
│                                         │
│  You're journaling 50% more! 🎉         │
│                                         │
│  [Send Encouragement]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Share Links (Week 1-2)
- [ ] Create ShareLink database schema
- [ ] Implement share link creation API
- [ ] Build public share viewer page
- [ ] Add share button to entry cards
- [ ] Implement redaction logic

### Phase 2: Mentor System (Week 2-3)
- [ ] Create mentor relationship schema
- [ ] Build mentor invite flow
- [ ] Create mentor dashboard
- [ ] Implement shared entry viewing
- [ ] Add commenting system

### Phase 3: Accountability (Week 3-4)
- [ ] Create accountability pair schema
- [ ] Build partner invite flow
- [ ] Create partner comparison widget
- [ ] Implement nudge notifications
- [ ] Add streak comparison

### Phase 4: Social Features (Week 4-5)
- [ ] Build image generation service
- [ ] Create shareable stats cards
- [ ] Implement Discord webhook
- [ ] Add social share buttons
- [ ] Test across platforms

---

## Cost Estimates

| Component | Usage | Monthly Cost |
|-----------|-------|-------------|
| Image generation (Vercel OG) | 500 images | $0 (included) |
| Discord webhooks | 100 posts | $0 |
| Additional storage | Negligible | $0 |
| **Total** | | **~$0/month** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Privacy breach | Critical | Strong redaction; audit logging; user controls |
| Link enumeration | High | Random slugs; rate limiting; access codes |
| Spam via webhooks | Medium | Rate limits; verification; reporting |
| Relationship abuse | Medium | Easy disconnection; blocking; reporting |

---

## Success Criteria

**MVP (Launch):**
- [ ] Single entry sharing with redaction
- [ ] Basic mentor invitation flow
- [ ] Accountability partner pairing
- [ ] Streak image generation

**Post-MVP (30 days):**
- [ ] 20%+ of users create share links
- [ ] 10% of users have mentor/partner connection
- [ ] Zero reported privacy issues
- [ ] Discord integration used by 5%+ of users
