# Implementation Tasks

This document contains the ordered task lists for implementing the four major features using the **single-provider OpenAI architecture**.

---

## Architecture Overview

**Single Provider: OpenAI (GPT-5 Family)**

| Model | Price (per 1M tokens) | Use For |
|-------|----------------------|---------|
| GPT-5 Nano | $0.05 / $0.40 | High-volume routine tasks |
| GPT-5 Mini | $0.25 / $2.00 | Vision, balanced tasks |
| GPT-5 | $1.25 / $10.00 | Complex reasoning, insights |
| Whisper | $0.006/min | Voice transcription |
| text-embedding-3-small | $0.02 | Semantic similarity |

**Total Estimated Cost: ~$0.50/month** for moderate usage

---

## Recommended Implementation Order

1. **Frictionless Capture** - Foundation for all other features
2. **Proactive Engagement** - Solves the core "motivation gap"
3. **Context Surfacing** - Enhances journaling experience
4. **Pattern Recognition** - Needs data, highest long-term value

---

## Phase 0: OpenAI Integration Setup

### Initial Setup
- [ ] **SETUP-1**: Install OpenAI SDK
  ```bash
  npm install openai
  ```

- [ ] **SETUP-2**: Create OpenAI client singleton
  ```typescript
  // src/lib/openai.ts
  import OpenAI from 'openai';

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  ```

- [ ] **SETUP-3**: Update environment variables
  - Ensure `OPENAI_API_KEY` is set
  - Add to Vercel environment

- [ ] **SETUP-4**: Create model constants
  ```typescript
  export const MODELS = {
    NANO: 'gpt-5-nano',      // Cheap, fast
    MINI: 'gpt-5-mini',      // Vision, balanced
    FLAGSHIP: 'gpt-5',       // Complex reasoning
    WHISPER: 'whisper-1',
    EMBEDDING: 'text-embedding-3-small'
  };
  ```

---

## Feature 1: Frictionless Capture

### Phase 1A: Cloud Storage Setup
- [ ] **STORAGE-1**: Create Cloudflare R2 bucket
  - Sign up for Cloudflare (if needed)
  - Create R2 bucket named `trader-journal-media`
  - Enable public access for reads
  - Generate API credentials

- [ ] **STORAGE-2**: Install AWS S3 SDK (R2 compatible)
  ```bash
  npm install @aws-sdk/client-s3
  ```

- [ ] **STORAGE-3**: Create storage service
  ```typescript
  // src/lib/storage.ts
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

  const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!
    }
  });

  export async function uploadFile(file: Buffer, key: string, contentType: string) {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType
    }));
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
  ```

- [ ] **STORAGE-4**: Create upload API route
  - `POST /api/upload` - Accept multipart form data
  - Validate file types and sizes
  - Return public URL

### Phase 1B: Database Schema
- [ ] **SCHEMA-1**: Update Entry model for media
  ```prisma
  model Entry {
    // ... existing fields
    audioUrl        String?
    audioDuration   Int?
    transcription   String?
    imageUrls       String[]
    imageAnalyses   Json?
    captureMethod   CaptureMethod @default(TEXT)
  }

  enum CaptureMethod {
    TEXT
    VOICE
    SCREENSHOT
    QUICK_CAPTURE
  }
  ```

- [ ] **SCHEMA-2**: Run migration
  ```bash
  npx prisma migrate dev --name add_media_fields
  ```

### Phase 1C: Voice Recording
- [ ] **VOICE-1**: Create VoiceRecorder component
  - MediaRecorder API for audio capture
  - Visual waveform (optional, can be simple pulsing indicator)
  - Recording timer
  - Tap to start/stop
  - Max 5 minute recording

- [ ] **VOICE-2**: Create transcription API route
  ```typescript
  // POST /api/transcribe
  export async function POST(req: Request) {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
      prompt: 'Trading journal. Tickers: AAPL, NVDA, SPY. Terms: calls, puts, theta, IV.'
    });

    return Response.json({ text: transcription.text });
  }
  ```

- [ ] **VOICE-3**: Create AudioPlayer component
  - Play/pause controls
  - Progress bar
  - Duration display

- [ ] **VOICE-4**: Integrate voice into entry form
  - Add microphone button to entry creation
  - Show VoiceRecorder on tap
  - Auto-populate content with transcription
  - Save audioUrl to entry

### Phase 1D: Screenshot Analysis
- [ ] **IMG-1**: Create ImageCapture component
  - Camera capture (mobile)
  - File picker
  - Drag and drop (desktop)
  - Image preview
  - Max 5 images

