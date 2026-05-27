import React, { useState } from 'react';
import { AppState, OrgContext } from '../types';
import { testGeminiConnection, testClaudeConnection } from '../services/aiService';
import { CheckCircle2, XCircle, Info, ShieldCheck, Zap, Database, History, Settings, Users, Upload, Link, Loader2 } from 'lucide-react';
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

  const [orgError, setOrgError] = useState<string | null>(null);
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    setOrgError(null);

    try {
      const text = await file.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch (e) {
        // If not JSON, try to use Gemini to extract info if key is available
        if (state.isGeminiVerified) {
          const prompt = `Actúa como un experto en análisis organizacional. Extrae la información del siguiente texto y devuélvela estrictamente en formato JSON.
          Si algún campo no se encuentra, deja el valor vacío o el valor predeterminado sugerido.
          
          Estructura requerida:
          {
            "companyName": "Nombre de la empresa",
            "industry": "Sector o industria",
            "techStack": "Tecnologías mencionadas",
            "qualityStandards": "Estándares de calidad o procesos",
            "definitionOfDone": "Definición de terminado",
            "constraints": "Restricciones de tiempo, presupuesto o técnica",
            "averageVelocity": número (velocidad del equipo),
            "teamHistory": "Resumen de la historia del equipo",
            "projectIdea": "Descripción de la idea de proyecto si se menciona"
          }
          
          Texto a analizar:
          ${text}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${state.geminiKey.trim()}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          const resData = await response.json();
          if (response.ok && resData.candidates && resData.candidates[0]?.content?.parts[0]?.text) {
            let rawText = resData.candidates[0].content.parts[0].text;
            
            // Limpiar markdown si el modelo lo incluye
            rawText = rawText.replace(/```json\s?/, '').replace(/```/, '').trim();
            
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                data = JSON.parse(jsonMatch[0]);
              } catch (parseErr) {
                // Intento secundario: limpiar caracteres de control
                const cleanJson = jsonMatch[0].replace(/[\x00-\x1F\x7F-\x9F]/g, "");
                data = JSON.parse(cleanJson);
              }
            } else {
              throw new Error("No se pudo encontrar un bloque JSON en la respuesta de la IA.");
            }
          } else {
            const errorMsg = resData.error?.message || "Error desconocido en la API de Gemini";
            throw new Error(`Error de Gemini: ${errorMsg}`);
          }
        } else {
          throw new Error("El archivo no es un JSON válido. Por favor conecta Gemini primero para procesar archivos de texto plano.");
        }
      }

      if (data) {
        setOrgForm(prev => ({
          ...prev,
          companyName: data.companyName || prev.companyName,
          industry: data.industry || prev.industry,
          techStack: data.techStack || prev.techStack,
          qualityStandards: data.qualityStandards || prev.qualityStandards,
          definitionOfDone: data.definitionOfDone || prev.definitionOfDone,
          constraints: data.constraints || prev.constraints,
          averageVelocity: typeof data.averageVelocity === 'number' ? data.averageVelocity : prev.averageVelocity,
          teamHistory: data.teamHistory || prev.teamHistory,
        }));
        if (data.projectIdea) {
          setState(prev => ({ ...prev, projectIdea: data.projectIdea }));
        }
      }
    } catch (err: any) {
      console.error("Error en handleFileUpload:", err);
      setOrgError(err.message || "Error al procesar el archivo");
    } finally {
      setParsingFile(false);
    }
  };

  const handleFetchRepo = async () => {
    if (!state.teamRepoUrl) return;

    setFetchingRepo(true);
    setOrgError(null);

    try {
      const response = await fetch(state.teamRepoUrl);
      if (!response.ok) throw new Error("No se pudo acceder a la URL del repositorio.");
      const data = await response.json();
      setState(prev => ({ ...prev, teamRepoContext: data }));
    } catch (err: any) {
      setOrgError(err.message || "Error al buscar el repositorio");
    } finally {
      setFetchingRepo(false);
    }
  };

  const handleVerifyGemini = async () => {
    setVerifyingGemini(true);
    setGeminiError(null);
    try {
      const result = await testGeminiConnection(state.geminiKey);
      if (result.success) {
        setState(prev => ({ ...prev, isGeminiVerified: true }));
      } else {
        setGeminiError(result.message);
      }
    } catch (err: any) {
      setGeminiError(err.message || "Error al conectar con Gemini");
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

  const isFormValid = orgForm.companyName && orgForm.industry && orgForm.techStack;
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
        <h1 className="text-4xl font-bold tracking-tight text-white">Ingeniería de Software aumentada con IA</h1>
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
              <div className="text-xs text-slate-400">Todo el ciclo es ejecutado por Gemini 3 Flash.</div>
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
                  disabled={verifyingGemini}
                  className="bg-gemini-blue hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {verifyingGemini ? <Loader2 className="animate-spin" size={18} /> : "Probar"}
                </button>
              </div>
              {state.isGeminiVerified && <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={14} /> Verificada</div>}
              {geminiError && <div className="flex items-start gap-1 text-xs text-red-400 whitespace-pre-wrap"><XCircle size={14} className="mt-0.5 shrink-0" /> {geminiError}</div>}
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
              {claudeError && <div className="flex items-start gap-1 text-xs text-red-400 whitespace-pre-wrap"><XCircle size={14} className="mt-0.5 shrink-0" /> {claudeError}</div>}
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
          <div className="flex items-center justify-between gap-2 text-white font-semibold">
            <div className="flex items-center gap-2">
              <Users className="text-teal-400" size={20} />
              <h2>Contexto de la Organización y del Equipo</h2>
            </div>
            <div className="flex items-center gap-3">
              {orgError && <span className="text-[10px] text-red-400 font-medium truncate max-w-[200px]">{orgError}</span>}
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors">
                {parsingFile ? <Loader2 className="animate-spin text-teal-400" size={14} /> : <Upload className="text-teal-400" size={14} />}
                <span className="text-xs text-slate-300 font-medium">Cargar Perfil</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".json,.txt" />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Empresa</label>
                  <input
                    value={orgForm.companyName}
                    onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 transition-colors"
                    placeholder="Nombre de la organización"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Sector / Industria</label>
                  <input
                    value={orgForm.industry}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                    className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 transition-colors"
                    placeholder="Ej: Fintech, Salud, E-commerce"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">URL Repositorio del Equipo (JSON)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      value={state.teamRepoUrl}
                      onChange={(e) => setState(prev => ({ ...prev, teamRepoUrl: e.target.value }))}
                      className="w-full bg-teal-dark/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-teal-400 transition-colors"
                      placeholder="https://raw.githubusercontent.com/.../history.json"
                    />
                  </div>
                  <button
                    onClick={handleFetchRepo}
                    disabled={fetchingRepo || !state.teamRepoUrl}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-teal-400 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    {fetchingRepo ? <Loader2 className="animate-spin" size={14} /> : "Conectar"}
                  </button>
                </div>
                {state.teamRepoContext && (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-400/5 px-2 py-1 rounded w-fit mt-1">
                    <CheckCircle2 size={10} /> REPOSITORIO CONECTADO
                  </div>
                )}
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
