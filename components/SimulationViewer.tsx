import React, { useEffect, useState, useRef } from 'react';
import { SimulationData, StageAsset, VFXEffect } from '../types';
import { Box, Move3d, Maximize, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

interface SimulationViewerProps {
  data: SimulationData | null;
  currentStepIndex: number;
}

const UNIT_SCALE = 50;
const CAM_DAMPING = 0.08; 
const ZOOM_SENSITIVITY = 0.5;
const ORBIT_SENSITIVITY = 0.4;

const getFaceStyle = (asset: StageAsset, baseColor: string, type: 'side' | 'top' | 'bottom' | 'cap' = 'side') => {
  const { pbr_material } = asset;
  
  const style: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden', 
    backgroundColor: baseColor,
    border: '1px solid rgba(0,0,0,0.1)', // Subtle dark border for light mode
  };

  // LIGHT MODE SHADERS
  if (pbr_material.material_class === 'METAL') {
    if (type === 'top' || type === 'bottom') {
       style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, ${baseColor} 50%, #334155 90%)`;
    } else {
       style.background = `linear-gradient(135deg, ${baseColor} 0%, #ffffff 40%, ${baseColor} 60%, #475569 100%)`;
    }
  } 
  else if (pbr_material.material_class === 'GLASS') {
    style.backgroundColor = 'rgba(56, 189, 248, 0.2)'; // Light Sky Blue tint
    style.boxShadow = 'inset 0 0 20px rgba(255,255,255,0.8)';
    style.backdropFilter = 'blur(1px)';
    style.backfaceVisibility = 'visible'; 
    style.border = '1px solid rgba(14, 165, 233, 0.3)';
  }
  else if (pbr_material.material_class === 'GLOWING_LAVA') {
     style.background = type === 'top' 
       ? `radial-gradient(circle, #fff, ${baseColor}, #991b1b)`
       : `linear-gradient(to bottom, ${baseColor}, #ea580c, #7f1d1d)`;
     style.boxShadow = `0 0 30px ${baseColor}`; // Reduced glow spread for white bg
  }
  else {
     // Standard Matte
     style.background = type === 'top' 
        ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${baseColor} 60%, #334155)` 
        : `linear-gradient(to right, #334155, ${baseColor} 20%, ${baseColor} 80%, #334155)`;
  }

  return style;
};


