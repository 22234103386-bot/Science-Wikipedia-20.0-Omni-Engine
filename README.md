<div align="center">
<img width="1200" height="475" alt="Science Wikipedia Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🧪 Science Wikipedia 18.0: The Generative Omni-Engine

> **A photorealistic 3D multiverse where users can rewrite the laws of physics in real-time using natural language prompts.**

[![Submission for Gemini 3 Vibe Code Competition](https://img.shields.io/badge/Submitted%20to-Gemini%20Vibe%20Code-purple?style=for-the-badge&logo=google)](https://ai.studio/apps/drive/1yld63O2xJzTy8ibQDdLeFuzPAJ_x900d)

</div>

---

## 🚀 The Vibe
Standard science education is static. Textbooks describe explosions, but students never see them. Videos are linear; you cannot ask "What if?"

**Science Wikipedia 18.0** changes that. It is an **interactive simulation engine** powered by **Google Gemini 3 Pro**. Instead of pre-baked animations, every experiment is generated on the fly based on the user's specific questions.

## 🎥 Demo & Links
* **[📺 Watch the Video Walkthrough](https://youtu.be/zFnTpVoBAkU)**
* **[🧠 View Prompt in AI Studio](https://ai.studio/apps/drive/1yld63O2xJzTy8ibQDdLeFuzPAJ_x900d)**


## 🤖 How it Works (The Omni-Engine)
We architected a single massive system prompt that turns Gemini into a 3-in-1 engine:
1.  **VFX Artist:** Generates PBR material code (glass refraction, metal reflections) and particle systems (fire, smoke).
2.  **Physics Engine:** Calculates "baked" animation curves for gravity and collisions without heavy libraries.
3.  **Multiverse Director:** Analyzes "What If" scenarios (e.g., *"What if gravity was zero?"*) and rewrites the simulation code in real-time.

## 🛠️ Tech Stack
* **Backend:** Google AI Studio (Gemini 3 Pro)
* **Frontend:** React, Vite
* **3D Engine:** Three.js, @react-three/fiber, @react-three/drei
* **VFX:** Custom Particle Systems & Volumetrics

## 📦 Run Locally

This project contains everything you need to run your app locally.

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up your API Key:**
    Open the `.env.local` file (or create it) and set the `GEMINI_API_KEY` to your key:
    ```bash
    GEMINI_API_KEY=your_key_here
    ```

3.  **Run the app:**
    ```bash
    npm run dev
    ```

---
*Built with ❤️ for the Google DeepMind Gemini 3 Competition.*
