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
import { MetricsPanel } from './components/MetricsPanel';
import { ExperimentSummary } from './components/ExperimentSummary';
import { Layout, Menu, ChevronLeft, BrainCircuit, Database, XCircle, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { callGemini } from './services/aiService';
import { PROMPTS } from './constants';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>({
    mode: 'Single',
    experimentMode: 'full',
    ragActive: true,
    geminiKey: '',
    claudeKey: '',
    isGeminiVerified: false,
    isClaudeVerified: false,
    orgContext: null,
    teamRepoUrl: '',
    teamRepoContext: null,
    currentPhaseIndex: 0,
    phases: INITIAL_PHASES,
    projectIdea: '',
    experimentMetrics: [],
  });

  const startAutomaticVision = async (latestState: AppState) => {
    setIsPreparing(true);
    setPrepareError(null);
    try {
      const apiKey = latestState.geminiKey;
      const systemPrompt = PROMPTS.AGENTE_0;
      
      let context = `INFORMACIÓN DE CONTEXTO CRÍTICA (UTILIZA ESTOS DATOS PARA CUMPLIR ESTÁNDARES Y CONSISTENCIA):\n\n`;
      context += `1. PERFIL ORGANIZACIONAL (Empresa, Sector, Stack, Estándares, DoD, Restricciones):\n${JSON.stringify(latestState.orgContext, null, 2)}\n\n`;
      context += `2. HISTORIAL DEL EQUIPO (Contexto narrativo):\n${latestState.orgContext?.teamHistory}\n\n`;
      if (latestState.teamRepoContext && latestState.ragActive) {
        context += `3. REPOSITORIO DEL EQUIPO (Datos estructurados JSON con antecedentes técnicos y de gestión):\n${JSON.stringify(latestState.teamRepoContext, null, 2)}\n\n`;
      }
      context += `4. IDEA DEL PROYECTO ACTUAL (Objetivo del ciclo):\n${latestState.projectIdea}\n\n`;
      
      const userPrompt = "Genera el artefacto para esta fase basándote en el contexto proporcionado.";
      
      const result = await callGemini(apiKey, systemPrompt, context + userPrompt);
      
      const extractJSON = (text: string) => {
        text = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        let start = -1;
        if (firstBrace === -1) start = firstBracket;
        else if (firstBracket === -1) start = firstBrace;
        else start = Math.min(firstBrace, firstBracket);
        
        if (start === -1) throw new Error("No se encontro JSON");
        
        let depth = 0;
        let inString = false;
        let escape = false;
        let end = -1;
        const openChar = text[start];
        const closeChar = openChar === '{' ? '}' : ']';
        
        for (let i = start; i < text.length; i++) {
          const c = text[i];
          if (escape) { escape = false; continue; }
          if (c === '\\' && inString) { escape = true; continue; }
          if (c === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (c === openChar || c === '{' || c === '[') depth++;
          if (c === closeChar || c === '}' || c === ']') {
            depth--;
            if (depth === 0) { end = i; break; }
          }
        }
        
        if (end === -1) throw new Error("JSON incompleto");
        
        let jsonString = text.substring(start, end + 1);
        jsonString = jsonString.replace(/("(?:[^"\\]|\\.)*")/g, match =>
          match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
        );
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        
        return JSON.parse(jsonString);
      };
      
      const parsedArtifact = extractJSON(result);
      
      setState(prev => {
        const newPhases = [...prev.phases];
        newPhases[0] = {
          ...newPhases[0],
          status: 'approved',
          artifact: parsedArtifact,
        };
        newPhases[1] = {
          ...newPhases[1],
          status: 'waiting',
        };
        return {
          ...prev,
          phases: newPhases,
          currentPhaseIndex: 1,
        };
      });
      setIsStarted(true);
    } catch (err: any) {
      console.error("Error running AGENTE_0 automatically:", err);
      setPrepareError(err.message || "Error al preparar el proyecto con el Agente de Visión.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePhaseClick = (index: number) => {
    // Can only navigate to approved phases or the current active phase
    if (state.phases[index].status !== 'locked' || index === state.currentPhaseIndex) {
      setState(prev => ({ ...prev, currentPhaseIndex: index }));
    }
  };

  if (!isStarted) {
    if (isPreparing) {
      return (
        <div className="min-h-screen bg-teal-dark flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-400 flex items-center justify-center shadow-lg shadow-teal-400/20 animate-pulse">
            <BrainCircuit className="text-teal-dark" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white animate-pulse">Preparando el contexto del proyecto</h2>
            <p className="text-slate-400 max-w-sm text-sm mx-auto">El Agente de Visión está procesando tu idea junto con el perfil organizacional para construir la visión estructurada del producto...</p>
          </div>
          <div className="flex items-center gap-2 text-teal-400 text-sm font-semibold">
            <Loader2 className="animate-spin" size={18} />
            <span>Generando Visión del Producto (MVP, Actores y Alcance)...</span>
          </div>
        </div>
      );
    }

    if (prepareError) {
      return (
        <div className="min-h-screen bg-teal-dark flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg">
            <XCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Error de Preparación</h2>
            <p className="text-slate-400 max-w-md text-sm mx-auto">Ocurrió un problema de red o de API al preparar la fase de Visión automática:</p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-lg text-red-300 font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap text-left mx-auto">
              {prepareError}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setPrepareError(null);
                setIsStarted(false);
              }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-white/10"
            >
              Volver a Configurar
            </button>
            <button
              onClick={() => startAutomaticVision(state)}
              className="px-8 py-2.5 bg-teal-400 hover:bg-teal-500 text-teal-dark rounded-xl font-bold text-sm transition-colors shadow-lg shadow-teal-400/20"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-teal-dark overflow-x-hidden">
        <SetupScreen state={state} setState={setState} onStart={(updatedState) => startAutomaticVision(updatedState)} />
      </div>
    );
  }

  const stagesToMonitor = [1, 2, 3, 4];
  const allFourStagesApproved = stagesToMonitor.every(id => {
    const phase = state.phases.find(p => p.id === id);
    return phase && phase.status === 'approved';
  });

  if (showSummary) {
    return (
      <div className="flex h-screen bg-teal-dark overflow-hidden">
        <ExperimentSummary state={state} onClose={() => setShowSummary(false)} />
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
                <h1 className="text-sm font-bold text-white leading-none">Software IA</h1>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Aumentada</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar px-4">
            {state.phases.filter(p => state.experimentMode === 'research' ? [1, 2, 3, 4].includes(p.id) : p.id !== 0).map((phase, index) => {
              const actualIndex = state.phases.findIndex(p => p.id === phase.id);
              let displayId = phase.id;
              let displayName = phase.name;
              
              if (state.experimentMode === 'research') {
                if (phase.id === 1) { displayId = 1; displayName = "Etapa 1"; }
                if (phase.id === 2) { displayId = 2; displayName = "Etapa 2"; }
                if (phase.id === 3) { displayId = 3; displayName = "Etapa 3"; }
                if (phase.id === 4) { displayId = 4; displayName = "Etapa 4"; }
              }

              return (
                <StepIndicator
                  key={phase.id}
                  phaseNumber={displayId}
                  label={state.experimentMode === 'research' ? displayName : undefined}
                  status={phase.status}
                  isActive={state.currentPhaseIndex === actualIndex}
                  onClick={() => handlePhaseClick(actualIndex)}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {allFourStagesApproved && (
              <button
                onClick={() => setShowSummary(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-teal-dark font-extrabold text-xs rounded-xl transition-all shadow-lg hover:shadow-teal-400/20 mr-2 flex items-center gap-1 cursor-pointer select-none border border-teal-300/30 font-sans tracking-tight"
                title="Ver Resumen del Experimento"
                id="btn-ver-resumen"
              >
                Ver Resumen del Experimento
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Database size={12} className={cn(state.ragActive ? "text-teal-400" : "text-slate-500")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-wider", state.ragActive ? "text-teal-400" : "text-slate-500")}>
                RAG {state.ragActive ? 'ON' : 'OFF'}
              </span>
            </div>
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
        </div>
      </header>

        {/* Active Agent Screen */}
        <AgentScreen state={state} setState={setState} />
      </div>

      {/* Side Panel */}
      <SidePanel phases={state.phases} currentPhaseIndex={state.currentPhaseIndex} />

      {/* Experiment Metrics Panel */}
      <MetricsPanel state={state} />
    </div>
  );
}