- [ ] **IMG-2**: Create image analysis API route
  ```typescript
  // POST /api/analyze/image
  export async function POST(req: Request) {
    const { imageUrl } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: CHART_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }],
      response_format: { type: 'json_object' },
      max_tokens: 500
    });

    return Response.json(JSON.parse(response.choices[0].message.content));
  }
  ```

- [ ] **IMG-3**: Integrate images into entry form
  - Add camera button
  - Show image previews
  - Display analysis results
  - Save imageUrls to entry

### Phase 1E: Quick Capture Mode
- [ ] **QUICK-1**: Create QuickCapture component
  - Minimal UI: textarea + voice + image
  - No required fields
  - Large submit button

- [ ] **QUICK-2**: Create auto-inference API
  ```typescript
  // POST /api/infer
  export async function POST(req: Request) {
    const { content } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{
        role: 'user',
        content: `Infer from this journal entry:
          - entryType: TRADE_IDEA | TRADE | REFLECTION | OBSERVATION
          - mood: CONFIDENT | NERVOUS | EXCITED | UNCERTAIN | NEUTRAL
          - conviction: LOW | MEDIUM | HIGH
          - ticker: extracted ticker or null

          Entry: "${content}"`
      }],
      response_format: { type: 'json_object' }
    });

    return Response.json(JSON.parse(response.choices[0].message.content));
  }
  ```

- [ ] **QUICK-3**: Update FAB to open quick capture

### Phase 1F: Testing
- [ ] **TEST-1**: Test voice on iOS Safari, Android Chrome
- [ ] **TEST-2**: Test image capture on mobile
- [ ] **TEST-3**: Verify transcription accuracy on trading terms
- [ ] **TEST-4**: Test end-to-end quick capture flow

---

## Feature 2: Proactive Engagement

### Phase 2A: Push Notifications Setup
- [ ] **PUSH-1**: Generate VAPID keys
  ```bash
  npx web-push generate-vapid-keys
  ```
  Add to environment variables.

- [ ] **PUSH-2**: Install web-push
  ```bash
  npm install web-push
  ```

- [ ] **PUSH-3**: Create push subscription schema
  ```prisma
  model PushSubscription {
    id        String   @id @default(cuid())
    endpoint  String   @unique
    keys      Json
    createdAt DateTime @default(now())
  }
  ```

- [ ] **PUSH-4**: Create subscription API routes
  - `POST /api/notifications/subscribe`
  - `DELETE /api/notifications/unsubscribe`

- [ ] **PUSH-5**: Update service worker for push
  ```javascript
  // public/sw.js
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      data: data.url
    });
  });
  ```

### Phase 2B: Time-Based Prompts
- [ ] **TIME-1**: Create daily reminder cron job
  ```typescript
  // app/api/cron/daily-reminder/route.ts
  export async function GET() {
    // Find users who haven't journaled today
    // Send push notifications
  }
  ```

- [ ] **TIME-2**: Configure Vercel cron
  ```json
  {
    "crons": [{
      "path": "/api/cron/daily-reminder",
      "schedule": "30 21 * * 1-5"
    }]
  }
  ```

- [ ] **TIME-3**: Create in-app reminder banner

- [ ] **TIME-4**: Create notification preferences UI

### Phase 2C: Market Monitoring
- [ ] **MKT-1**: Create market data fetching function
  ```typescript
  async function getMarketData() {
    // Fetch SPY, VIX from yfinance service
    const spy = await fetch(`${OPTIONS_SERVICE_URL}/api/quote?ticker=SPY`);
    const vix = await fetch(`${OPTIONS_SERVICE_URL}/api/quote?ticker=^VIX`);
    return { spy: await spy.json(), vix: await vix.json() };
  }
  ```

- [ ] **MKT-2**: Create market condition schema
  ```prisma
  model MarketCondition {
    id          String   @id @default(cuid())
    date        DateTime @unique
    spyPrice    Float
    spyChange   Float
    vixLevel    Float
    marketState MarketState
  }
  ```

- [ ] **MKT-3**: Create market check cron job
- [ ] **MKT-4**: Implement trigger logic (SPY ±2%, VIX >25)
- [ ] **MKT-5**: Create market alert banner component

