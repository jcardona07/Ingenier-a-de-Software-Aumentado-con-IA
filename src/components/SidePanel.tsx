import React from 'react';
import { Phase } from '../types';
import { cn } from '../lib/utils';
import { FileText, CheckCircle, ChevronRight } from 'lucide-react';

interface SidePanelProps {
  phases: Phase[];
  currentPhaseIndex: number;
}

export const SidePanel: React.FC<SidePanelProps> = ({ phases, currentPhaseIndex }) => {
  const approvedPhases = phases.filter(p => p.status === 'approved');

  return (
    <aside className="w-80 border-l border-white/10 bg-teal-dark/30 backdrop-blur-xl overflow-y-auto hidden xl:block">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-white font-bold border-b border-white/10 pb-4">
          <FileText size={18} className="text-teal-400" />
          <h2>Artefactos Aprobados</h2>
        </div>

        {approvedPhases.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <Clock size={20} className="text-slate-600" />
            </div>
            <p className="text-xs text-slate-500">No hay artefactos aprobados aún.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedPhases.map((phase) => (
              <div key={phase.id} className="glass-panel p-4 space-y-2 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Fase {phase.id}</span>
                  <CheckCircle size={12} className="text-green-500" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">{phase.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{phase.specialty}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                  Ver detalles <ChevronRight size={10} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

const Clock = ({ size, className }: { size: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
