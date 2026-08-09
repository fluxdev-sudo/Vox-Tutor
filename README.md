# VoxTutor: The Strategic Voice Interview Agent

## 1. Problem / Research Question
Static, hardcoded grading fails to understand human intent. In technical interviews, a student can explain a concept perfectly using different words, but traditional keyword-matching algorithms will fail them. We needed a system that evaluates the *semantic intent* of spoken answers in real-time.

## 2. Solution
VoxTutor is a voice-guided technical interview simulator on the VoxForge track. It uses **Qdrant** for relative semantic grading (matching student answers against Ideal, Acceptable, and Misconception vectors) and **Rime** to deliver low-latency, spoken feedback directly to the user. 

## 3. Architecture / Evaluation Flow
1. **Input:** Student types or speaks their answer to a technical question.
2. **Local Embedding:** The text is embedded locally using `all-MiniLM-L6-v2`.
3. **Qdrant Semantic Match:** Qdrant calculates the closest vector match (Ideal vs. Misconception).
4. **LLM Translation:** The raw Qdrant classification is synthesized into a single feedback sentence.
5. **Rime TTS:** Rime generates the audio payload and speaks the feedback aloud.

## 4. Working Proof
*   **Video Demo:** [Insert Google Drive Link Here]
*   **Live Feature:** The semantic evaluation engine accurately catches misconceptions (e.g., confusing LIFO with FIFO) and issues corrective audio feedback.

## 5. Setup & Execution
Ensure you have a stable Node.js environment.
```bash
# 1. Clone the repository
git clone [https://github.com/fluxdev-sudo/Vox-Tutor.git](https://github.com/fluxdev-sudo/Vox-Tutor.git)
cd Vox-Tutor

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
# QDRANT_URL=...
# QDRANT_API_KEY=...
# RIME_API_KEY=...

# 4. Run the local development server
npm run dev
