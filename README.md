# MiMo Debate Arena

Multi-Agent AI Debate Platform powered by [MiMo](https://platform.xiaomimimo.com).

## Overview

Watch 4 AI agents debate from different perspectives, then see MiMo synthesize all arguments into a balanced conclusion.

**Agents:**
- Optimist — highlights opportunities and positive outcomes
- Skeptic — challenges assumptions and identifies risks
- Analyst — provides data-driven, logical analysis
- Contrarian — argues the opposite of consensus

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Get your MiMo API key from [platform.xiaomimimo.com](https://platform.xiaomimimo.com)
4. Run dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) and enter your MiMo API key in Settings

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- MiMo API (`MiMo-V2.5-Flash`)

## Token Usage

Each debate session uses approximately:
- Per agent per round: ~1,500 tokens
- Synthesis: ~2,500 tokens
- Full session (4 agents × 3 rounds + synthesis): ~20,500 tokens
