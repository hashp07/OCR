import React, { useEffect, useState } from 'react';
import { Cpu, Network, Code2, FileText, CodeSquare } from 'lucide-react';

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // The sequence takes exactly 4 seconds before triggering the fade-out
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // 500ms for the exit transition
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020202] overflow-hidden transition-opacity duration-500 ease-in-out ${
      isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>

      {/* --- BACKGROUND VIBE --- */}
      {/* Glowing Tech Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} 
      />
      
     

      {/* Main Container - Widened to max-w-7xl to fit the wider animation */}
      <div className="relative flex items-center justify-center w-full max-w-7xl h-96 z-10">
        
        {/* --- 1. THE INCOMING DOCUMENT --- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-giant-doc z-30 flex flex-col items-center">
          <div className="w-32 h-44 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center transform -skew-x-3 shadow-2xl">
            <FileText className="w-16 h-16 text-white opacity-80" />
          </div>
          <span className="absolute -bottom-8 text-xs text-gray-500 font-bold uppercase tracking-[0.3em] whitespace-nowrap">Raw_Invoice.pdf</span>
        </div>

        {/* --- 2. THE MASSIVE MACHINE CORE --- */}
        <div className="relative z-20 flex flex-col items-center animate-giant-machine-minimal">
          
          {/* The Spinning Engine */}
          <div className="relative w-80 h-80 flex items-center justify-center flex-shrink-0">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#8b5cf6]/30 animate-[spin_10s_linear_infinite_reverse]" />
            {/* Middle Ring */}
            <div className="absolute inset-6 rounded-full border border-[#d946ef]/50 shadow-[0_0_20px_rgba(217,70,239,0.2)] animate-[spin_4s_linear_infinite]" />
            {/* Inner Ring */}
            <div className="absolute inset-12 rounded-full border-4 border-dotted border-[#10b981]/40 animate-[spin_6s_linear_infinite_reverse]" />

            {/* Engine Core */}
            <div className="relative z-10 w-36 h-36 bg-black rounded-full border-2 border-[#d946ef] flex items-center justify-center shadow-[0_0_50px_rgba(217,70,239,0.4)] overflow-hidden">
              <div className="absolute inset-0 bg-[#d946ef] rounded-full blur-xl opacity-20 animate-pulse" />
              <Network className="w-16 h-16 text-[#d946ef] relative z-10" />
              {/* Scanning beam */}
              <div className="absolute inset-0 z-20">
                <div className="w-full h-[3px] bg-white shadow-[0_0_12px_#fff] animate-core-scan" />
              </div>
            </div>
          </div>
          
          {/* Status Pill */}
          <div className="absolute -bottom-8 flex items-center gap-3 bg-[#0a0a0a] px-6 py-3 rounded-full border border-white/10 whitespace-nowrap shadow-xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
            </span>
            <span className="text-[11px] text-gray-300 font-mono uppercase tracking-[0.3em] font-bold">OCRIQ Engine Active</span>
          </div>
        </div>

        {/* --- 3. THE OUTGOING JSON OUTPUT --- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-giant-json z-10 flex flex-col items-center">
          <div className="w-80 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-[#10b981]/30 rounded-2xl p-6 transform skew-x-2 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-3 mb-4 border-b border-[#10b981]/20 pb-3">
              <Code2 className="w-6 h-6 text-[#10b981]" />
              <span className="text-sm text-[#10b981] font-mono tracking-wider">parsed_data.json</span>
            </div>
            <pre className="text-sm text-[#10b981] font-mono leading-loose drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
{`{
  "status": 200,
  "confidence": 0.99,
  "data_extracted": true,
  "engine": "Nova"
}`}
            </pre>
          </div>
        </div>

      </div>

      {/* --- CSS ANIMATIONS --- */}
      <style>{`
        /* 
           FIXED MATH FOR SPACING:
           Pushed the document from -260px to -450px 
           so it rests cleanly outside the left of the engine.
        */
        .animate-giant-doc {
          animation: giant-doc 4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes giant-doc {
          0% { transform: translate(calc(-50% - 600px), -50%) scale(1.1); opacity: 0; }
          15% { transform: translate(calc(-50% - 450px), -50%) scale(1); opacity: 1; }
          30% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; filter: blur(10px); }
          100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }

        .animate-giant-machine-minimal {
          animation: giant-machine-minimal 4s ease-in-out forwards;
        }
        @keyframes giant-machine-minimal {
          0%, 25% { transform: scale(1); opacity: 0.9; }
          35%, 65% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 35px rgba(217,70,239,0.5)); }
          75%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 0px transparent); }
        }

        .animate-core-scan {
          animation: core-scan 1.5s linear infinite;
        }
        @keyframes core-scan {
          0% { transform: translateY(-20px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }

        /* 
           FIXED MATH FOR SPACING:
           Pushed the JSON from +320px to +450px (with a +480px bounce)
           so it clears the right side of the engine completely.
        */
        .animate-giant-json {
          animation: giant-json 4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        @keyframes giant-json {
          0%, 60% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; filter: blur(10px); }
          75% { transform: translate(calc(-50% + 480px), -50%) scale(1.05); opacity: 1; filter: blur(0px); }
          90%, 100% { transform: translate(calc(-50% + 450px), -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}