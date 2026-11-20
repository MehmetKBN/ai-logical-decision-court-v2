# **AI Logical Decision Court v2 — Product Requirements Document (PRD)**

**Version:** 2.0.0 (Approved Architecture)  
**Status:** Ready for Implementation  
**Language:** English-Only (UI, System Prompts, Codebase, Documentation)  
**Target Release:** Public Open-Source GitHub Repository \+ Zero-Cost Static Live Demo (Vercel / GitHub Pages)

# **1\. Executive Summary & Vision**

**AI Logical Decision Court v2** is a privacy-first, client-side interactive decision-support web application built around [Edward De Bono's Six Thinking Hats](https://en.wikipedia.org/wiki/Six_Thinking_Hats) methodology.  
Instead of relying on a single generic AI response, users submit a complex dilemma, decision, or idea to a structured **5 \+ 1 Decision Court**. Five specialized AI personas—each represented by a distinctive hat color, cognitive lens, and strict behavioral prompt—take turns speaking sequentially in real time. Once all five council members have presented their arguments, the **Blue Hat (Head Judge / Moderator)** in the center of the court synthesizes every perspective, resolves key tensions, and delivers a structured **Final Verdict & Action Plan**.

# **2\. Court Architecture: The 5 \+ 1 Layout**

In De Bono's methodology, the Blue Hat naturally serves as the executive meta-hat responsible for organizing the thinking process and synthesizing the big picture. Therefore, v2 uses a faithful **5 \+ 1 Court Layout** (5 peripheral council members \+ 1 central Head Judge):

| Turn | Hat & Color | Accent Theme | Symbol | Cognitive Lens | Court Role & Output Focus |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **1st** | **White Hat** | Crisp White / Slate (`#F8FAFC`) | Blank Sheet | Objective / Neutral | Facts, verifiable data, known constraints, and explicitly missing information. Zero opinion or emotion. |
| **2nd** | **Red Hat** | Crimson Red (`#EF4444`) | Fire | Subjective / Emotional | Gut feelings, intuition, emotional resonance, human impact, and unspoken fears—without needing logical justification. |
| **3rd** | **Yellow Hat** | Solar Gold (`#EAB308`) | Sun | Objective / Optimistic | Value, benefits, strategic upside, best-case scenarios, and why the idea can succeed. |
| **4th** | **Black Hat** | Obsidian / Charcoal (`#334155` / `#1E293B`) | Judge's Robe | Objective / Critical | Risks, flaws, edge cases, hidden costs, failure modes, and logical cautions. |
| **5th** | **Green Hat** | Emerald Green (`#22C55E`) | Plant | Speculative / Creative | Lateral thinking, unconventional alternatives, creative mitigations for Black Hat risks, and fresh pivots. |
| **Center (6th)** | **Blue Hat** | Royal Blue (`#3B82F6`) | Sky | Meta / Executive | **Head Judge / Moderator:** Synthesizes all 5 hats, weighs trade-offs, states the **Final Verdict**, confidence level, and concrete **Next Steps**. |

# **3\. Sequential Deliberation Flow**

The court operates in a dramatic, context-aware **Sequential Session**:

1. **Case Submission:** The user enters a Decision / Dilemma prompt and optional Context / Constraints (e.g., budget, timeline, personal priorities) and clicks **Convene Court**.  
2. **Sequential Council Deliberation (Turns 1 to 5):**  
   * Order: `White -> Red -> Yellow -> Black -> Green`.  
   * Only one hat speaks at a time. The active hat card illuminates with its signature accent glow and a live "Deliberating..." / streaming indicator.  
   * Each hat receives the original case **plus** the statements of all preceding hats as context (e.g., Green Hat directly addresses Black Hat's risks with creative alternatives).  
   * Responses stream token-by-token in real time.  
3. **Central Verdict (Turn 6 — Blue Hat):**  
   * Once Green Hat concludes, focus shifts to the central **Blue Hat (Head Judge)** chamber.  
   * Blue Hat ingests the full transcript of all 5 council members and streams a structured final output:  
     * **Executive Summary**  
     * **Key Consensus & Tensions**  
     * **Final Verdict** (Clear recommendation: Proceed / Proceed with Conditions / Pivot / Reject)  
     * **Actionable Next Steps** (3–5 concrete bullet points)  
4. **Controls & Export:** Users can cancel/stop an active session at any point, start a new case, or export the entire court transcript \+ verdict as a clean **Markdown (**`.md`**)** file or copy it to the clipboard.

# **4\. AI Model & Privacy Strategy (BYOK — Bring Your Own Key)**

AI Logical Decision Court v2 is **100% client-side and privacy-first**:

* **Zero Backend / Zero Key Storage on Servers:** All API keys are stored exclusively in the user's browser (`localStorage`, with an optional "Session Only" toggle for `sessionStorage`) and sent directly from the browser to the selected AI provider's official API endpoint.  
* **Modular Provider Adapter Architecture:**  
  * **Google Gemini** (e.g., Gemini 4 Hydrogen, Gemini 2.5 Pro, Gemini 2.5 Flash)  
  * **OpenAI** (e.g., GPT-4o, GPT-4.1, o3-mini)  
  * **Anthropic** (e.g., Claude 3.7 Sonnet, Claude 3.5 Haiku — with browser-compatible headers where applicable)  
  * **OpenRouter / Custom OpenAI-Compatible Endpoint** (Supports custom Base URL for OpenRouter, Groq, Together, LM Studio, or local Ollama)  
* **Custom Model ID Input:** Alongside curated model presets per provider, users can enter any arbitrary custom Model ID so the app stays future-proof without code updates.  
* **Connection Test:** A "Test Connection" button in the Settings modal validates the API key and model before convening the court.

# **5\. Technical Stack & Project Structure**

## **Tech Stack**

* **Framework:** React 19 \+ TypeScript \+ Vite  
* **Styling:** Tailwind CSS (Dark courtroom aesthetic with high-contrast hat color accents)  
* **Animations:** Framer Motion (Active hat spotlight, sequential transitions, verdict reveal)  
* **Icons:** Lucide React  
* **State Management:** Zustand (Persisted settings store \+ ephemeral court session store)  
* **Markdown Rendering:** `react-markdown` \+ `remark-gfm` (Clean formatted hat outputs and verdict)

## **Recommended Directory Structure**

* `docs/`  
  * `PRD.md` — This Product Requirements Document  
  * `ROADMAP.md` — Phased implementation plan  
* `src/`  
  * `types/` — `court.ts` (Hat definitions, session states), `provider.ts` (AI provider & streaming interfaces)  
  * `config/` — `hats.ts` (6 hat metadata, color tokens, and distinct English system prompts), `providers.ts` (Default provider presets & model lists)  
  * `services/ai/` — `ProviderAdapter.ts` (Interface), `geminiAdapter.ts`, `openaiAdapter.ts` (also serves OpenRouter/Custom), `anthropicAdapter.ts`, `orchestrator.ts` (Sequential 5+1 execution engine with AbortController support)  
  * `store/` — `useSettingsStore.ts` (BYOK config), `useCourtStore.ts` (Case input, hat responses, active turn, streaming state)  
  * `components/`  
    * `layout/` — `Header.tsx`, `CourtroomGrid.tsx` (Responsive 5+1 layout)  
    * `court/` — `CaseInputPanel.tsx`, `HatCard.tsx`, `BlueHatVerdictPanel.tsx`, `SessionProgressBar.tsx`  
    * `settings/` — `SettingsModal.tsx` (Provider selector, API key input, custom base URL/model ID, connection tester)  
    * `export/` — `ExportTranscriptButton.tsx`  
  * `utils/` — `markdownExport.ts`

# **6\. UI / UX Design Principles**

* **Aesthetic:** Modern, atmospheric dark courtroom theme (`slate-950` / `zinc-950` canvas) with crisp glassmorphic cards and vibrant, unmistakable accent borders/glows for each hat.  
* **5 \+ 1 Spatial Hierarchy:**  
  * On Desktop (`lg+`): A visually balanced courtroom arrangement where the 5 council hats surround or frame the prominent central **Blue Hat (Head Judge)** verdict chamber.  
  * On Mobile/Tablet: A clean vertical progression with a sticky progress indicator showing which hat currently holds the floor.  
* **Zero-Friction Onboarding:** If no API key is configured, show a clear, friendly prompt banner to open Settings—plus include a **"Demo Mode (Mock Simulation)"** toggle so GitHub visitors can preview the full animated 5+1 courtroom flow even without an API key.

# **7\. Release Scope**

## **v2.0 (MVP — GitHub Launch)**

5. Complete 5 \+ 1 responsive Decision Court UI (English-only) with Framer Motion transitions.  
6. Sequential deliberation engine (`White -> Red -> Yellow -> Black -> Green -> Blue`) with real-time token streaming and abort/cancel support.  
7. BYOK Settings Modal supporting Google Gemini, OpenAI, Anthropic, and OpenRouter/Custom OpenAI-compatible endpoints \+ Custom Model ID \+ Test Connection.  
8. Built-in **Demo / Mock Mode** for instant zero-key preview on the live demo site.  
9. One-click Markdown export & copy-to-clipboard for full court transcripts.  
10. Production-ready GitHub repository: polished `README.md` with architecture diagram & screenshots, `LICENSE` (MIT), `.gitignore`, and live deployment workflow.

## **v2.1+ (Post-MVP Roadmap)**

* **Mix & Match Models:** Assign a different model per hat (e.g., fast model for council hats, flagship reasoning model for Blue Hat).  
* **Cross-Examination (Round 2):** Allow hats to rebut each other before Blue Hat delivers the final verdict.  
* **Local Case History:** Save and revisit past court sessions in IndexedDB / `localStorage`.