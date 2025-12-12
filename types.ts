// Data Models matching the Gemini Prompt Schema

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PBRMaterial {
  material_class: 'GLASS' | 'LIQUID' | 'METAL' | 'PLASTIC' | 'ROCK' | 'GLOWING_LAVA';
  base_color: string;
  roughness: number;
  metalness?: number;
  transmission?: number;
  emissive_intensity?: number;
}

export interface StageAsset {
  id: string;
  type: 'sphere' | 'cube' | 'cylinder' | 'glb_asset' | 'cone' | 'terrain_model';
  initial_transform: {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
  };
  pbr_material: PBRMaterial;
}

export interface VFXEffect {
  id: string;
  effect_type: 'FIRE' | 'SMOKE' | 'SPARKS' | 'CLOUDS' | 'FOG';
  parent_actor_id?: string;
  config: {
    color: string;
    count: number;
    speed: number;
    scale: number;
    opacity: number;
  };
  position_offset?: [number, number, number];
}

export interface UIOverlay {
  target_actor_id: string;
  label_text: string;
  screen_offset: [number, number];
}

export interface VisualAction {
  actor_id: string;
  type: 'MOVE_TO' | 'SCALE_TO' | 'ROTATE_TO' | 'FADE_OUT';
  target_value: number[] | string | number | null; 
  easing?: 'bounce_out' | 'ease_in_out' | 'linear';
}

export interface VisualEvents {
  camera_focus_target: string;
  actions: VisualAction[];
}

export interface UIDisplay {
  chapter_title?: string;
  sidebar_explanation: string;
  chatbot_update: string;
}

export interface TimelineStep {
  step_id: number;
  duration_seconds: number;
  ui_display: UIDisplay;
  visual_events: VisualEvents;
}

export interface SimulationData {
  meta_data: {
    title: string;
    scientific_verdict: string;
    is_remix: boolean;
  };
  visual_settings: {
    environment_preset: string;
    post_processing: {
      bloom_intensity: number;
      vignette: boolean;
    };
  };
  lab_assistant_config: {
    bot_name: string;
    context_brief: string;
    suggested_questions: string[];
  };
  stage_assets: StageAsset[];
  vfx_stack: VFXEffect[];
  ui_overlays: UIOverlay[];
  sync_timeline: TimelineStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
