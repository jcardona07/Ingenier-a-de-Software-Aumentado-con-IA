import React, { useState, useEffect } from 'react';
import { Phase, AppState } from '../types';
import { callGemini, callClaude } from '../services/aiService';
import { PROMPTS } from '../constants';
import { ArtifactViewer } from './ArtifactViewer';
import { Play, Check, X, Edit3, Loader2, AlertTriangle, User, BrainCircuit, Database } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgentScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

import { VisualEditor } from './VisualEditor';

const buildCompactRAG = (repo: any): string => {
  if (!repo) return "";
  const velocity_avg = repo.velocity?.avg_points_per_sprint ?? "N/A";
  const overall_accuracy = repo.patterns?.estimation_precision?.overall_accuracy ?? "N/A";
  const tendency = repo.patterns?.estimation_precision?.tendency ?? "N/A";

  let storiesStr = "";
  const projects = repo.projects || [];
  if (Array.isArray(projects)) {
    projects.forEach((proj: any) => {
      const userStories = proj.user_stories || [];
      if (Array.isArray(userStories)) {
        userStories.forEach((story: any) => {
          const id = story.id ?? "N/A";
          const title = story.title ?? "N/A";
          const estimated_points = story.estimated_points ?? "N/A";
          const real_points = story.real_points ?? "N/A";
          const task_type = story.task_type ?? "N/A";
          const ext_int = story.external_integration ?? story.external_integration_needed ?? "N/A";
          const difficulty = story.difficulty ?? "N/A";
          const lessons = Array.isArray(story.lessons) ? story.lessons.join(", ") : (story.lessons ?? "N/A");
          
          storiesStr += `ID: ${id} | Título: ${title} | Puntos estimados: ${estimated_points} | Puntos reales: ${real_points} | Tipo tarea: ${task_type} | Integración externa: ${ext_int} | Dificultad: ${difficulty} | Lección: ${lessons}\n`;
        });
      }
    });
  }

  const ext_add_points = repo.patterns?.adjustment_factors?.external_integration?.avg_additional_points ?? "N/A";
  const tech_mult = repo.patterns?.adjustment_factors?.new_technology?.multiplier ?? "N/A";
  const reg_add_points = repo.patterns?.adjustment_factors?.regulatory_compliance?.avg_additional_points ?? "N/A";

  return `ANALOGÍAS DISPONIBLES DEL HISTORIAL DEL EQUIPO:
Velocidad real del equipo: ${velocity_avg} SP por sprint
Precisión histórica: ${overall_accuracy}
Tendencia: ${tendency}

Historias completadas disponibles para analogía:
${storiesStr || "Ninguna historia disponible para analogía.\n"}
Factores de ajuste del equipo:
- Integración externa: suma ${ext_add_points} puntos
- Tecnología nueva: multiplica por ${tech_mult}
- Cumplimiento normativo: suma ${reg_add_points} puntos`;
};


