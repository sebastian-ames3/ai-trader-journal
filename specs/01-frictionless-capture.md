# PRD: Frictionless Capture System

## Overview

**Problem Statement:**
Users only journal when motivated (excitement about a discovery, or after executing a trade). During drawdowns, emotional disengagement, or casual moments (lying in bed), the friction of typing a structured entry prevents valuable insights from being captured.

**Solution:**
A multi-modal capture system that accepts voice memos, screenshots, and quick text with automatic AI extraction, transcription, and organization.

**Success Metrics:**
- 3x increase in entries during market drawdown periods
- 50% of entries captured via voice or screenshot
- < 10 seconds to capture a thought (voice or quick text)
- 90%+ accuracy on voice transcription and context extraction

---

## LLM Architecture

**Single Provider: OpenAI (GPT-5 Family)**

| Task | Model | Cost (per 1M tokens) | Why |
|------|-------|---------------------|-----|
| Voice transcription | Whisper | $0.006/min | Gold standard accuracy |
| Image/chart analysis | GPT-5 Mini | $0.25 / $2.00 | Good vision, balanced cost |
| Content auto-inference | GPT-5 Nano | $0.05 / $0.40 | High volume, cheap |
| Complex extraction | GPT-5 | $1.25 / $10.00 | When accuracy critical |

**Why Single Provider:**
- One SDK, one API key, one bill
- Consistent error handling
- GPT-5 Nano is cheaper than Gemini Flash
- GPT-5 flagship competes with Claude Opus
- Whisper is gold standard for transcription

---

## User Stories

### Voice Capture
1. As a trader lying in bed, I want to record a 30-second voice memo about a trade idea so I can capture the thought without typing.
2. As a trader reviewing my portfolio, I want to verbally dictate my frustrations so the AI can extract the emotional context and any tickers mentioned.
3. As a trader, I want to replay my voice memos later to hear the emotion in my own voice.

### Screenshot Capture
4. As a trader, I want to screenshot a chart pattern and have the AI describe what it sees (ticker, pattern, timeframe, indicators).
5. As a trader, I want to capture a position screenshot from ThinkorSwim and have the AI extract the position details.
6. As a trader, I want to attach multiple screenshots to a single entry for context.

### Quick Text
7. As a trader, I want a "quick capture" mode that's just a text box and submit button - no type/mood/conviction required.
8. As a trader, I want the AI to infer entry type, mood, and conviction from my quick text automatically.

---

## Feature Specifications

### 1. Voice Memo Capture

**Recording Interface:**
- Large microphone button (80x80px) on new entry screen
- Visual waveform during recording
- Recording timer display
- Tap to start, tap to stop (max 5 minutes)
- Playback controls after recording

**Transcription (OpenAI Whisper):**
```typescript
async function transcribeAudio(audioFile: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
    language: 'en',
    prompt: 'Trading journal entry. May include tickers like AAPL, NVDA, SPY. ' +
            'May include options terminology like calls, puts, iron condor, theta.'
  });
  return transcription.text;
}
```

**AI Extraction from Transcription (GPT-5 Nano):**
```typescript
async function extractFromTranscription(text: string) {
  return openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [{
      role: 'user',
      content: `Extract from this trading journal transcription:
        - ticker mentions (e.g., AAPL, NVDA)
        - entry type (TRADE_IDEA, TRADE, REFLECTION, OBSERVATION)
        - mood/sentiment
        - conviction level (LOW, MEDIUM, HIGH)
        - key points (3-5 bullets)

        Transcription: "${text}"`
    }],
    response_format: { type: 'json_object' }
  });
}
```

**Storage:**
- Audio files stored in Cloudflare R2 (S3-compatible)
- `audioUrl` field on Entry model
- Compressed audio format (AAC/M4A, ~100KB/minute)

### 2. Screenshot/Image Analysis

**Capture Methods:**
- Camera capture (mobile)
- Photo library selection
- Paste from clipboard (desktop)
- Drag and drop (desktop)

