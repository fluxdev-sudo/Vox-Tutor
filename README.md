# VoxTutor: The Strategic Voice Interview Agent

## 1. Problem / Research Question
Static, hardcoded grading fails to understand human intent. In technical interviews, a student can explain a concept perfectly using different words, but traditional keyword-matching algorithms will fail them. We needed a system that evaluates the *semantic intent* of spoken answers in real-time.

## 2. Solution
VoxTutor is a voice-guided technical interview simulator on the VoxForge track. It uses **Qdrant** for relative semantic grading (matching student answers against Ideal, Acceptable, and Misconception vectors) and **Rime** to deliver low-latency, spoken feedback directly to the user. 

## 3. Architecture / Evaluation Flow
1. **Input:** Student types or speaks their answer to a technical question.
2. **Local Embedding:** The text is embedded locally using `all-MiniLM-L6-v2`.
3. **Qdrant Semantic Match:** Qdrant calculates the closest vector match (Ideal vs. Acceptable vs. Misconception).
4. **Direct Evaluation:** The system maps Qdrant's mathematical classification directly to a feedback tier for zero-latency processing, bypassing the need for a secondary LLM.
5. **Rime TTS:** Rime generates the audio payload and speaks the feedback aloud.

## 4. Working Proof
*   **Video Demo:** https://drive.google.com/file/d/1SCkSLWhZOlUnmq3Ya3SsAIKJ8mDR178-/view?usp=sharing
*   **Live Feature:** The semantic evaluation engine accurately catches misconceptions (e.g., confusing LIFO with FIFO) and issues corrective audio feedback.
  
## 5.Limitations

- **Grading is based on similarity to 3 stored reference answers per question**, not open-ended understanding — validated on manual test cases, not a large sample of real student answers.
- **Scoring is fixed per tier** (not a continuous confidence score), and the embedding model is small/general-purpose, not fine-tuned for technical interview language.
- **No persistence or real accounts** — bookmarks and scores reset on refresh; the profile shown is a placeholder.
- **Speech-to-text and voice feedback depend on external services** — the browser's Web Speech API (Chromium-only) and a Rime API key (falls back to text-only without one).
- **The 207-question bank was AI-generated for prototyping** and hasn't been reviewed by a subject-matter expert.
- **English only, no topic filtering yet, and no measured latency numbers.**
  
## 6. Setup & Execution
Ensure you have a stable Node.js environment.
```bash
# 1. Clone the repository
git clone https://github.com/fluxdev-sudo/Vox-Tutor.git
cd Vox-Tutor

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
# QDRANT_URL=...
# QDRANT_API_KEY=...
# RIME_API_KEY=...

# 4. Run the local development server
npm run dev
```
## 7. Contributions
- Mohammed Farhan [Team Leader] - UI Design, Front-end design and Video spokesperson
- Ankush Kumar Patel - Back-end Coding, UI setup, API setup and Tester
- Tanmay Dixit - Presentation and Video script


## 8. Note on AI-Assisted Development

AI assistance (Claude) was used during development for code implementation and debugging. All architectural decisions, document drafting , testing and final review were done by the team.
