import React from 'react';
import { AppState } from '../types';
import { 
  Download, 
  X, 
  Database, 
  BrainCircuit, 
  Layers, 
  ListTodo, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Sliders, 
  FileCheck, 
  Activity, 
  Clock, 
  Info, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ExperimentSummaryProps {
  state: AppState;
  onClose: () => void;
}

export const ExperimentSummary: React.FC<ExperimentSummaryProps> = ({ state, onClose }) => {
  // Find approved artifacts
  const backlogPhase = state.phases.find(p => p.id === 1);
  const classPhase = state.phases.find(p => p.id === 2);
  const estimationPhase = state.phases.find(p => p.id === 3);
  const priorPhase = state.phases.find(p => p.id === 4);

  const backlogArtifact = backlogPhase?.artifact;
  const classificationArtifact = classPhase?.artifact;
  const estimationArtifact = estimationPhase?.artifact;
  const priorArtifact = priorPhase?.artifact;

  // General Setup metrics
  const totalIterations = state.phases.reduce((sum, phase) => sum + (phase.regenerations || 0), 0);
  const timestamp = new Date().toLocaleString();

  // Backlog metrics
  const requirements = backlogArtifact?.requirements || {};
  const functionalReqs = requirements.functional || [];
  const nonFunctionalReqs = requirements.non_functional || [];
  const epics = backlogArtifact?.epics || [];
  const stories = backlogArtifact?.user_stories || [];

  // Classification metrics
  const storiesClass = classificationArtifact?.user_stories || [];
  const tradStories = storiesClass.filter((s: any) => {
    const t = s.classification?.type || s.hu_type || 'tradicional';
    return t === 'tradicional';
  });
  const mixedStories = storiesClass.filter((s: any) => {
    const t = s.classification?.type || s.hu_type || '';
    return t === 'mixta_ia_humano' || t === 'mixta';
  });
  const aiStories = storiesClass.filter((s: any) => {
    const t = s.classification?.type || s.hu_type || '';
    return t === 'potenciada_ia';
  });
  const editedStories = storiesClass.filter((s: any) => s.isManualEdit);

  // Estimation metrics
  const teamAnalysis = estimationArtifact?.team_analysis || {};
  const velocityReference = estimationArtifact?.velocity_reference || {};
  const estimations = estimationArtifact?.estimations || [];
  const scale = estimationArtifact?.personal_scale || {};

  // Prioritization metrics
  const companyAnalysis = priorArtifact?.company_analysis || {};
  const prioritizedBacklog = priorArtifact?.prioritized_backlog || [];
  const sprintPlan = priorArtifact?.sprint_plan || {};
  const riskRegister = priorArtifact?.risk_register || [];

  const handleExportJSON = () => {
    // Determine if any sprint exceeds 70% capacity
    const sprint1Capacity = sprintPlan?.sprint_1?.capacity_used_percent || 0;
    const sprint2Capacity = sprintPlan?.sprint_2?.capacity_used_percent || 0;
    const sprint3Capacity = sprintPlan?.sprint_3?.capacity_used_percent || 0;
    const anySprintExceeds70 = sprint1Capacity > 70 || sprint2Capacity > 70 || sprint3Capacity > 70;

    // Calculate avg_confidence as mode of estimations' confidence_levels
    const confValues = estimations.map((e: any) => {
      const level = String(e.confidence_level || 'bajo').toLowerCase();
      if (level === 'alto' || level === 'alta') return 3;
      if (level === 'medio') return 2;
      return 1;
    });

    let avgConfidence = 'bajo';
    if (confValues.length > 0) {
      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      confValues.forEach((val: number) => {
        counts[val] = (counts[val] || 0) + 1;
      });
      let maxCount = -1;
      let modeVal = 1;
      [1, 2, 3].forEach(val => {
        if (counts[val] > maxCount) {
          maxCount = counts[val];
          modeVal = val;
        }
      });
      if (modeVal === 3) avgConfidence = 'alto';
      else if (modeVal === 2) avgConfidence = 'medio';
      else avgConfidence = 'bajo';
    }

    const velocitySource = velocityReference.basis || null;

    const storiesWithRagReference = estimations.filter((est: any) => {
      const rId = est.reference_story_id;
      return rId !== null && rId !== undefined && rId !== "";
    }).length;

    const classificationAiIdentified = storiesClass.filter((s: any) => {
      const score = s.classification?.score;
      return score !== undefined && score !== null && Number(score) > 0;
    }).length;

    const exportData = {
      config: {
        modoLLM: state.mode,
        ragActive: state.ragActive,
        companyName: state.orgContext?.companyName || 'N/A',
        timestamp: new Date().toISOString(),
        totalIteraciones: totalIterations
      },
      artifacts: {
        backlog: backlogArtifact || null,
        classification: classificationArtifact || null,
        estimation: estimationArtifact || null,
        prioritization: priorArtifact || null
      },
      metrics: {
        historiasPorClasificacion: {
          tradicional: tradStories.length,
          mixta: mixedStories.length,
          potenciada_ia: aiStories.length
        },
        totalStoryPoints: estimationArtifact?.total_points || 0,
        sprintsEstimados: estimationArtifact?.estimated_sprints || 0,
        sprintExcedeCapacidad70: anySprintExceeds70,
        historiasEditadasManualmente: editedStories.length,
        avg_confidence: avgConfidence,
        velocity_source: velocitySource,
        stories_with_rag_reference: storiesWithRagReference,
        classification_ai_identified: classificationAiIdentified
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experimento-AIASE-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-teal-dark overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-400/20">
            <BrainCircuit className="text-teal-dark font-sans" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Resumen del Experimento</h1>
            <p className="text-xs text-teal-400 font-bold uppercase tracking-wider mt-1.5 font-sans">EVALUACIÓN METODOLÓGICA CON FRAMEWORK AIASE</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-teal-dark font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-400/10 hover:shadow-teal-400/23 cursor-pointer"
          >
            <Download size={16} /> Exportar JSON
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-white/10 cursor-pointer"
          >
            <X size={16} /> Cerrar Resumen
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Section 1: Configuración del Experimento */}
        <div className="glass-panel p-6 border-l-4 border-l-teal-400 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Sliders size={20} className="text-teal-400" />
            <h2 className="text-lg font-bold text-white">Configuración del Experimento</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Modo LLM</span>
              <div className="mt-2">
                {state.mode === 'Single' ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gemini-blue/20 border border-gemini-blue/30 text-gemini-blue inline-block">
                    Single LLM Gemini
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-claude-violet/20 border border-claude-violet/30 text-claude-violet inline-block">
                    Dual LLM
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contexto RAG</span>
              <div className="mt-2 text-xs">
                {state.ragActive ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-green-500/10 border border-green-500/20 text-green-400 w-fit">
                    <Database size={12} /> RAG Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-slate-500/10 border border-slate-500/20 text-slate-400 w-fit">
                    <Database size={12} /> RAG Inactivo
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Empresa (Contexto Org.)</span>
              <div className="mt-1.5 text-base font-bold text-white truncate" title={state.orgContext?.companyName}>
                {state.orgContext?.companyName || 'N/D'}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fecha y Hora de Ejecución</span>
              <div className="mt-1.5 text-sm text-slate-300 font-mono font-medium flex items-center gap-1">
                <Clock size={12} className="text-slate-400" /> {timestamp}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Regeneraciones</span>
              <div className={cn(
                "mt-1 text-2xl font-black",
                totalIterations > 0 ? "text-orange-400" : "text-green-400"
              )}>
                {totalIterations} {totalIterations === 1 ? 'iteración' : 'iteraciones'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Etapa 1 Backlog */}
        <div className="glass-panel p-6 border-l-4 border-l-teal-500 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 animate-fade-in">
              <Layers size={20} className="text-teal-400" />
              <h2 className="text-lg font-bold text-white">Etapa 1: Smart Product Backlog</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded border border-white/10 font-bold uppercase tracking-wider">
                Regeneraciones: {backlogPhase?.regenerations || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Épicas Generadas</div>
              <div className="text-2xl font-bold text-white mt-1">{epics.length}</div>
              <div className="space-y-1.5 mt-3 max-h-36 overflow-y-auto">
                {epics.map((epic: any) => (
                  <div key={epic.id} className="text-xs text-teal-300 font-bold truncate">
                    Epic {epic.id}: <span className="text-slate-300 font-normal">{epic.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Historias de Usuario (Backlog)</div>
              <div className="text-2xl font-bold text-white mt-1">{stories.length} historias</div>
              <div className="space-y-1.5 mt-3 max-h-36 overflow-y-auto">
                {stories.map((story: any) => (
                  <div key={story.id} className="text-[11px] text-slate-400 truncate">
                    <span className="text-teal-500 font-mono font-bold mr-1">[{story.id}]</span> {story.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 md:col-span-2 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Requerimientos Funcionales ({functionalReqs.length})</span>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto text-xs text-slate-300 pr-1 pr-2">
                  {functionalReqs.map((r: any) => (
                    <div key={r.id} className="flex gap-1.5">
                      <span className="text-teal-400 font-mono font-bold">[{r.id}]</span>
                      <span>{r.description}</span>
                    </div>
                  ))}
                  {functionalReqs.length === 0 && <span className="text-slate-500 italic">No hay requerimientos cargados.</span>}
                </div>
              </div>
              <div className="border-t border-white/5 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Requerimientos No Funcionales ({nonFunctionalReqs.length})</span>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto text-xs text-slate-300 pr-1">
                  {nonFunctionalReqs.map((r: any) => (
                    <div key={r.id} className="flex gap-1.5">
                      <span className="text-emerald-400 font-mono font-bold">[{r.id}]</span>
                      <span>{r.description}</span>
                    </div>
                  ))}
                  {nonFunctionalReqs.length === 0 && <span className="text-slate-500 italic">No hay requerimientos cargados.</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Etapa 2 Clasificación */}
        <div className="glass-panel p-6 border-l-4 border-l-teal-600 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={20} className="text-teal-400" />
              <h2 className="text-lg font-bold text-white">Etapa 2: Clasificación de Soluciones (Matriz de Decisión)</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded border border-white/10 font-bold uppercase tracking-wider">
                Regeneraciones: {classPhase?.regenerations || 0}
              </span>
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Potenciada IA</div>
              <div className="text-3xl font-black text-purple-300 mt-1">{aiStories.length}</div>
              <div className="text-[9px] text-purple-400/70 uppercase font-bold tracking-widest mt-1">Supervisión HITL obligatoria</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Mixta IA / Humano</div>
              <div className="text-3xl font-black text-blue-300 mt-1">{mixedStories.length}</div>
              <div className="text-[9px] text-blue-400/70 uppercase font-bold tracking-widest mt-1">Sistemas híbridos</div>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 p-3.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tradicional</div>
              <div className="text-3xl font-black text-slate-300 mt-1">{tradStories.length}</div>
              <div className="text-[9px] text-slate-500/70 uppercase font-bold tracking-widest mt-1">HOTL / HOOTL</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">Modificadas Manualmente</div>
              <div className="text-3xl font-black text-yellow-300 mt-1">{editedStories.length}</div>
              <div className="text-[9px] text-yellow-500/70 uppercase font-bold tracking-widest mt-1">Por investigador en UI</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-3">ID</th>
                  <th className="p-3">Título</th>
                  <th className="p-3 text-center">Naturaleza (D1)</th>
                  <th className="p-3 text-center">Datos (D2)</th>
                  <th className="p-3 text-center">Tolerancia (D3)</th>
                  <th className="p-3 text-center">Puntaje C</th>
                  <th className="p-3">Tipo Clasificación</th>
                  <th className="p-3 text-right">Edición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {storiesClass.map((story: any) => {
                  const classification = story.classification || story.classification_metrics || {};
                  const d1Val = classification.d1 ?? classification.dimension_1 ?? 0;
                  const d2Val = classification.d2 ?? classification.dimension_2 ?? 0;
                  const d3Val = classification.d3 ?? classification.dimension_3 ?? 0;
                  const scoreC = classification.score ?? classification.score_c ?? (d1Val + d2Val + d3Val);
                  const classType = classification.type || story.hu_type || 'tradicional';

                  return (
                    <tr key={story.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-400">[{story.id}]</td>
                      <td className="p-3 max-w-sm shrink-0">
                        <div className="font-bold text-white">{story.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 italic">{story.description}</div>
                      </td>
                      <td className="p-3 text-center font-mono">{d1Val}</td>
                      <td className="p-3 text-center font-mono">{d2Val}</td>
                      <td className="p-3 text-center font-mono">{d3Val}</td>
                      <td className="p-3 text-center font-mono font-bold text-teal-400">{scoreC}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                          classType === 'potenciada_ia' ? "bg-purple-500/20 text-purple-400" :
                          classType === 'mixta_ia_humano' || classType === 'mixta' ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {classType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {story.isManualEdit ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter bg-yellow-500/20 text-yellow-500 inline-flex items-center gap-1">
                            <CheckCircle2 size={10} /> Editado por investigador
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Agente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Etapa 3 Estimación */}
        <div className="glass-panel p-6 border-l-4 border-l-teal-700 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-teal-400" />
              <h2 className="text-lg font-bold text-white">Etapa 3: Estimación de Esfuerzo (RAG & Analogía)</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded border border-white/10 font-bold uppercase tracking-wider">
                Regeneraciones: {estimationPhase?.regenerations || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Calidad de Contexto</div>
              <div className="text-lg font-bold text-white mt-1.5 capitalize">
                {teamAnalysis.team_context_quality?.replace(/_/g, ' ') || 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Procedencia de base</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Velocidad Referencia</div>
              <div className="text-2xl font-black text-teal-400 mt-1">
                {velocityReference.avg_points_per_sprint || 'N/A'} <span className="text-xs text-slate-400">SP / Sprint</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-normal">
                Base: {velocityReference.basis?.replace(/_/g, ' ') || 'referencia_industria'}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Story Points</div>
              <div className="text-2xl font-bold text-white mt-1">
                {estimationArtifact?.total_points || 'N/A'} <span className="text-xs text-slate-400">Puntos</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">En el backlog acumulado</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sprints Estimados</div>
              <div className="text-2xl font-bold text-white mt-1">
                {estimationArtifact?.estimated_sprints || 'N/A'} <span className="text-xs text-slate-400">Sprints</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Para completar backlog MVP</div>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-3">Story ID</th>
                  <th className="p-3 text-center">Story Points</th>
                  <th className="p-3 text-center">Horas Estimadas</th>
                  <th className="p-3">Nivel Confianza</th>
                  <th className="p-3">Historia de Referencia</th>
                  <th className="p-3">Ajustes Aplicados / Justificación de la Estimación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {estimations.map((est: any, index: number) => {
                  const hasAdjustments = est.adjustment_factors && est.adjustment_factors.length > 0;
                  return (
                    <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-400">[{est.story_id}]</td>
                      <td className="p-3 text-center font-bold text-white text-sm">{est.story_points}</td>
                      <td className="p-3 text-center font-mono">{est.estimated_hours}h</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight",
                          est.confidence_level === 'alta' ? "bg-green-500/10 text-green-400" :
                          est.confidence_level === 'media' ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {est.confidence_level || 'Baja'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{est.reference_story_id || est.reference_story || 'N/D'}</td>
                      <td className="p-3 max-w-sm">
                        <div className="text-[11px] text-slate-300 leading-relaxed font-sans">{est.comparison_reasoning || est.justification || 'N/D'}</div>
                        {hasAdjustments && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {est.adjustment_factors.map((adj: any, k: number) => (
                              <span key={k} className="px-1.5 py-0.5 rounded bg-orange-600/10 border border-orange-500/20 text-[9px] text-orange-400 font-bold max-w-xs truncate" title={`${adj.factor}: ${adj.justification || ''}`}>
                                +{adj.value} SP {adj.factor}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {estimations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500 italic">No hay estimaciones cargadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Etapa 4 Priorización */}
        <div className="glass-panel p-6 border-l-4 border-l-teal-800 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck size={20} className="text-teal-400" />
              <h2 className="text-lg font-bold text-white">Etapa 4: Priorización Valiosa & Sprints (WSJF Ajustado por Riesgo)</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded border border-white/10 font-bold uppercase tracking-wider">
                Regeneraciones: {priorPhase?.regenerations || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dolor Principal de Negocio</div>
              <div className="text-sm text-slate-200 font-bold mt-1 max-w-xl">{companyAnalysis.primary_pain || 'N/A'}</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Restricciones No Negociables</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Array.isArray(companyAnalysis.non_negotiable_constraints) && companyAnalysis.non_negotiable_constraints.map((c: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 tracking-tight flex items-center gap-1">
                    <ShieldAlert size={10} /> {c}
                  </span>
                ))}
                {(!Array.isArray(companyAnalysis.non_negotiable_constraints) || companyAnalysis.non_negotiable_constraints.length === 0) && (
                  <span className="text-xs text-slate-500 italic">No hay restricciones declaradas.</span>
                )}
              </div>
            </div>
          </div>

          {/* prioritized backlog table */}
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">Orden de Priorización del Backlog (WSJF)</span>
            <div className="overflow-x-auto border border-white/5 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-3 text-center">Posición</th>
                    <th className="p-3">Story ID</th>
                    <th className="p-3 text-center">Valor Negocio (VN)</th>
                    <th className="p-3 text-center">Costo Espera (CE)</th>
                    <th className="p-3 text-center">Riesgo Técnico (RT)</th>
                    <th className="p-3 text-center">WSJF Score</th>
                    <th className="p-3">Justificación Estratégica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {prioritizedBacklog.map((item: any, idx: number) => {
                    let priorityScore = item.priority_score || item.wsjf_score || item.final_score || 'N/D';
                    let just = item.priority_justification || item.justification_company_specific || item.score_justification || item.justification || 'N/D';
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-center font-bold text-white">{item.position || idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-teal-400">[{item.story_id}]</td>
                        <td className="p-3 text-center font-mono">{item.vn_score || item.business_value || 'N/D'}</td>
                        <td className="p-3 text-center font-mono">{item.ce_score || 'N/D'}</td>
                        <td className="p-3 text-center font-mono">{item.rt_score || 'N/D'}</td>
                        <td className="p-3 text-center font-mono font-black text-teal-400 text-sm">{priorityScore}</td>
                        <td className="p-3 max-w-xs md:max-w-md lg:max-w-lg leading-relaxed">{just}</td>
                      </tr>
                    );
                  })}
                  {prioritizedBacklog.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500 italic">No hay priorización cargada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sprints proposal */}
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-3">Propuesta de Sprints de la Metodología AIASE</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['sprint_1', 'sprint_2', 'sprint_3'].map(s => {
                const sprint = sprintPlan[s] || {};
                const capacity = sprint.capacity_used_percent || 0;
                const exceedsLimit = capacity > 70;
                if (!sprint.goal && !sprint.total_points) return null;
                return (
                  <div key={s} className="glass-panel p-4 space-y-2 border border-white/5">
                    <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{s.replace('_', ' ')}</div>
                    <div className="text-sm font-bold text-white truncate" title={sprint.goal}>{sprint.goal || 'Pendiente'}</div>
                    <div className="text-xs text-slate-400">
                      Entregables: {(sprint.stories || []).join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                      <span>Total: <strong className="text-white font-mono">{sprint.total_points || 0} SP</strong></span>
                      <span className={cn(
                        "px-2 py-0.5 rounded font-bold text-[10px] font-mono",
                        exceedsLimit ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-teal-400/20 text-teal-400"
                      )}>
                        Capacidad: {capacity}%
                      </span>
                    </div>
                    {exceedsLimit && (
                      <div className="text-[9px] text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20 font-bold uppercase tracking-tighter mt-1 animate-pulse">
                        Supera el límite recomendado del 70%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* risk register */}
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">Registro de Riesgos Iniciales</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riskRegister.map((riskItem: any, idx: number) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1.5 hover:border-teal-400/20 transition-all duration-300">
                  <div className="flex items-center gap-1 text-red-400 font-bold text-xs uppercase tracking-tight">
                    <AlertTriangle size={14} /> Impacto: {riskItem.impact}
                  </div>
                  <div className="text-sm text-white font-bold leading-snug">{riskItem.risk}</div>
                  <p className="text-xs text-slate-400 italic font-mono leading-relaxed mt-1">Mitigación: <span className="not-italic text-slate-300">{riskItem.mitigation}</span></p>
                </div>
              ))}
              {riskRegister.length === 0 && (
                <div className="col-span-full text-xs text-slate-500 italic">No hay riesgos identificados en el registro.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end border-t border-white/14 pt-6 gap-3">
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-teal-dark font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-teal-400/20 scale-100 hover:scale-[1.02] cursor-pointer"
        >
          <Download size={18} /> Exportar JSON del Experimento
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-white/10 cursor-pointer"
        >
          <X size={18} /> Cerrar Resumen
        </button>
      </div>
    </div>
  );
};
