# Debate Arena

> Multi-perspective AI debate platform powered by MiMo API

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iyunq/debate-arena)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Debate Arena orchestrates structured multi-agent debates using MiMo's language models. Four specialized AI agents—each with distinct reasoning patterns—engage in iterative discourse on any topic, followed by an impartial synthesis of all perspectives.

### Agent Profiles

| Agent | Role | Reasoning Style |
|-------|------|----------------|
| **Optimist** | Opportunity identifier | Highlights potential benefits, growth vectors, and positive outcomes |
| **Skeptic** | Risk assessor | Challenges assumptions, identifies failure modes, stress-tests claims |
| **Analyst** | Data interpreter | Provides evidence-based analysis, quantitative reasoning, logical frameworks |
| **Contrarian** | Devil's advocate | Argues against consensus, explores unconventional angles, tests boundaries |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Input                            │
│                      (Debate Topic)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Debate Orchestrator       │
         │   (Round-robin scheduling)  │
         └─────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
   │Optimist│    │Skeptic │    │Analyst │    │Contrary│
   └────┬───┘    └───┬────┘    └───┬────┘    └───┬────┘
        │            │              │              │
        └────────────┴──────────────┴──────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Synthesizer  │
              │  (MiMo V2.5)   │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Final Analysis │
              └────────────────┘
```

## Features

- **Multi-round debates** — Configurable iteration depth (default: 8 rounds)
- **Real-time streaming** — Server-sent events for live agent responses
- **Token analytics** — Per-agent usage tracking and cost estimation
- **Session persistence** — Local storage for debate history
- **Responsive UI** — Mobile-first design with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ 
- MiMo API key ([get one here](https://platform.xiaomimimo.com))

### Installation

```bash
# Clone repository
git clone https://github.com/iyunq/debate-arena.git
cd debate-arena

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your MiMo API key in the settings modal.

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Or deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iyunq/debate-arena)

## Configuration

Edit `src/config.ts` to customize debate parameters:

```typescript
export const config = {
  totalRounds: 8,              // Number of debate rounds
  maxTokensPerAgent: 8000,     // Token limit per agent response
  maxTokensSynthesis: 6000,    // Token limit for final synthesis
  model: 'MiMo-V2.5-Flash',    // MiMo model identifier
  temperature: 0.7,            // Response randomness (0-1)
  streamDelay: 50              // SSE chunk delay (ms)
}
```

## API Reference

### POST `/api/debate`

Initiates a new debate session.

**Request Body:**
```json
{
  "topic": "Should AI development be regulated?",
  "apiKey": "your-mimo-api-key"
}
```

**Response:** Server-sent event stream

```
event: agent
data: {"agent":"optimist","content":"AI regulation...","round":1}

event: agent
data: {"agent":"skeptic","content":"However...","round":1}

event: synthesis
data: {"content":"Balancing innovation...","totalTokens":270000}

event: done
data: {"success":true}
```

## Token Economics

| Component | Tokens/Round | Cost (USD) |
|-----------|--------------|------------|
| Optimist | ~8,000 | $0.024 |
| Skeptic | ~8,000 | $0.024 |
| Analyst | ~8,000 | $0.024 |
| Contrarian | ~8,000 | $0.024 |
| Synthesis | ~6,000 | $0.018 |
| **Total/Round** | **~38,000** | **~$0.114** |
| **Full Session (8 rounds)** | **~270,000** | **~$0.70** |

*Based on MiMo pricing: $1/1M input tokens, $3/1M output tokens*

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **AI Provider:** MiMo API (V2.5-Flash)
- **Deployment:** Vercel

## Project Structure

```
debate-arena/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── debate/
│   │   │       └── route.ts      # Debate orchestration endpoint
│   │   ├── analytics/
│   │   │   └── page.tsx          # Token usage dashboard
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main debate interface
│   ├── components/
│   │   └── DebateInterface.tsx   # Core debate UI
│   ├── lib/
│   │   └── mimo.ts               # MiMo API client
│   └── config.ts                 # Application config
├── public/                       # Static assets
└── package.json
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [MiMo API](https://platform.xiaomimimo.com)
- Inspired by structured debate methodologies and multi-agent reasoning systems

---

**Live Demo:** [debate-arena-hazel.vercel.app](https://debate-arena-hazel.vercel.app)