const SimulationViewer: React.FC<SimulationViewerProps> = ({ data, currentStepIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Camera State
  const targetCam = useRef({
    orbitX: 20,     
    orbitY: 0,      
    zoom: -450,     
    panX: 0,
    panY: 0,
    autoRotate: true 
  });

  const currentCam = useRef({
    orbitX: 20,
    orbitY: 0,
    zoom: -450,
    panX: 0,
    panY: 0
  });

  const controls = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastOrbitX: 0,
    lastOrbitY: 0
  });

  const [actorTransforms, setActorTransforms] = useState<Record<string, any>>({});
  const [renderTransform, setRenderTransform] = useState('');
  
  // --- ACTIONS ---
  const handleZoom = (direction: 'IN' | 'OUT') => {
      targetCam.current.zoom += direction === 'IN' ? 150 : -150;
      targetCam.current.zoom = Math.max(-1500, Math.min(-100, targetCam.current.zoom));
      targetCam.current.autoRotate = false;
  };

  const setView = (view: 'FRONT' | 'TOP' | 'SIDE' | 'RESET') => {
      targetCam.current.autoRotate = false;
      targetCam.current.panX = 0;
      targetCam.current.panY = 0;
      
      switch(view) {
          case 'FRONT':
              targetCam.current.orbitX = 0;
              targetCam.current.orbitY = 0;
              targetCam.current.zoom = -400;
              break;
          case 'TOP':
              targetCam.current.orbitX = 90;
              targetCam.current.orbitY = 0;
              targetCam.current.zoom = -600;
              break;
          case 'SIDE':
              targetCam.current.orbitX = 0;
              targetCam.current.orbitY = 90;
              targetCam.current.zoom = -400;
              break;
          case 'RESET':
              targetCam.current.orbitX = 20;
              targetCam.current.orbitY = 0;
              targetCam.current.zoom = -450;
              targetCam.current.autoRotate = true;
              break;
      }
  };

  // Initialize Actors
  useEffect(() => {
    if (!data) return;
    const initialTrans: any = {};
    data.stage_assets.forEach(asset => {
      initialTrans[asset.id] = {
        pos: asset.initial_transform.position,
        rot: asset.initial_transform.rotation,
        scale: asset.initial_transform.scale,
        opacity: 1,
        color: asset.pbr_material.base_color,
      };
    });
    setActorTransforms(initialTrans);
  }, [data]);

  // Timeline Updates
  useEffect(() => {
    if (!data?.sync_timeline[currentStepIndex]) return;
    const actions = data.sync_timeline[currentStepIndex].visual_events.actions;
    
    setActorTransforms(prev => {
      const next = { ...prev };
      actions.forEach(action => {
        if (!next[action.actor_id]) return;
        next[action.actor_id] = { ...next[action.actor_id] };
        if (action.type === 'MOVE_TO' && Array.isArray(action.target_value)) next[action.actor_id].pos = action.target_value;
        else if (action.type === 'ROTATE_TO' && Array.isArray(action.target_value)) next[action.actor_id].rot = action.target_value;
        else if (action.type === 'SCALE_TO' && Array.isArray(action.target_value)) next[action.actor_id].scale = action.target_value;
        else if (action.type === 'FADE_OUT') next[action.actor_id].opacity = 0;
      });
      return next;
    });

    const focusTargetId = data.sync_timeline[currentStepIndex].visual_events.camera_focus_target;
    if (focusTargetId && actorTransforms[focusTargetId]) {
       const t = actorTransforms[focusTargetId];
       targetCam.current.panX = -t.pos[0] * UNIT_SCALE;
       targetCam.current.panY = t.pos[1] * UNIT_SCALE; 
    }
  }, [currentStepIndex, data, actorTransforms]); 

  // --- INPUT HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    containerRef.current?.setPointerCapture(e.pointerId);
    setIsInteracting(true);
    controls.current.isDragging = true;
    controls.current.startX = e.clientX;
    controls.current.startY = e.clientY;
    controls.current.lastOrbitX = targetCam.current.orbitX;
    controls.current.lastOrbitY = targetCam.current.orbitY;
    targetCam.current.autoRotate = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!controls.current.isDragging) return;
    const deltaX = e.clientX - controls.current.startX;
    const deltaY = e.clientY - controls.current.startY;
    targetCam.current.orbitY = controls.current.lastOrbitY + deltaX * ORBIT_SENSITIVITY;
    targetCam.current.orbitX = Math.max(-90, Math.min(90, controls.current.lastOrbitX - deltaY * ORBIT_SENSITIVITY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    controls.current.isDragging = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    targetCam.current.zoom += e.deltaY * -1 * ZOOM_SENSITIVITY;
    targetCam.current.zoom = Math.max(-1500, Math.min(-100, targetCam.current.zoom));
    targetCam.current.autoRotate = false;
  };

  // --- RENDER LOOP ---
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (targetCam.current.autoRotate && !controls.current.isDragging) {
         targetCam.current.orbitY += 0.05; 
      }

      currentCam.current.orbitX += (targetCam.current.orbitX - currentCam.current.orbitX) * CAM_DAMPING;
      currentCam.current.orbitY += (targetCam.current.orbitY - currentCam.current.orbitY) * CAM_DAMPING;
      currentCam.current.zoom += (targetCam.current.zoom - currentCam.current.zoom) * CAM_DAMPING;
      currentCam.current.panX += (targetCam.current.panX - currentCam.current.panX) * CAM_DAMPING;
      currentCam.current.panY += (targetCam.current.panY - currentCam.current.panY) * CAM_DAMPING;

      const transform = `
        translate3d(0, 0, ${currentCam.current.zoom}px)
        rotateX(${currentCam.current.orbitX}deg)
        rotateY(${currentCam.current.orbitY}deg)
        translate3d(${currentCam.current.panX}px, ${currentCam.current.panY}px, 0px)
      `;
      setRenderTransform(transform);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []); 

  if (!data) return <div className="w-full h-full flex items-center justify-center text-slate-300 font-mono tracking-widest text-sm">INITIALIZING RENDERER...</div>;

  const renderGeometry = (asset: StageAsset, tr: any) => {
    const size = 140; 
    const color = tr.color;
    const scaleStyle = {
         width: asset.type === 'cylinder' ? 100 : 140, 
         height: asset.type === 'cylinder' ? 180 : 140,
         transform: `translate3d(${tr.pos[0]*UNIT_SCALE}px, ${-tr.pos[1]*UNIT_SCALE}px, ${tr.pos[2]*UNIT_SCALE}px) rotateX(${tr.rot[0]}deg) rotateY(${tr.rot[1]}deg) rotateZ(${tr.rot[2]}deg) scale(${tr.scale[0]}, ${tr.scale[1]})`
    };

    return (
        <div key={asset.id} className="preserve-3d absolute">
             {/* Simple Shadow for Light Mode */}
             <div className="absolute bg-slate-900 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-lg opacity-20"
                  style={{ width: '120px', height: '120px', transform: `translate3d(${tr.pos[0]*UNIT_SCALE}px, 30px, ${tr.pos[2]*UNIT_SCALE}px) rotateX(90deg)` }} />
             
             <div className="absolute flex items-center justify-center preserve-3d transition-transform duration-500" style={scaleStyle}>
                 {asset.type === 'cube' && (
                    <div className="w-full h-full preserve-3d">
                        {['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)'].map((r, i) => (
                            <div key={i} style={{ ...getFaceStyle(asset, color), transform: `${r} translateZ(70px)` }} />
                        ))}
                        <div style={{ ...getFaceStyle(asset, color, 'top'), transform: `rotateX(90deg) translateZ(70px)` }} />
                        <div style={{ ...getFaceStyle(asset, color, 'bottom'), transform: `rotateX(-90deg) translateZ(70px)` }} />
                    </div>
                 )}
                 {asset.type === 'sphere' && (
                    <div className="w-full h-full preserve-3d rounded-full relative">
                        <div className="absolute inset-0 rounded-full" style={{ background: color }} />
                        {/* Light Mode Sphere Shader - Dark Shadow Edge instead of white glow */}
                        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.4) 100%)' }} />
                    </div>
                 )}
                 {asset.type === 'cylinder' && (
                    <div className="w-full h-full preserve-3d">
                        {[0,60,120].map(deg => <div key={deg} style={{ ...getFaceStyle(asset, color), transform: `rotateY(${deg}deg)` }} />)}
                        <div style={{ ...getFaceStyle(asset, color, 'top'), borderRadius: '50%', width: 100, height: 100, transform: `rotateX(90deg) translateZ(90px)` }} />
                        <div style={{ ...getFaceStyle(asset, color, 'bottom'), borderRadius: '50%', width: 100, height: 100, transform: `rotateX(-90deg) translateZ(90px)` }} />
                    </div>
                 )}
             </div>
        </div>
    );
  };

  const renderVFX = (vfx: VFXEffect) => {
    let basePos = [0, 0, 0];
    if (vfx.parent_actor_id && actorTransforms[vfx.parent_actor_id]) {
        basePos = [...actorTransforms[vfx.parent_actor_id].pos];
    }
    const x = basePos[0] * UNIT_SCALE + (vfx.position_offset?.[0] || 0);
    const y = -basePos[1] * UNIT_SCALE - (vfx.position_offset?.[1] || 0);
    const z = basePos[2] * UNIT_SCALE + (vfx.position_offset?.[2] || 0);

    return (
        <div key={vfx.id} className="absolute preserve-3d" style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
            {/* Darker blend mode for light background visibility if needed, but 'screen' usually works ok for glowing particles */}
            <div className="w-6 h-6 rounded-full bg-white blur-md animate-pulse" 
                 style={{ backgroundColor: vfx.config.color, opacity: 0.6 }} />
        </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-[#f8fafc] perspective-container select-none font-sans cursor-move"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      
      {/* CAMERA CONTROLS UI - CLEAN WHITE */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
         
         {/* ZOOM BUTTONS */}
         <div className="ui-panel rounded-lg flex flex-col overflow-hidden">
             <button onClick={() => handleZoom('IN')} className="p-3 hover:bg-slate-50 border-b border-slate-100 flex justify-center text-sci-text" title="Zoom In">
                 <ZoomIn className="w-5 h-5" />
             </button>
             <button onClick={() => handleZoom('OUT')} className="p-3 hover:bg-slate-50 flex justify-center text-sci-text" title="Zoom Out">
                 <ZoomOut className="w-5 h-5" />
             </button>
         </div>

         {/* VIEW CONTROLS */}
         <div className="ui-panel rounded-lg p-2 flex flex-col gap-1">
            <button onClick={() => setView('FRONT')} className="p-2 hover:bg-slate-50 rounded text-sci-text text-[10px] font-bold flex items-center gap-2" title="Front View">
               <Box className="w-4 h-4 text-sci-accent" /> FRONT
            </button>
            <button onClick={() => setView('TOP')} className="p-2 hover:bg-slate-50 rounded text-sci-text text-[10px] font-bold flex items-center gap-2" title="Top View">
               <Move3d className="w-4 h-4 text-sci-accent" /> TOP
            </button>
            <button onClick={() => setView('SIDE')} className="p-2 hover:bg-slate-50 rounded text-sci-text text-[10px] font-bold flex items-center gap-2" title="Side View">
               <Maximize className="w-4 h-4 text-sci-accent" /> SIDE
            </button>
            <div className="h-[1px] bg-slate-200 w-full my-1" />
            <button onClick={() => setView('RESET')} className="p-2 hover:bg-slate-50 rounded text-sci-subtext text-[10px] font-bold flex items-center gap-2" title="Reset Camera">
               <RefreshCcw className="w-4 h-4" /> RESET
            </button>
         </div>
      </div>

      {/* 3D WORLD */}
      <div 
         className="w-full h-full preserve-3d will-change-transform"
         style={{ transform: renderTransform }}
      >
        {/* FLOOR GRID - Dark lines on Light BG */}
        <div 
             className="absolute w-[4000px] h-[4000px] top-[-2000px] left-[-2000px]"
             style={{
               transform: 'rotateX(90deg) translateZ(-200px)', 
               backgroundImage: `
                 linear-gradient(rgba(30, 41, 59, 0.05) 1px, transparent 1px), 
                 linear-gradient(90deg, rgba(30, 41, 59, 0.05) 1px, transparent 1px)
               `,
               backgroundSize: '100px 100px',
               maskImage: 'radial-gradient(circle at 50% 50%, black 10%, transparent 60%)'
             }}
        />

        <div className="absolute top-1/2 left-1/2 w-0 h-0 preserve-3d">
            {data.stage_assets.map(asset => renderGeometry(asset, actorTransforms[asset.id] || { pos:[0,0,0], rot:[0,0,0], scale:[1,1,1], color:'#fff' }))}
            {data.vfx_stack.map(vfx => renderVFX(vfx))}
            
            {/* LABELS */}
            {data.ui_overlays.map((overlay, i) => {
                 const t = actorTransforms[overlay.target_actor_id];
                 if (!t) return null;
                 const x = t.pos[0] * UNIT_SCALE + overlay.screen_offset[0];
                 const y = -t.pos[1] * UNIT_SCALE - overlay.screen_offset[1];
                 return (
                     <div key={i} className="absolute z-40 px-3 py-1 bg-white border border-sci-accent text-sci-text text-[11px] font-bold rounded shadow-lg whitespace-nowrap"
                          style={{ transform: `translate3d(${x}px, ${y}px, 0px) rotateY(${-currentCam.current.orbitY}deg) rotateX(${-currentCam.current.orbitX}deg)` }}>
                        {overlay.label_text}
                     </div>
                 )
            })}
        </div>
      </div>
    </div>
  );
};

export default SimulationViewer;
