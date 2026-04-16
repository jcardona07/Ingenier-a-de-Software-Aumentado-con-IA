import React, { useState } from 'react';
import { AppState, OrgContext } from '../types';
import { testGeminiConnection, testClaudeConnection } from '../services/aiService';
import { CheckCircle2, XCircle, Info, ShieldCheck, Zap, Database, History, Settings, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface SetupScreenProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onStart: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ state, setState, onStart }) => {
  const [verifyingGemini, setVerifyingGemini] = useState(false);
  const [verifyingClaude, setVerifyingClaude] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [claudeError, setClaudeError] = useState<string | null>(null);

  const [orgForm, setOrgForm] = useState<OrgContext>({
    companyName: '',
    industry: '',
    techStack: '',
    qualityStandards: '',
    definitionOfDone: '',
    constraints: '',
    averageVelocity: 20,
    teamHistory: '',
  });

  const handleVerifyGemini = async () => {
    setVerifyingGemini(true);
    setGeminiError(null);
    try {
      const success = await testGeminiConnection(state.geminiKey);
      if (success) {
        setState(prev => ({ ...prev, isGeminiVerified: true }));
      } else {
        setGeminiError("Respuesta inesperada del modelo.");
      }
    } catch (err: any) {
      setGeminiError(err.message || "Error de conexión");
    } finally {
      setVerifyingGemini(false);
    }
  };

  const handleVerifyClaude = async () => {
    setVerifyingClaude(true);
    setClaudeError(null);
    try {
      const success = await testClaudeConnection(state.claudeKey);
      if (success) {
        setState(prev => ({ ...prev, isClaudeVerified: true }));
      } else {
        setClaudeError("No se recibió respuesta del modelo.");
      }
    } catch (err: any) {
      setClaudeError(err.message);
    } finally {
      setVerifyingClaude(false);
    }
  };

  const isFormValid = orgForm.companyName && orgForm.industry && orgForm.techStack && orgForm.teamHistory;
  const canStart = state.isGeminiVerified && (state.mode === 'Single' || state.isClaudeVerified) && isFormValid && state.projectIdea;

  const handleStart = () => {
    setState(prev => ({
      ...prev,
      orgContext: orgForm,
      phases: prev.phases.map((p, i) => i === 0 ? { ...p, status: 'waiting' } : p)
    }));
    onStart();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">AI Software Lifecycle Framework</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">Configura tu entorno y contexto organizacional para comenzar el ciclo de desarrollo asistido por IA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Mode */}
        <section className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold mb-2">
            <Settings className="text-teal-400" size={20} />
            <h2>Modo de Operación</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setState(prev => ({ ...prev, mode: 'Single' }))}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                state.mode === 'Single' ? "border-gemini-blue bg-gemini-blue/10" : "border-white/5 bg-white/5 hover:bg-white/10"
              )}
            >
              <div className="font-bold text-white">Single LLM</div>
              <div className="text-xs text-slate-400">Todo el ciclo es ejecutado por Gemini 1.5 Pro.</div>
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, mode: 'Dual' }))}
              disabled={!state.isGeminiVerified || !state.isClaudeVerified}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden",
                state.mode === 'Dual' ? "border-claude-violet bg-claude-violet/10" : "border-white/5 bg-white/5 hover:bg-white/10",
                (!state.isGeminiVerified || !state.isClaudeVerified) && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="font-bold text-white">Dual LLM</div>
              <div className="text-xs text-slate-400">Gemini y Claude colaboran según su especialidad.</div>
              {!state.isClaudeVerified && <div className="absolute top-2 right-2"><Info size={14} className="text-orange-400" /></div>}
            </button>
          </div>
        </section>

        {/* Section 2: API Keys */}
        <section className="glass-panel p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-white font-semibold mb-2">
            <ShieldCheck className="text-teal-400" size={20} />
            <h2>Claves API</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Gemini API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={state.geminiKey}
                  onChange={(e) => setState(prev => ({ ...prev, geminiKey: e.target.value, isGeminiVerified: false }))}
                  className="flex-1 bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gemini-blue outline-none"
                  placeholder="AIza..."
                />
                <button
                  onClick={handleVerifyGemini}
                  disabled={verifyingGemini || !state.geminiKey}
                  className="bg-gemini-blue hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {verifyingGemini ? <Loader2 className="animate-spin" size={18} /> : "Probar"}
                </button>
              </div>
              {state.isGeminiVerified && <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={14} /> Verificada</div>}
              {geminiError && <div className="flex items-center gap-1 text-xs text-red-400"><XCircle size={14} /> {geminiError}</div>}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Claude API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={state.claudeKey}
                  onChange={(e) => setState(prev => ({ ...prev, claudeKey: e.target.value, isClaudeVerified: false }))}
                  className="flex-1 bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-claude-violet outline-none"
                  placeholder="sk-ant-..."
                />
                <button
                  onClick={handleVerifyClaude}
                  disabled={verifyingClaude || !state.claudeKey}
                  className="bg-claude-violet hover:bg-violet-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {verifyingClaude ? <Loader2 className="animate-spin" size={18} /> : "Probar"}
                </button>
              </div>
              {state.isClaudeVerified && <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={14} /> Verificada</div>}
              {claudeError && <div className="flex items-center gap-1 text-xs text-red-400"><XCircle size={14} /> {claudeError}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="space-y-1">
              <div className="text-xs font-bold text-gemini-blue uppercase tracking-widest">Gemini</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Visión, Requerimientos, Backlog, Código, Despliegue y Monitoreo.</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-claude-violet uppercase tracking-widest">Claude</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Estimación, Priorización, Arquitectura, Diseño Técnico y QA.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Organization Context */}
        <section className="glass-panel p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Users className="text-teal-400" size={20} />
            <h2>Contexto de la Organización y del Equipo</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Empresa</label>
                  <input
                    value={orgForm.companyName}
                    onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                    placeholder="Nombre de la organización"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Sector / Industria</label>
                  <input
                    value={orgForm.industry}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                    placeholder="Ej: Fintech, Salud, E-commerce"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Tecnologías del Equipo</label>
                <input
                  value={orgForm.techStack}
                  onChange={(e) => setOrgForm({ ...orgForm, techStack: e.target.value })}
                  className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                  placeholder="React, Node.js, PostgreSQL, AWS, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Estándares de Calidad / DoD</label>
                  <textarea
                    value={orgForm.definitionOfDone}
                    onChange={(e) => setOrgForm({ ...orgForm, definitionOfDone: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 h-24 resize-none"
                    placeholder="Unit tests > 80%, Code review, etc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Restricciones del Proyecto</label>
                  <textarea
                    value={orgForm.constraints}
                    onChange={(e) => setOrgForm({ ...orgForm, constraints: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 h-24 resize-none"
                    placeholder="Plazos, normativas, integraciones legacy..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1">
                  <Zap size={12} className="text-yellow-400" /> Velocidad Promedio (SP)
                </label>
                <input
                  type="number"
                  value={orgForm.averageVelocity}
                  onChange={(e) => setOrgForm({ ...orgForm, averageVelocity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1">
                  <History size={12} className="text-teal-400" /> Historial del Equipo (RAG Base)
                </label>
                <textarea
                  value={orgForm.teamHistory}
                  onChange={(e) => setOrgForm({ ...orgForm, teamHistory: e.target.value })}
                  className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 h-[210px] resize-none"
                  placeholder="Pega aquí backlogs pasados, retrospectivas, decisiones técnicas previas..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Project Idea */}
        <section className="glass-panel p-6 space-y-4 lg:col-span-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Zap className="text-yellow-400" size={20} />
            <h2>¿Qué vamos a construir?</h2>
          </div>
          <textarea
            value={state.projectIdea}
            onChange={(e) => setState(prev => ({ ...prev, projectIdea: e.target.value }))}
            className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-teal-400 h-32 resize-none"
            placeholder="Describe tu idea de producto de forma detallada..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="bg-teal-400 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-teal-dark px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Iniciar Ciclo de Desarrollo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
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
    className={cn("lucide lucide-loader-2", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
