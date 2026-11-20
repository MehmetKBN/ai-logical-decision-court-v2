# Contributing to AI Logical Decision Court v2

Thank you for your interest in contributing to **AI Logical Decision Court v2**! This project is open-source, privacy-first, and built to help people reason through complex decisions using Edward De Bono's Six Thinking Hats methodology.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js** `v20+` (or `v22+` / `v24+`)
- **npm** `v10+`

### Fork, Clone & Run
```bash
# 1. Fork the repository on GitHub, then clone your fork:
git clone https://github.com/YOUR_USERNAME/ai-logical-decision-court-v2.git
cd ai-logical-decision-court-v2

# 2. Install dependencies:
npm install

# 3. Start the Vite development server:
npm run dev
```

Open `http://localhost:5173` in your browser. You can toggle **Demo Mode** in the top header to test the entire 6-turn deliberation pipeline without configuring an API key.

---

## 2. Code Quality & Strict Standards

Every pull request must pass our strict TypeScript and ESLint checks with **zero errors and zero warnings**:

```bash
# Type-check and build production bundle
npm run build

# Run ESLint across the codebase
npm run lint
```

### Architectural Rules
- **100% English:** All code, comments, system prompts, and UI copy must be written in clear English.
- **Strict TypeScript:** Avoid `any`. All domain contracts live in `src/types/court.ts` and `src/types/provider.ts`.
- **100% Client-Side Privacy:** Never add telemetry, server-side key proxies, or `console.log` statements that output user API keys.

---

## 3. How to Add a New AI Provider Adapter

Our BYOK provider architecture is modular:

1. **Register the Provider ID & Presets:**
   - Add the new provider ID to `ProviderId` in `src/types/provider.ts`.
   - Add its default Base URL, API key placeholder, documentation URL, and curated model presets to `PROVIDERS` in `src/config/providers.ts`.
2. **Implement the Adapter (`src/services/ai/<provider>Adapter.ts`):**
   - Implement the `AIProviderAdapter` interface (`streamCompletion` and `testConnection`).
   - Use `parseSSEStream`, `normalizeHttpError`, and `normalizeProviderError` from `src/services/ai/ProviderAdapter.ts` so chunk buffering, `AbortSignal` cancellation, and error diagnostics remain consistent.
3. **Wire the Factory:**
   - Register your adapter in `getProviderAdapter()` inside `src/services/ai/ProviderAdapter.ts`.

---

## 4. Submitting a Pull Request

1. Create a descriptive feature branch (`git checkout -b feat/your-feature-name`).
2. Verify `npm run build` and `npm run lint` pass cleanly.
3. Open a Pull Request describing the motivation, changes made, and screenshots/GIFs for any UI updates.