### Phase 2D: Historical Context (Embeddings)
- [ ] **EMB-1**: Enable pgvector in Supabase
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ALTER TABLE "Entry" ADD COLUMN embedding vector(1536);
  ```

- [ ] **EMB-2**: Create embedding generation function
  ```typescript
  async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }
  ```

- [ ] **EMB-3**: Generate embeddings on entry creation
- [ ] **EMB-4**: Backfill embeddings for existing entries
- [ ] **EMB-5**: Create similarity search API
- [ ] **EMB-6**: Build "From Your Past Self" component

---

## Feature 3: Context Surfacing

### Phase 3A: Ticker Detection
- [ ] **TICK-1**: Create ticker detection function
  - Regex for $TICKER and TICKER patterns
  - Filter false positives
  - Optional GPT-5 Nano validation

- [ ] **TICK-2**: Add ticker detection to entry form
  - Detect on input change (debounced)
  - Show detected tickers

### Phase 3B: Market Data Context
- [ ] **CTX-1**: Extend yfinance service with IV analysis
  - Add `/api/iv-analysis` endpoint
  - Calculate IV from ATM options
  - Calculate HV20, HV30
  - Calculate IV rank

- [ ] **CTX-2**: Create ticker context API
  ```typescript
  GET /api/context/ticker?ticker=NVDA
  ```

- [ ] **CTX-3**: Build context panel UI
  - Price, change, 52W range
  - IV, HV, IV rank
  - Collapsible design

### Phase 3C: Historical Entry Context
- [ ] **HIST-1**: Create ticker mention tracking
  ```prisma
  model TickerMention {
    id        String @id @default(cuid())
    ticker    String
    entryId   String
    @@index([ticker])
  }
  ```

- [ ] **HIST-2**: Create ticker history API
- [ ] **HIST-3**: Build history card component
  - Entry count, last mention
  - Sentiment trend
  - "View all" link

### Phase 3D: Smart Insights
- [ ] **INSIGHT-1**: Create GPT-5 insight generation
- [ ] **INSIGHT-2**: Add insight to context panel
- [ ] **INSIGHT-3**: Add entry review context (what happened after)

---

## Feature 4: Pattern Recognition

### Phase 4A: Pattern Infrastructure
- [ ] **PAT-1**: Create PatternInsight schema
  ```prisma
  model PatternInsight {
    id              String      @id @default(cuid())
    patternType     PatternType
    patternName     String
    description     String
    occurrences     Int
    trend           Trend
    confidence      Float
    relatedEntryIds String[]
    evidence        String[]
    isActive        Boolean     @default(true)
  }
  ```

- [ ] **PAT-2**: Backfill market conditions for entries

### Phase 4B: Pattern Detection
- [ ] **DETECT-1**: Create bias frequency analysis
- [ ] **DETECT-2**: Create market correlation analysis
- [ ] **DETECT-3**: Create pattern detection cron job
  ```typescript
  // Runs daily at 2 AM ET
  async function detectPatterns() {
    const entries = await getRecentEntries(90);
    const patterns = await analyzeWithGPT5(entries);
    await savePatterns(patterns);
  }
  ```

### Phase 4C: Pattern Display
- [ ] **DISP-1**: Add patterns to weekly insights
- [ ] **DISP-2**: Create monthly report page
- [ ] **DISP-3**: Build pattern detail view

### Phase 4D: Real-Time Alerts
- [ ] **ALERT-1**: Create draft pattern checking
- [ ] **ALERT-2**: Build pattern alert UI
- [ ] **ALERT-3**: Create pattern breaking recognition

---

## Consolidated Cost Summary

| Feature | Monthly Cost |
|---------|-------------|
| Frictionless Capture | ~$0.35 |
| Proactive Engagement | ~$0.04 |
| Context Surfacing | ~$0.06 |
| Pattern Recognition | ~$0.12 |
| **Total** | **~$0.57** |

---

## MVP Scope (Recommended First Release)

Focus on these high-impact tasks first:

### Must Have (MVP)
- [ ] Voice recording + Whisper transcription
- [ ] Quick capture with auto-inference
- [ ] Daily reflection notification (in-app)
- [ ] Basic ticker context (price, entry count)
- [ ] Bias frequency in weekly insights

### Nice to Have (Post-MVP)
- [ ] Screenshot analysis
- [ ] Push notifications
- [ ] Market condition alerts
- [ ] Full pattern recognition
- [ ] Historical context with embeddings

---

## Testing Checklist

- [ ] Voice recording on iOS Safari
- [ ] Voice recording on Android Chrome
- [ ] Image capture on mobile
- [ ] Transcription accuracy (>90% on trading terms)
- [ ] Auto-inference accuracy
- [ ] Context panel load time (<2s)
- [ ] Push notifications on PWA
- [ ] Pattern detection accuracy

---

## Environment Variables Required

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Cloudflare R2
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=trader-journal-media
R2_PUBLIC_URL=https://...

# Push Notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Existing
DATABASE_URL=...
OPTIONS_SERVICE_URL=http://localhost:8000
```
