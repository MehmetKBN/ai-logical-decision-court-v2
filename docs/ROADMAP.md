# **AI Logical Decision Court v2 — Implementation Roadmap**

**Project:** AI Logical Decision Court v2  
**Reference Spec:** `docs/PRD.md`  
**Management:** Neon \| **Implementation:** Argon @ Antigravity IDE  
Goal: Build and ship a clean, stable, GitHub-ready v2.0 open-source release with a live static demo.

---

# **Overview of Phases**

| Phase | Milestone | Focus Area | Target Output |
| :---- | :---- | :---- | :---- |
| **Phase 1** | Foundation & Scaffolding | Vite \+ React \+ TS \+ Tailwind \+ Folder Structure | Clean compiling skeleton & design tokens |
| **Phase 2** | Core Domain & Prompt Engineering | Hat configs, TypeScript types, Zustand stores | 5+1 hat personas & state architecture |
| **Phase 3** | AI Provider & Orchestration Engine | BYOK Adapters, Streaming, Sequential Engine, Demo Mode | Working multi-provider sequential pipeline |
| **Phase 4** | Decision Court UI & Animations | 5+1 Courtroom Grid, Hat Cards, Blue Hat Verdict, Framer Motion | Interactive, animated courtroom experience |
| **Phase 5** | Settings, Export & Polish | BYOK Settings Modal, Test Connection, Markdown Export, Error Handling | Production-grade UX & resilience |
| **Phase 6** | GitHub Launch & Deployment | README, MIT License, CI/Deploy config, Final QA | Public GitHub repo \+ Live Demo URL |

---

# **Phase 1: Foundation & Project Scaffolding**

**Objective:** Initialize a clean, strict TypeScript workspace with all core dependencies and directory structure.

- [ ] Initialize project with Vite (`react-ts` template) and React 19\.  
- [ ] Install and configure Tailwind CSS, Framer Motion, Lucide React, Zustand, `react-markdown`, and `remark-gfm`.  
- [ ] Set up the modular folder structure (`src/types`, `src/config`, `src/services/ai`, `src/store`, `src/components/{layout,court,settings,export}`, `src/utils`).  
- [ ] Configure base dark courtroom theme variables, typography, and custom hat accent colors in CSS / Tailwind config.  
- [ ] Place `docs/PRD.md` and `docs/ROADMAP.md` in the repository root's `docs/` folder.  
- [ ] **Verification:** `npm run dev` and `npm run build` succeed with zero TypeScript or lint errors.

---

# **Phase 2: Core Domain, Hat Personas & State Stores**

**Objective:** Define all TypeScript contracts, craft sharply differentiated system prompts for the 6 hats, and build Zustand state management.

- [ ] Create `src/types/court.ts` (`HatId`, `HatConfig`, `HatStatus`, `HatResponse`, `CourtSession`).  
- [ ] Create `src/types/provider.ts` (`ProviderId`, `ProviderConfig`, `StreamCallbacks`, `AIProviderAdapter`).  
- [ ] Author `src/config/hats.ts` with all 6 hats (`white`, `red`, `yellow`, `black`, `green`, `blue`), their exact speaking order, accent colors, icons, and strict English system prompts ensuring distinct voices and zero overlap.  
- [ ] Author `src/config/providers.ts` with curated model presets for Google Gemini (including Gemini 4 Hydrogen), OpenAI, Anthropic, and OpenRouter/Custom OpenAI-Compatible endpoints.  
- [ ] Build `src/store/useSettingsStore.ts` (persisted to `localStorage` with optional `sessionStorage` privacy toggle, storing provider, API key, model ID, custom base URL, and Demo Mode flag).  
- [ ] Build `src/store/useCourtStore.ts` (managing case prompt, optional context, active turn, per-hat streaming text/status/errors, and reset/cancel actions).  
- [ ] **Verification:** Types compile cleanly under strict TypeScript; stores update and persist settings reliably.

---

# **Phase 3: AI Provider Layer & Sequential Orchestration Engine**

**Objective:** Build the client-side BYOK streaming layer and the sequential 5+1 deliberation engine.