**Image Analysis (GPT-5 Mini with Vision):**
```typescript
async function analyzeChartImage(imageUrl: string) {
  return openai.chat.completions.create({
    model: 'gpt-5-mini',  // Good vision at balanced cost
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this trading chart/screenshot. Extract:
            - Ticker symbol (if visible)
            - Chart type and timeframe
            - Technical patterns (support/resistance, trends, formations)
            - Indicators shown (RSI, MACD, moving averages)
            - Key price levels
            - Brief summary of what the chart shows`
        },
        {
          type: 'image_url',
          image_url: { url: imageUrl }
        }
      ]
    }],
    response_format: { type: 'json_object' }
  });
}
```

**AI Output Example:**
```json
{
  "ticker": "AAPL",
  "chartType": "candlestick",
  "timeframe": "daily",
  "patterns": ["bull flag", "above 50 SMA"],
  "indicators": ["RSI: 62", "MACD: bullish crossover"],
  "keyLevels": {
    "support": 185,
    "resistance": 195
  },
  "summary": "AAPL daily chart showing bull flag formation above 50 SMA with RSI at 62, suggesting continuation potential."
}
```

**Storage:**
- Images stored in Cloudflare R2
- `imageUrls` field on Entry model (array)
- Compressed images (WebP, max 1MB each)
- Max 5 images per entry

### 3. Quick Capture Mode

**Interface:**
- Single text input (auto-expanding textarea)
- Voice button inline
- Camera/image button inline
- Submit button
- No required fields - everything auto-inferred

**Auto-Inference (GPT-5 Nano):**
```typescript
async function autoInferMetadata(content: string) {
  return openai.chat.completions.create({
    model: 'gpt-5-nano',  // Cheapest, fast
    messages: [{
      role: 'user',
      content: `Analyze this trading journal entry and infer:
        - entryType: TRADE_IDEA | TRADE | REFLECTION | OBSERVATION
        - mood: CONFIDENT | NERVOUS | EXCITED | UNCERTAIN | NEUTRAL
        - conviction: LOW | MEDIUM | HIGH
        - ticker: extracted ticker symbol or null
        - sentiment: positive | negative | neutral

        Entry: "${content}"`
    }],
    response_format: { type: 'json_object' }
  });
}
```

**Inference Rules:**
- Contains "thinking about buying/selling" → TRADE_IDEA
- Contains "just bought/sold" → TRADE
- Contains "looking back" or past tense → REFLECTION
- Default → OBSERVATION

### 4. Unified Entry Creation Flow

**New Entry Screen Redesign:**

```
┌─────────────────────────────────┐
│  ← Back              [Guided]   │
├─────────────────────────────────┤
│                                 │
│  What's on your mind?           │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │  [Auto-expanding textarea]  ││
│  │                             ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  [🎤 Voice]  [📷 Image]  [···]  │
│                                 │
│  ─────── Optional Details ───── │
│                                 │
│  Type: [Auto-detected: Idea ▼]  │
│  Mood: [Auto-detected: 😊 ▼]    │
│  Conviction: [Auto: Medium ▼]   │
│  Ticker: [Auto: NVDA ▼]         │
│                                 │
│  ┌─────────────────────────────┐│
│  │       Save Entry            ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## Technical Architecture

### Cloud Storage Setup

**Cloudflare R2 (Recommended):**
- S3-compatible API
- No egress fees
- Free tier: 10GB storage, 1M requests/month
- Cost: ~$0.015/GB/month after free tier

### API Endpoints

