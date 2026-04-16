import React from 'react';
import { PhaseStatus } from '../types';
import { Check, Clock, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StepIndicatorProps {
  phaseNumber: number;
  status: PhaseStatus;
  isActive: boolean;
  onClick: () => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ phaseNumber, status, isActive, onClick }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'locked':
        return 'bg-slate-700 text-slate-400 border-transparent';
      case 'working':
        return 'bg-yellow-500 text-teal-dark border-yellow-300 animate-pulse';
      case 'waiting':
        return 'bg-orange-500 text-white border-orange-300';
      case 'approved':
        return 'bg-green-500 text-white border-green-300';
      case 'rejected':
        return 'bg-red-500 text-white border-red-300';
      default:
        return 'bg-slate-700';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'locked': return <Lock size={14} />;
      case 'working': return <Loader2 size={14} className="animate-spin" />;
      case 'waiting': return <Clock size={14} />;
      case 'approved': return <Check size={14} />;
      case 'rejected': return <AlertCircle size={14} />;
      default: return <span>{phaseNumber}</span>;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={status === 'locked' && !isActive}
      className={cn(
        "flex flex-col items-center gap-1 group transition-all duration-300",
        status === 'locked' && "cursor-not-allowed opacity-50"
      )}
    >
      <div className={cn(
        "step-indicator border-2",
        getStatusStyles(),
        isActive && "ring-2 ring-white ring-offset-2 ring-offset-teal-dark scale-110"
      )}>
        {getIcon()}
      </div>
      <span className={cn(
        "text-[10px] font-medium uppercase tracking-wider",
        isActive ? "text-white" : "text-slate-400"
      )}>
        Fase {phaseNumber}
      </span>
    </button>
  );
};
