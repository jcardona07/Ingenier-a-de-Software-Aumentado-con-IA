import React, { useState, useEffect } from 'react';
import { Phase, AppState } from '../types';
import { callGemini, callClaude } from '../services/aiService';
import { PROMPTS } from '../constants';
import { ArtifactViewer } from './ArtifactViewer';
import { Play, Check, X, Edit3, Loader2, AlertTriangle, User, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgentScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

import { VisualEditor } from './VisualEditor';

export const AgentScreen: React.FC<AgentScreenProps> = ({ state, setState }) => {
  const currentPhase = state.phases[state.currentPhaseIndex];
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedArtifact, setEditedArtifact] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const getModelForPhase = (phase: Phase) => {
    if (state.mode === 'Single') return 'Gemini';
    return phase.model;
  };

  const runAgent = async (customInstructions?: string) => {
    setIsRunning(true);
    setError(null);
    
    try {
      const model = getModelForPhase(currentPhase);
      const apiKey = model === 'Gemini' ? state.geminiKey : state.claudeKey;
      const systemPrompt = (PROMPTS as any)[`AGENTE_${currentPhase.id}`];
      
      // Build context
      let context = `PERFIL ORGANIZACIONAL:\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
      context += `HISTORIAL DEL EQUIPO:\n${state.orgContext?.teamHistory}\n\n`;
      context += `IDEA DEL PROYECTO:\n${state.projectIdea}\n\n`;
      
      // Accumulate approved artifacts
      state.phases.slice(0, state.currentPhaseIndex).forEach(p => {
        if (p.artifact) {
          context += `ARTEFACTO APROBADO FASE ${p.id} (${p.name}):\n${JSON.stringify(p.artifact, null, 2)}\n\n`;
        }
      });

      if (customInstructions) {
        context += `INSTRUCCIONES DE CORRECCIÓN (RECHAZO ANTERIOR):\n${customInstructions}\n\n`;
      }

      const userPrompt = "Genera el artefacto para esta fase basándote en el contexto proporcionado.";
      
      let result = "";
      if (model === 'Gemini') {
        result = await callGemini(apiKey, systemPrompt, context + userPrompt);
      } else {
        result = await callClaude(apiKey, systemPrompt, context + userPrompt);
      }

      // Robust JSON Extraction
      const extractJSON = (text: string) => {
        // Busca el primer { o [ y el último } o ]
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        
        let start = -1;
        if (firstBrace === -1) start = firstBracket;
        else if (firstBracket === -1) start = firstBrace;
        else start = Math.min(firstBrace, firstBracket);
        
        if (start === -1) throw new Error("No se encontró JSON en la respuesta");
        
        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);
        
        if (end === -1) throw new Error("JSON incompleto en la respuesta");
        
        const jsonString = text.substring(start, end + 1);
        return JSON.parse(jsonString);
      };

      const parsedArtifact = extractJSON(result);

      setState(prev => {
        const newPhases = [...prev.phases];
        newPhases[state.currentPhaseIndex] = {
          ...newPhases[state.currentPhaseIndex],
          status: 'waiting',
          artifact: parsedArtifact
        };
        return { ...prev, phases: newPhases };
      });
    } catch (err: any) {
      console.error("Agent Error:", err);
      setError(err.message || "Error al ejecutar el agente");
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = () => {
    setState(prev => {
      const newPhases = [...prev.phases];
      newPhases[state.currentPhaseIndex].status = 'approved';
      
      const nextIndex = state.currentPhaseIndex + 1;
      if (nextIndex < newPhases.length) {
        newPhases[nextIndex].status = 'waiting';
        return { ...prev, phases: newPhases, currentPhaseIndex: nextIndex };
      }
      return { ...prev, phases: newPhases };
    });
  };

  const handleReject = () => {
    setShowRejectionInput(true);
  };

  const confirmReject = () => {
    setState(prev => {
      const newPhases = [...prev.phases];
      newPhases[state.currentPhaseIndex].status = 'rejected';
      newPhases[state.currentPhaseIndex].rejectionReason = rejectionReason;
      return { ...prev, phases: newPhases };
    });
    runAgent(rejectionReason);
    setShowRejectionInput(false);
    setRejectionReason("");
  };

  const handleEdit = () => {
    setEditedArtifact(JSON.parse(JSON.stringify(currentPhase.artifact)));
    setEditMode(true);
  };

  const saveEdit = () => {
    setState(prev => {
      const newPhases = [...prev.phases];
      newPhases[state.currentPhaseIndex].artifact = editedArtifact;
      return { ...prev, phases: newPhases };
    });
    setEditMode(false);
  };

  const isGemini = getModelForPhase(currentPhase) === 'Gemini';

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Agent Card */}
      <div className={cn(
        "glass-panel p-6 border-l-4 relative overflow-hidden",
        isGemini ? "border-l-gemini-blue" : "border-l-claude-violet"
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{currentPhase.agentName}</h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                isGemini ? "bg-gemini-blue/20 text-gemini-blue" : "bg-claude-violet/20 text-claude-violet"
              )}>
                {getModelForPhase(currentPhase)}
              </span>
            </div>
            <p className="text-slate-400 font-medium">{currentPhase.specialty}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {currentPhase.status === 'approved' ? (
              <div className="flex items-center gap-2 text-green-400 font-bold bg-green-400/10 px-4 py-2 rounded-lg">
                <Check size={18} /> Aprobado
              </div>
            ) : (
              <button
                onClick={() => runAgent()}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
                  isGemini ? "bg-gemini-blue hover:bg-blue-600" : "bg-claude-violet hover:bg-violet-600",
                  isRunning && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRunning ? <Loader2 className="animate-spin" size={18} /> : <><Play size={18} /> {currentPhase.artifact ? "Regenerar" : "Ejecutar Agente"}</>}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Result Panel */}
      {currentPhase.artifact && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BrainCircuit className="text-teal-400" size={20} />
              {editMode ? "Editor Visual de Artefacto" : "Resultado del Agente"}
            </h3>
            
            {currentPhase.status !== 'approved' && !editMode && (
              <div className="flex items-center gap-2">
                <button onClick={handleEdit} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-white/10">
                  <Edit3 size={16} /> Editar
                </button>
                <button onClick={handleReject} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <X size={16} /> Rechazar
                </button>
                <button onClick={handleApprove} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-500/20">
                  <Check size={16} /> Aprobar
                </button>
              </div>
            )}
          </div>

          {editMode ? (
            <div className="space-y-6">
              <div className="glass-panel p-8">
                <VisualEditor data={editedArtifact} onChange={setEditedArtifact} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditMode(false)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors font-bold">Cancelar</button>
                <button onClick={saveEdit} className="bg-teal-400 text-teal-dark px-8 py-2 rounded-lg font-bold shadow-lg shadow-teal-400/20">Guardar Cambios</button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 min-h-[400px]">
              <ArtifactViewer data={currentPhase.artifact} phaseId={currentPhase.id} />
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionInput && (
        <div className="fixed inset-0 bg-teal-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 shadow-2xl border-red-500/20">
            <h3 className="text-xl font-bold text-white">Motivo del Rechazo</h3>
            <p className="text-sm text-slate-400">Indica al agente qué debe corregir. El agente regenerará el artefacto incorporando tus instrucciones.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-32 bg-teal-dark/50 border border-white/10 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ej: El alcance del MVP es muy grande, quita la funcionalidad de pagos..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectionInput(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={confirmReject} className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold">Confirmar y Regenerar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