```typescript
// Upload audio file
POST /api/upload/audio
  Request: multipart/form-data with audio file
  Response: { url: string, duration: number }

// Upload image file
POST /api/upload/image
  Request: multipart/form-data with image file
  Response: { url: string, width: number, height: number }

// Transcribe audio (calls Whisper)
POST /api/transcribe
  Request: { audioUrl: string }
  Response: { text: string, confidence: number }

// Analyze image (calls GPT-5 Mini)
POST /api/analyze/image
  Request: { imageUrl: string }
  Response: { analysis: ImageAnalysis }

// Create entry with media
POST /api/entries
  Request: {
    content?: string,
    audioUrl?: string,
    imageUrls?: string[],
    transcription?: string,
    imageAnalyses?: ImageAnalysis[],
    // Auto-inferred fields (can override)
    type?: EntryType,
    mood?: Mood,
    conviction?: Conviction,
    ticker?: string
  }
```

### Database Schema Updates

```prisma
model Entry {
  // Existing fields...

  // Media fields
  audioUrl        String?
  audioDuration   Int?         // Duration in seconds
  transcription   String?      // Raw transcription from Whisper
  imageUrls       String[]
  imageAnalyses   Json?        // Array of GPT-5 Mini analyses
  captureMethod   CaptureMethod @default(TEXT)
}

enum CaptureMethod {
  TEXT
  VOICE
  SCREENSHOT
  QUICK_CAPTURE
}
```

### Cost Estimates (Monthly, Moderate Usage)

| Service | Usage | Cost |
|---------|-------|------|
| Whisper | 50 voice memos @ 1 min | $0.30 |
| GPT-5 Mini (vision) | 30 screenshots | $0.02 |
| GPT-5 Nano (inference) | 200 entries | $0.02 |
| R2 Storage | 500MB | Free tier |
| **Total** | | **~$0.35/month** |

---

## Implementation Phases

### Phase 1: Voice Capture (Priority 1)
1. Set up Cloudflare R2 bucket
2. Implement audio upload API
3. Integrate OpenAI Whisper transcription
4. Add voice recording UI component (MediaRecorder API)
5. Update entry creation flow with voice option
6. Add playback controls to entry detail

### Phase 2: Screenshot Analysis (Priority 2)
1. Implement image upload API
2. Integrate GPT-5 Mini vision
3. Add camera/gallery capture UI
4. Display image analysis results
5. Show images in entry detail view

### Phase 3: Quick Capture Mode (Priority 3)
1. Create simplified entry form component
2. Implement GPT-5 Nano auto-inference
3. Add real-time inference preview
4. Update FAB to open quick capture
5. A/B test quick vs standard entry

---

## OpenAI Integration Code

```typescript
// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Voice transcription
export async function transcribeAudio(audioFile: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
    language: 'en',
    prompt: 'Trading journal. Tickers: AAPL, NVDA, SPY, QQQ. Terms: calls, puts, iron condor, theta, delta, IV.'
  });
  return transcription.text;
}

// Image analysis
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
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
  return JSON.parse(response.choices[0].message.content);
}

// Auto-inference for quick capture
export async function inferMetadata(content: string): Promise<InferredMetadata> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [{
      role: 'user',
      content: `${INFERENCE_PROMPT}\n\nEntry: "${content}"`
    }],
    response_format: { type: 'json_object' },
    max_tokens: 200
  });
  return JSON.parse(response.choices[0].message.content);
}
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Whisper accuracy on trading terms | Medium | Custom prompt with trading vocabulary |
| Mobile browser audio recording | High | Test iOS Safari, Android Chrome; use MediaRecorder API |
| Large audio file uploads | Medium | Client-side compression, chunked upload, 5-min max |
| Image upload size | Low | Client-side resize to 1MB max |

---

## Success Criteria

**Launch (MVP):**
- [ ] Voice recording works on iOS Safari and Android Chrome
- [ ] Whisper transcription accuracy > 90% on trading content
- [ ] GPT-5 Mini extracts ticker correctly > 85% of time
- [ ] Quick capture creates valid entry in < 10 seconds
- [ ] Audio playback works on entry detail page

**Post-Launch (30 days):**
- [ ] 30%+ of new entries use voice or screenshot
- [ ] User retention improves during drawdown periods
- [ ] Average capture time < 15 seconds