export const AgentScreen: React.FC<AgentScreenProps> = ({ state, setState }) => {
  const currentPhase = state.phases[state.currentPhaseIndex];
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedArtifact, setEditedArtifact] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  
  // Metrics local state
  const [attempts, setAttempts] = useState(1);
  const [lastRunStartTime, setLastRunStartTime] = useState<number | null>(null);
  const [totalPhaseDuration, setTotalPhaseDuration] = useState(0);

  // Reset metrics when phase changes
  useEffect(() => {
    setAttempts(1);
    setLastRunStartTime(null);
    setTotalPhaseDuration(0);
    setError(null);
    setEditMode(false);
    setEditedArtifact(null);

    // Auto-run Phase 1 if in research mode and has no artifact
    if (state.experimentMode === 'research' && currentPhase.id === 1 && currentPhase.status === 'waiting' && !currentPhase.artifact) {
      runAgent();
    }
  }, [state.currentPhaseIndex]);

  const getModelForPhase = (phase: Phase) => {
    if (state.mode === 'Single') return 'Gemini';
    if (phase.id === 0 || phase.id === 1 || phase.id === 2) return 'Gemini';
    if (phase.id === 3 || phase.id === 4) return 'Claude';
    return phase.model;
  };

  const runAgent = async (customInstructions?: string) => {
    setIsRunning(true);
    setError(null);
    const startTime = Date.now();
    setLastRunStartTime(startTime);
    
    try {
      const model = getModelForPhase(currentPhase);
      const apiKey = model === 'Gemini' ? state.geminiKey : state.claudeKey;
      const systemPrompt = (PROMPTS as any)[`AGENTE_${currentPhase.id}`];
      
      // Build context custom per phase based on requirements
      let context = "";
      if (currentPhase.id === 1) {
        context += `PERFIL ORGANIZACIONAL:\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
        if (state.ragActive && state.teamRepoContext) {
          context += `HISTORIAL DEL EQUIPO DESDE RAG:\n${JSON.stringify(state.teamRepoContext, null, 2)}\n\n`;
        } else if (state.orgContext?.teamHistory) {
          context += `HISTORIAL DEL EQUIPO (Contexto narrativo):\n${state.orgContext?.teamHistory}\n\n`;
        }
        const phase0Artifact = state.phases.find(p => p.id === 0)?.artifact;
        if (phase0Artifact) {
          context += `VISIÓN APROBADA DEL PRODUCTO:\n${JSON.stringify(phase0Artifact, null, 2)}\n\n`;
        }
      } else if (currentPhase.id === 2) {
        context += `INSTRUCCIÓN CRÍTICA: El siguiente es el Smart Product Backlog aprobado por el investigador. Clasifica cada historia usando la Matriz de Decisión sin modificar ningún campo existente.\n\n`;
        const phase1Artifact = state.phases.find(p => p.id === 1)?.artifact;
        context += `SMART PRODUCT BACKLOG APROBADO A CLASIFICAR:\n${JSON.stringify(phase1Artifact || {}, null, 2)}\n\n`;
        context += `CONTEXTO ORGANIZACIONAL:\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
      } else if (currentPhase.id === 3) {
        context += `PERFIL ORGANIZACIONAL:\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
        if (state.ragActive && state.teamRepoContext) {
          const compactRAG = buildCompactRAG(state.teamRepoContext);
          if (model === 'Claude') {
            context += `HISTORIAL REAL DEL EQUIPO PARA ESTIMACIÓN POR ANALOGÍA - OBLIGATORIO: Debes buscar en este historial las historias más similares a las que vas a estimar. Usa los campos user_stories de cada proyecto para encontrar analogías. Los campos real_points y estimated_points te muestran la precisión histórica del equipo. Los campos external_integration y complexity_factors te ayudan a identificar similitudes. Este contexto es tu fuente principal de referencia y debes citarlo en reference_story_id.\n${compactRAG}\n\n`;
            context += "BACKLOG A ESTIMAR (busca analogías del historial para cada una de estas historias):\n" + JSON.stringify(state.phases.find(p => p.id === 2)?.artifact?.user_stories?.map((s: any) => ({id: s.id, title: s.title, description: s.description, classification: s.classification})) || [], null, 2) + "\n\n";
          } else {
            context += `HISTORIAL DEL EQUIPO RAG:\n${compactRAG}\n\n`;
          }
        } else if (state.orgContext?.teamHistory) {
          context += `HISTORIAL DEL EQUIPO:\n${state.orgContext?.teamHistory}\n\n`;
        }
        const phase0Artifact = state.phases.find(p => p.id === 0)?.artifact;
        if (phase0Artifact) {
          context += `VISIÓN DEL PRODUCTO:\n${JSON.stringify(phase0Artifact, null, 2)}\n\n`;
        }
        const phase2Artifact = state.phases.find(p => p.id === 2)?.artifact;
        if (phase2Artifact) {
          context += `BACKLOG CLASIFICADO APROBADO:\n${JSON.stringify(phase2Artifact, null, 2)}\n\n`;
        }
      } else if (currentPhase.id === 4) {
        let calcVel = 20;
        if (state.orgContext?.averageVelocity && state.orgContext.averageVelocity > 0) {
          calcVel = state.orgContext.averageVelocity;
        } else if (state.teamRepoContext?.velocity?.avg_points_per_sprint) {
          calcVel = state.teamRepoContext.velocity.avg_points_per_sprint;
        }
        context += `VELOCIDAD OFICIAL DEL EQUIPO PARA ESTE EXPERIMENTO: ${calcVel} story points por sprint.\n\n`;
        context += `PERFIL ORGANIZACIONAL (ÉNFASIS EN NORMATIVAS Y RESTRICCIONES):\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
        if (state.ragActive && state.teamRepoContext) {
          if (model === 'Claude') {
            context += `HISTORIAL REAL DEL EQUIPO PARA PRIORIZACIÓN CONTEXTUALIZADA - OBLIGATORIO: Usa el campo patterns.prioritization_patterns para calibrar los criterios de priorización con los patrones reales del equipo. Usa known_risk_patterns para identificar riesgos específicos de este equipo.\n${JSON.stringify(state.teamRepoContext, null, 2)}\n\n`;
          } else {
            context += `HISTORIAL DEL EQUIPO RAG:\n${JSON.stringify(state.teamRepoContext, null, 2)}\n\n`;
          }
        } else if (state.orgContext?.teamHistory) {
          context += `HISTORIAL DEL EQUIPO:\n${state.orgContext?.teamHistory}\n\n`;
        }
        const phase0Artifact = state.phases.find(p => p.id === 0)?.artifact;
        if (phase0Artifact) {
          context += `VISIÓN DEL PRODUCTO:\n${JSON.stringify(phase0Artifact, null, 2)}\n\n`;
        }
        const phase2Artifact = state.phases.find(p => p.id === 2)?.artifact;
        if (phase2Artifact) {
          context += `BACKLOG CLASIFICADO APROBADO:\n${JSON.stringify(phase2Artifact, null, 2)}\n\n`;
        }
        const phase3Artifact = state.phases.find(p => p.id === 3)?.artifact;
        if (phase3Artifact) {
          context += `ESTIMACIONES APROBADAS:\n${JSON.stringify(phase3Artifact, null, 2)}\n\n`;
        }
      } else {
        // Default critical organizational context for other phases
        context = `INFORMACIÓN DE CONTEXTO CRÍTICA (UTILIZA ESTOS DATOS PARA CUMPLIR ESTÁNDARES Y CONSISTENCIA):\n\n`;
        context += `1. PERFIL ORGANIZACIONAL (Empresa, Sector, Stack, Estándares, DoD, Restricciones):\n${JSON.stringify(state.orgContext, null, 2)}\n\n`;
        context += `2. HISTORIAL DEL EQUIPO (Contexto narrativo):\n${state.orgContext?.teamHistory}\n\n`;
        if (state.teamRepoContext && state.ragActive) {
          context += `3. REPOSITORIO DEL EQUIPO (Datos estructurados JSON con antecedentes técnicos y de gestión):\n${JSON.stringify(state.teamRepoContext, null, 2)}\n\n`;
        }
        context += `4. IDEA DEL PROYECTO ACTUAL (Objetivo del ciclo):\n${state.projectIdea}\n\n`;
        
        // Accumulate approved artifacts
        state.phases.slice(0, state.currentPhaseIndex).forEach(p => {
          if (p.artifact) {
            context += `ARTEFACTO APROBADO FASE ${p.id} (${p.name}):\n${JSON.stringify(p.artifact, null, 2)}\n\n`;
          }
        });
      }

      if (customInstructions) {
        context += `INSTRUCCIONES DE CORRECCIÓN (RECHAZO ANTERIOR):\n${customInstructions}\n\n`;
      }

      const userPrompt = "Genera el artefacto para esta fase basándote en el contexto proporcionado.";
      
      if (currentPhase.id === 4) {
        console.log("Agente 4 iniciado");
      }

      let result = "";
      const runWithTimeout = async (promise: Promise<string>, seconds: number) => {
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("El agente tardó demasiado, intenta de nuevo"));
          }, seconds * 1000);
        });
        
        try {
          const res = await Promise.race([promise, timeoutPromise]);
          clearTimeout(timeoutId);
          return res;
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      };

      if (model === 'Gemini') {
        const promise = callGemini(apiKey, systemPrompt, context + userPrompt);
        result = currentPhase.id === 4 ? await runWithTimeout(promise, 90) : await promise;
      } else {
        const promise = callClaude(apiKey, systemPrompt, context + userPrompt);
        result = currentPhase.id === 4 ? await runWithTimeout(promise, 90) : await promise;
      }

      if (currentPhase.id === 4) {
        console.log("Agente 4 respuesta recibida");
      }

      const endTime = Date.now();
      const runDuration = (endTime - startTime) / 1000;
      setTotalPhaseDuration(prev => prev + runDuration);

      // Robust JSON Extraction
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
        
        try {
          return JSON.parse(jsonString);
        } catch(e: any) {
          throw new Error("JSON invalido despues de limpieza: " + e.message);
        }
      };

      if (currentPhase.id === 4) {
        console.log("RESPUESTA CRUDA AGENTE 4:", result);
      }

      const parsedArtifact = extractJSON(result);

      if (currentPhase.id === 4) {
        console.log("OBJETO JSON PARSEADO AGENTE 4:", parsedArtifact);
      }

      console.log(`JSON Devuelto por el Agente ${currentPhase.id}:`, JSON.stringify(parsedArtifact, null, 2));

      if (currentPhase.id === 4 && parsedArtifact?.prioritized_backlog) {
        parsedArtifact.prioritized_backlog = parsedArtifact.prioritized_backlog
          .sort((a: any, b: any) => (b.priority_score || 0) - (a.priority_score || 0))
          .map((item: any, index: number) => ({ ...item, position: index + 1 }));
      }

      setState(prev => {
        const newPhases = [...prev.phases];
        const oldPhase = newPhases[state.currentPhaseIndex];
        const hadArtifact = !!oldPhase.artifact;
        const currentRegenerations = oldPhase.regenerations || 0;
        newPhases[state.currentPhaseIndex] = {
          ...oldPhase,
          status: 'waiting',
          artifact: parsedArtifact,
          regenerations: hadArtifact ? currentRegenerations + 1 : currentRegenerations
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
    // Record metrics if in research mode
    if (state.experimentMode === 'research' && [1, 2, 3, 4].includes(currentPhase.id)) {
      const wasModified = currentPhase.artifact && editedArtifact && JSON.stringify(currentPhase.artifact) !== JSON.stringify(editedArtifact);
      const decision = attempts > 1 ? 'Rechazado y Regenerado' : (editMode || wasModified ? 'Modificado antes de aprobar' : 'Aprobado directamente');
      
      // Stats for manual edits
      let manualEditsCount = 0;
      let totalItemsCount = 0;
      if (currentPhase.id === 1 && currentPhase.artifact?.user_stories) {
        manualEditsCount = currentPhase.artifact.user_stories.filter((s: any) => s.isManualEdit).length;
        totalItemsCount = currentPhase.artifact.user_stories.length;
      }

      const metric: any = {
        phaseId: currentPhase.id,
        phaseName: currentPhase.name,
        model: getModelForPhase(currentPhase),
        ragActive: state.ragActive,
        durationSeconds: totalPhaseDuration,
        attempts: attempts,
        finalDecision: decision,
        artifactAtApproval: currentPhase.artifact,
        manualEditsCount,
        totalItemsCount
      };
      
      setState(prev => ({
        ...prev,
        experimentMetrics: [...prev.experimentMetrics, metric]
      }));
    }

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
    setAttempts(prev => prev + 1);
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

  const updateArtifactFromViewer = (newData: any) => {
    setState(prev => {
      const newPhases = [...prev.phases];
      newPhases[state.currentPhaseIndex].artifact = newData;
      return { ...prev, phases: newPhases };
    });
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
            <p className="text-slate-400 font-medium mb-2">{currentPhase.specialty}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {state.mode === 'Single' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gemini-blue/10 border border-gemini-blue/30 text-gemini-blue animate-fade-in">
                  Single LLM Gemini
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-claude-violet/10 border border-claude-violet/30 text-claude-violet animate-fade-in">
                  Dual LLM
                </span>
              )}
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all duration-300",
                state.ragActive 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-slate-500/10 border-slate-500/20 text-slate-400"
              )}>
                <Database size={10} />
                {state.ragActive ? "RAG Activo" : "RAG Inactivo"}
              </span>
              {currentPhase.regenerations && currentPhase.regenerations >= 1 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-400 animate-pulse">
                  Regeneraciones: {currentPhase.regenerations}
                </span>
              ) : null}
            </div>
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
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm whitespace-pre-wrap">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
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
              <ArtifactViewer 
                data={currentPhase.artifact} 
                phaseId={currentPhase.id} 
                onUpdateArtifact={updateArtifactFromViewer}
              />
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
