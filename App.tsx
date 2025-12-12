import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Zap, Search, Activity, Layers, BookOpen } from 'lucide-react';
import { generateSimulation } from './services/geminiService';
import SimulationViewer from './components/SimulationViewer';
import ChatInterface from './components/ChatInterface';
import { SimulationData, ChatMessage } from './types';

const INITIAL_QUERY = "Show me the solar system";

function App() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [mode, setMode] = useState<'STANDARD' | 'WHAT_IF_REMIX'>('STANDARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SimulationData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Timeline Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPlaying && data) {
      const stepDuration = (data.sync_timeline[currentStep]?.duration_seconds || 2) * 1000;
      timer = setTimeout(() => {
        if (currentStep < data.sync_timeline.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, stepDuration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, data]);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentStep(0);
    setChatMessages([]);
    try {
      const result = await generateSimulation(query, mode);
      setData(result);
      setChatMessages([{ id: 'init', role: 'assistant', text: `Ready! I've loaded the simulation for: "${result.meta_data.title}". Ask me anything!` }]);
      setTimeout(() => setIsPlaying(true), 500);
    } catch (e: any) {
      setError(e.message || "Simulation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-sci-base text-sci-text font-sans overflow-hidden select-none">
      
      {/* LAYER 0: SIMULATION VIEWER (Fullscreen Background) */}
      <div className="absolute inset-0 z-0">
        <SimulationViewer data={data} currentStepIndex={currentStep} />
      </div>

      {/* LAYER 1: HEADER HUD (Clean White Bar) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none flex justify-between items-start">
         
         {/* Branding */}
         <div className="pointer-events-auto ui-panel rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-sci-accent text-white rounded-lg flex items-center justify-center shadow-md">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-base font-bold tracking-tight text-sci-text">Science Wiki</h1>
               <p className="text-[10px] text-sci-subtext font-mono font-bold uppercase">Omni-Engine V16</p>
            </div>
         </div>

         {/* Search Module */}
         <div className="pointer-events-auto flex items-center gap-2 ui-panel rounded-xl p-2">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sci-subtext" />
                <input 
                   type="text" 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                   placeholder="What do you want to learn?"
                   className="w-72 bg-slate-50 border border-sci-border rounded-lg px-3 pl-10 py-2.5 text-sm text-sci-text focus:outline-none focus:border-sci-accent focus:ring-1 focus:ring-sci-accent transition-all font-medium placeholder:text-slate-400"
                />
             </div>
             
             <button 
                onClick={() => setMode(m => m === 'STANDARD' ? 'WHAT_IF_REMIX' : 'STANDARD')}
                className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition-all ${mode === 'WHAT_IF_REMIX' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-sci-border text-sci-subtext hover:bg-slate-50'}`}
                title="Remix Mode creates 'What If' scenarios"
             >
                {mode === 'WHAT_IF_REMIX' ? 'REMIX MODE' : 'STANDARD'}
             </button>

             <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-sci-accent hover:bg-sci-accentHover text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
             >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {loading ? 'BUILDING...' : 'EXPLORE'}
             </button>
         </div>

         {/* Sidebar Toggle */}
         <div className="pointer-events-auto">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`p-3 rounded-xl border transition-all shadow-sm ${isSidebarOpen ? 'bg-sci-accent text-white border-sci-accent' : 'bg-white border-sci-border text-sci-subtext'}`}>
               <Layers className="w-6 h-6" />
            </button>
         </div>
      </div>

      {/* LAYER 2: PLAYBACK CONTROLS (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
         <div className="ui-panel rounded-2xl px-6 py-4 flex items-center gap-6">
            <button 
               onClick={() => setIsPlaying(!isPlaying)}
               disabled={!data}
               className="w-14 h-14 flex items-center justify-center rounded-full bg-sci-accent text-white hover:scale-105 hover:bg-sci-accentHover transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
            >
               {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
            </button>
            
            <div className="flex flex-col gap-2 w-96">
               <div className="flex justify-between text-[11px] font-bold text-sci-subtext tracking-wide uppercase">
                  <span>{data ? data.sync_timeline[currentStep]?.ui_display.chapter_title || 'Simulation Ready' : 'Welcome'}</span>
                  <span>Step {currentStep + 1} / {data ? data.sync_timeline.length : '-'}</span>
               </div>
               {/* Progress Bar */}
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 border border-slate-200">
                  {data?.sync_timeline.map((step, idx) => (
                      <div 
                         key={idx}
                         onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                         className={`h-full cursor-pointer transition-colors ${idx === currentStep ? 'bg-sci-accent' : idx < currentStep ? 'bg-blue-200' : 'bg-transparent'}`}
                         style={{ width: `${100 / data.sync_timeline.length}%` }}
                      />
                  ))}
               </div>
            </div>

            <button 
               onClick={() => { setCurrentStep(0); setIsPlaying(true); }}
               className="text-sci-subtext hover:text-sci-accent transition-colors p-2 rounded-full hover:bg-slate-50"
               title="Restart"
            >
               <RefreshCw className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* LAYER 3: SIDEBAR (Clean Card) */}
      <div className={`absolute top-24 right-4 bottom-24 z-20 w-80 transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <div className="h-full ui-panel rounded-xl overflow-hidden flex flex-col">
            {/* Context Header */}
            <div className="p-4 border-b border-sci-border bg-slate-50/50">
               <h2 className="text-xs font-bold text-sci-subtext uppercase tracking-widest mb-1">AI Guide</h2>
               <div className="flex items-center gap-2 text-sci-accent">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-bold">{data ? 'Online' : 'Waiting for Topic'}</span>
               </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-hidden relative bg-white">
               {data ? (
                 <ChatInterface 
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    contextBrief={data.lab_assistant_config.context_brief}
                    botName={data.lab_assistant_config.bot_name}
                    suggestedQuestions={data.lab_assistant_config.suggested_questions}
                 />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-sci-subtext p-6 text-center">
                    <p className="text-sm">Type a topic above and click <b>Explore</b> to start learning!</p>
                 </div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
}

export default App;