- [ ] Implement `src/services/ai/ProviderAdapter.ts` base interface supporting `streamCompletion()` and `testConnection()`.  
- [ ] Implement `geminiAdapter.ts` (Google Generative Language REST API with SSE streaming).  
- [ ] Implement `openaiAdapter.ts` (OpenAI Chat Completions SSE streaming — reusable for OpenRouter, Groq, Ollama, and any Custom OpenAI-compatible Base URL).  
- [ ] Implement `anthropicAdapter.ts` (Anthropic Messages API streaming with browser direct-access header support).  
- [ ] Implement `mockAdapter.ts` (Demo Mode simulator that streams realistic, character-accurate responses for all 6 hats without requiring an API key).  
- [ ] Implement `src/services/ai/orchestrator.ts`:  
  * Executes turns strictly in order: `white -> red -> yellow -> black -> green -> blue`.  
  * Passes the user's case \+ all previous hats' outputs as structured context to each subsequent hat.  
  * Supports mid-session cancellation via `AbortController`.  
  * Handles API errors gracefully (rate limits, invalid key, CORS/network errors) without crashing the UI.  
- [ ] **Verification:** Running a full 6-turn session in Demo Mode and with a real API key streams every hat sequentially and terminates cleanly on Blue Hat's verdict.

---

# **Phase 4: Decision Court UI & Framer Motion Choreography**

**Objective:** Build the signature 5 \+ 1 courtroom interface with smooth sequential spotlighting.

- [ ] Build `Header.tsx` (App branding, Demo Mode indicator, Settings button, GitHub link).  
- [ ] Build `CaseInputPanel.tsx` (Case title/dilemma input, expandable optional constraints/context field, sample dilemma presets for quick testing, **Convene Court** & **Stop Session** buttons).  
- [ ] Build `SessionProgressBar.tsx` (Visual 6-step pipeline showing completed, active, and pending hats).  
- [ ] Build `HatCard.tsx` (Color-coded border/glow, hat icon & role badge, status pill, live streaming Markdown body, auto-scroll/expandable view).  
- [ ] Build `BlueHatVerdictPanel.tsx` (Prominent central Head Judge chamber that activates after Green Hat, displaying the structured Final Verdict and Action Plan).  
- [ ] Assemble `CourtroomGrid.tsx` implementing the responsive **5 \+ 1 layout** (desktop courtroom framing \+ mobile vertical flow) with Framer Motion active-turn highlights.  
- [ ] **Verification:** Smooth 60fps transitions on desktop and mobile; active hat spotlight clearly guides the user's eye from White through Green to the central Blue Hat.

---

# **Phase 5: BYOK Settings Modal, Export & UX Polish**

**Objective:** Complete all user-facing utilities and harden edge cases.

- [ ] Build `SettingsModal.tsx`:  
  * Provider selector tabs/dropdown (Gemini, OpenAI, Anthropic, OpenRouter / Custom).  
  * Masked API key input with show/hide toggle and explicit privacy notice ("Stored locally in your browser only").  
  * Curated model dropdown \+ **Custom Model ID** override field.  
  * Custom Base URL field (for OpenRouter / Ollama / custom endpoints).  
  * **Test Connection** button with clear success/error feedback.  
  * Quick toggle for **Demo Mode (No API Key Required)**.  
- [ ] Build `utils/markdownExport.ts` and `ExportTranscriptButton.tsx` (Copy full transcript to clipboard \+ download as `decision-court-verdict.md`).  
- [ ] Add empty states, helpful error toasts/banners, and keyboard shortcuts (e.g., `Cmd/Ctrl + Enter` to convene court).  
- [ ] **Verification:** End-to-end manual QA covering invalid keys, aborted sessions, long outputs, mobile responsiveness, and Markdown export fidelity.

---

# **Phase 6: GitHub Publication & Live Demo Deployment**

**Objective:** Package the repository to open-source showcase standards.

- [ ] Write a compelling, well-structured `README.md` (Project overview, 5+1 Six Thinking Hats architecture, Privacy-First BYOK explanation, Live Demo link, local setup instructions, screenshots/GIF).  
- [ ] Add `LICENSE` (MIT), clean `.gitignore`, and `CONTRIBUTING.md`.  
- [ ] Configure deployment for **Vercel** and/or **GitHub Pages** (verify Vite `base` config and SPA build).  
- [ ] Final `npm run build` & `npm run preview` verification.  
- [ ] Tag release `v2.0.0` on GitHub.

---

# **Post-MVP Backlog (v2.1+)**

* **Mix & Match Models:** Assign different providers/models per hat (e.g., lightweight model for council hats, flagship model for Blue Hat).  
* **Round 2 Cross-Examination:** Optional rebuttal round where hats respond directly to each other's critiques before Blue Hat rules.  
* **Session History:** Persistent local archive of past cases using IndexedDB / `localStorage`.  
* **PDF / Shareable Card Export:** Export the Blue Hat Final Verdict as a styled image card or PDF brief.

