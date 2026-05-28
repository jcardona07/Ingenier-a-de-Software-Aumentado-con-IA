import React, { useState } from 'react';
import { AppState, ExperimentMetric } from '../types';
import { ChevronDown, ChevronUp, Download, PieChart, Activity, Clock, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricsPanelProps {
  state: AppState;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ state }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (state.experimentMode !== 'research') return null;

  const exportData = () => {
    const data = {
      experimentDate: new Date().toISOString(),
      config: {
        mode: state.mode,
        ragActive: state.ragActive,
        projectIdea: state.projectIdea,
        experimentMode: state.experimentMode,
      },
      metrics: state.experimentMetrics,
      artifacts: state.phases
        .filter(p => p.status === 'approved' && [1, 2, 3, 4].includes(p.id))
        .map(p => ({
          phaseId: p.id,
          name: p.name,
          artifact: p.artifact
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experimento-AIASE-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isCompleted = state.phases.filter(p => [1, 2, 3, 4].includes(p.id)).every(p => p.status === 'approved');

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-teal-dark/90 backdrop-blur-md border-t border-white/10 transition-all duration-300 z-40",
      isExpanded ? "h-[400px]" : "h-12"
    )}>
      {/* Header Panel */}
      <div 
        className="h-12 flex items-center justify-between px-6 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest">
            <PieChart size={14} />
            Métricas del Experimento AIASE
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
               <Activity size={10} />
               <span>Progreso: {state.experimentMetrics.length} / 4</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isCompleted && (
            <button 
              onClick={(e) => { e.stopPropagation(); exportData(); }}
              className="flex items-center gap-2 bg-teal-400 text-teal-dark px-3 py-1 rounded text-[10px] font-bold hover:bg-teal-500 transition-colors"
            >
              <Download size={12} /> Exportar Datos
            </button>
          )}
          {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 overflow-y-auto h-[352px] space-y-4">
          {state.experimentMetrics.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Activity size={32} className="opacity-20" />
              <p className="text-sm">No hay métricas registradas aún. Inicia la Etapa 1.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.experimentMetrics.map((metric, idx) => (
                <div key={idx} className="glass-panel p-4 border-l-2 border-l-teal-400 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-white">{metric.phaseName}</h4>
                    <span className="text-[10px] font-mono text-teal-400">#{metric.phaseId}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Cpu size={8} /> Modelo</div>
                      <div className="text-xs text-slate-200">{metric.model}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Database size={8} /> RAG</div>
                      <div className="text-xs text-slate-200">{metric.ragActive ? 'Activo' : 'Inactivo'}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Clock size={8} /> Tiempo</div>
                      <div className="text-xs text-slate-200">{metric.durationSeconds.toFixed(1)}s</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Activity size={8} /> Intentos</div>
                      <div className="text-xs text-slate-200">{metric.attempts}</div>
                    </div>
                    {metric.totalItemsCount && metric.totalItemsCount > 0 && (
                      <div className="space-y-0.5 col-span-2">
                        <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                          <CheckCircle2 size={8} className="text-yellow-500" /> Historias Editadas
                        </div>
                        <div className="text-xs text-slate-200">
                          {metric.manualEditsCount} de {metric.totalItemsCount} 
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({Math.round((metric.manualEditsCount || 0) / metric.totalItemsCount * 100)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">Decisión Final</div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded w-fit",
                      metric.finalDecision === 'Aprobado directamente' ? "bg-green-500/20 text-green-400" :
                      metric.finalDecision === 'Modificado antes de aprobar' ? "bg-blue-500/20 text-blue-400" :
                      "bg-orange-500/20 text-orange-400"
                    )}>
                      {metric.finalDecision}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
