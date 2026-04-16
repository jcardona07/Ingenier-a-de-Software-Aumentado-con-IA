/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppState, INITIAL_PHASES } from './types';
import { SetupScreen } from './components/SetupScreen';
import { AgentScreen } from './components/AgentScreen';
import { SidePanel } from './components/SidePanel';
import { StepIndicator } from './components/StepIndicator';
import { Layout, Menu, ChevronLeft, BrainCircuit } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [state, setState] = useState<AppState>({
    mode: 'Single',
    geminiKey: '',
    claudeKey: '',
    isGeminiVerified: false,
    isClaudeVerified: false,
    orgContext: null,
    currentPhaseIndex: 0,
    phases: INITIAL_PHASES,
    projectIdea: '',
  });

  const handlePhaseClick = (index: number) => {
    // Can only navigate to approved phases or the current active phase
    if (state.phases[index].status !== 'locked' || index === state.currentPhaseIndex) {
      setState(prev => ({ ...prev, currentPhaseIndex: index }));
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-teal-dark overflow-x-hidden">
        <SetupScreen state={state} setState={setState} onStart={() => setIsStarted(true)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-teal-dark overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-20 border-b border-white/10 bg-teal-dark/50 backdrop-blur-xl flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsStarted(false)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-teal-400 flex items-center justify-center shadow-lg shadow-teal-400/20">
                <BrainCircuit className="text-teal-dark" size={24} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">AI Lifecycle</h1>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Framework</p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            {state.phases.map((phase, index) => (
              <StepIndicator
                key={phase.id}
                phaseNumber={phase.id}
                status={phase.status}
                isActive={state.currentPhaseIndex === index}
                onClick={() => handlePhaseClick(index)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Modo</div>
              <div className={cn(
                "text-xs font-bold",
                state.mode === 'Single' ? "text-gemini-blue" : "text-claude-violet"
              )}>
                {state.mode} LLM
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Menu size={16} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Active Agent Screen */}
        <AgentScreen state={state} setState={setState} />
      </div>

      {/* Side Panel */}
      <SidePanel phases={state.phases} currentPhaseIndex={state.currentPhaseIndex} />
    </div>
  );
}
