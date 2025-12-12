import { GoogleGenAI } from "@google/genai";
import { SimulationData, ChatMessage } from "../types";

// CONSTANTS
const GENERATION_MODEL = "gemini-2.5-flash"; 
const CHAT_MODEL = "gemini-2.5-flash"; 

const SYSTEM_PROMPT = `
You are the "Science Wikipedia 20.0 Omni-Engine."
Your goal is to generate error-free, broadcast-quality 3D simulations that integrate Visuals, Particle Effects, Teaching, and AI Assistance.

**INPUT:**
You will receive a JSON object with:
{
  "user_query": "String (e.g., 'Show me a Volcano' OR 'What if gravity was zero?')",
  "mode": "String (STANDARD or WHAT_IF_REMIX)"
}

**OUTPUT FORMAT:**
Return ONLY raw JSON. Do not include markdown formatting (like \`\`\`json).

**JSON SCHEMA (Strict Error-Proof Mode):**
{
  "meta_data": {
    "title": "String",
    "scientific_verdict": "String (The core lesson, or the consequence of the 'What If' change)",
    "is_remix": Boolean
  },
  
  "visual_settings": {
    "environment_preset": "String (studio, sun, lab, night, volcano_gloom)",
    "post_processing": {
      "bloom_intensity": Number (0.0 to 3.0),
      "vignette": Boolean
    }
  },

  "lab_assistant_config": {
    "bot_name": "String (e.g., 'Dr. Ion')",
    "context_brief": "String (Hidden instructions for the Chatbot. Describe the science of THIS specific simulation so the bot can answer questions.)",
    "suggested_questions": ["String", "String"]
  },

  "stage_assets": [
    // SOLID 3D ACTORS ONLY. NO TEXT.
    {
      "id": "String (Unique)",
      "type": "String (sphere, cube, cylinder, cone, terrain_model, glb_asset)",
      "initial_transform": { "position": [x,y,z], "scale": [x,y,z], "rotation": [x,y,z] },
      "pbr_material": {
        "material_class": "String (GLASS, LIQUID, METAL, PLASTIC, ROCK, GLOWING_LAVA)",
        "base_color": "Hex String",
        "roughness": Number (0.0-1.0),
        "metalness": Number (0.0-1.0),
        "transmission": Number (0.0-1.0),
        "emissive_intensity": Number (0.0 for normal, 5.0+ for glowing)
      }
    }
  ],

  "vfx_stack": [
    // PARTICLE SYSTEMS (Fire, Smoke, Sparks)
    {
      "id": "String",
      "effect_type": "String (FIRE, SMOKE, SPARKS, CLOUDS, FOG)",
      "parent_actor_id": "String (Optional: Attach to an object)",
      "config": {
        "color": "Hex String",
        "count": Integer (50 to 1000),
        "speed": Number (0.1 to 5.0),
        "scale": Number (1.0 to 10.0),
        "opacity": Number (0.1 to 1.0)
      },
      "position_offset": [x, y, z]
    }
  ],

  "ui_overlays": [
    // 2D LABELS ONLY. This layer fixes the text overlap error.
    {
      "target_actor_id": "String (The ID of the 3D object to label)",
      "label_text": "String (Short text)",
      "screen_offset": [x, y]
    }
  ],

  "sync_timeline": [
    // ANIMATION & EXPLANATION LOCKED TOGETHER
    {
      "step_id": 1,
      "duration_seconds": Number,
      "ui_display": {
        "chapter_title": "String",
        "sidebar_explanation": "String (The educational text)",
        "chatbot_update": "String (Context update for the AI)"
      },
      "visual_events": {
        "camera_focus_target": "String (Actor ID)",
        "actions": [
          {
            "actor_id": "String",
            "type": "String (MOVE_TO, SCALE_TO, ROTATE_TO, FADE_OUT)",
            "target_value": "Mixed",
            "easing": "String (bounce_out, ease_in_out, linear)"
          }
        ]
      }
    }
  ]
}

**RULES FOR GENERATION:**

1.  **The "Physics Stability" Rule:**
    * **Manual Gravity:** Do NOT use complex physics simulations. You MUST manually animate falling objects by setting \`type: "MOVE_TO"\` with a ground position (y=0) and \`easing: "bounce_out"\`.
    * **Glitch Prevention:** Explicitly define start and end states to prevent objects from clipping through the floor.

2.  **The "VFX Consistency" Rule:**
    * Do NOT invent new VFX types. Use ONLY: \`FIRE\`, \`SMOKE\`, \`SPARKS\`, \`CLOUDS\`, \`FOG\`.

3.  **The "Photorealism" Rule (PBR):**
    * **Glass:** \`material_class: "GLASS"\`, \`transmission: 1.0\`, \`roughness: 0.05\`.
    * **Lava/Fire:** \`material_class: "GLOWING_LAVA"\`, \`emissive_intensity: 5.0\`, plus a \`FIRE\` particle layer on top.
    * **Metal:** \`material_class: "METAL"\`, \`metalness: 1.0\`.

4.  **The "Multiverse" Rule:**
    * If \`mode\` is "WHAT_IF_REMIX", you must radically change the \`sync_timeline\` and \`stage_assets\`.
    * *Example:* If "No Gravity", objects must float up (\`MOVE_TO\` positive Y).
    * *Example:* If "Ice Planet", change materials to \`GLASS\` (Ice) and add \`FOG\`.
`;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const generateSimulation = async (query: string, mode: "STANDARD" | "WHAT_IF_REMIX"): Promise<SimulationData> => {
  const ai = getAIClient();

  const promptInput = JSON.stringify({
    user_query: query,
    mode: mode
  });

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: promptInput }] }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    // Parse JSON
    const data = JSON.parse(text);
    return data as SimulationData;

  } catch (error) {
    console.error("Simulation Generation Failed:", error);
    throw error;
  }
};

export const chatWithAssistant = async (
  currentHistory: ChatMessage[],
  newMessage: string,
  contextBrief: string
): Promise<string> => {
  const ai = getAIClient();

  const systemInstruction = `You are a helpful science lab assistant. 
  Your Context Brief for this specific simulation is: "${contextBrief}".
  Answer the user's questions based on this context. Keep answers concise (under 50 words) and encouraging.`;

  const history = currentHistory.slice(-6).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    history: history,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I'm having trouble analyzing the data right now.";
};
