import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Edit2, Save, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ArtifactViewerProps {
  data: any;
  phaseId: number;
  onUpdateArtifact?: (newData: any) => void;
}

const StoryEditor: React.FC<{ story: any, onSave: (s: any) => void, onCancel: () => void }> = ({ story, onSave, onCancel }) => {
  const [edited, setEdited] = useState({ ...story });
  const [newCriteria, setNewCriteria] = useState('');

  const updateClassification = (d1: number, d2: number, d3: number) => {
    const score = d1 + d2 + d3;
    let type = 'tradicional';
    if (score === 3) type = 'potenciada_ia';
    else if (score >= 1) type = 'mixta_ia_humano';

    setEdited(prev => ({
      ...prev,
      hu_type: type,
      classification: {
        ...prev.classification,
        d1, d2, d3, score, type
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Título</label>
          <input 
            value={edited.title}
            onChange={(e) => setEdited(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-teal-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Persona</label>
          <input 
            value={edited.persona}
            onChange={(e) => setEdited(prev => ({ ...prev, persona: e.target.value }))}
            className="w-full bg-teal-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción (Connextra)</label>
        <textarea 
          value={edited.description}
          onChange={(e) => setEdited(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-teal-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400 h-20 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Matriz de Decisión</label>
          <div className="space-y-2">
            {[
              { id: 'd1', label: 'D1 Patterns', val: edited.classification?.d1 ?? 0 },
              { id: 'd2', label: 'D2 Data', val: edited.classification?.d2 ?? 0 },
              { id: 'd3', label: 'D3 Tolerance', val: edited.classification?.d3 ?? 0 },
            ].map((d) => (
              <label key={d.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30">
                <span className="text-xs text-slate-300">{d.label}</span>
                <input 
                  type="checkbox"
                  checked={d.val === 1}
                  onChange={(e) => {
                    const d1 = d.id === 'd1' ? (e.target.checked ? 1 : 0) : (edited.classification?.d1 ?? 0);
                    const d2 = d.id === 'd2' ? (e.target.checked ? 1 : 0) : (edited.classification?.d2 ?? 0);
                    const d3 = d.id === 'd3' ? (e.target.checked ? 1 : 0) : (edited.classification?.d3 ?? 0);
                    updateClassification(d1, d2, d3);
                  }}
                  className="w-4 h-4 rounded border-white/10 bg-teal-dark text-teal-400 focus:ring-teal-400"
                />
              </label>
            ))}
            <div className="mt-2 p-2 bg-teal-400/10 border border-teal-400/20 rounded-lg flex justify-between items-center">
              <span className="text-[10px] font-bold text-teal-400">Score C: {edited.classification?.score}</span>
              <span className="text-[10px] font-bold text-teal-400 uppercase">{edited.hu_type?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Configuración</label>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase">Modelo Supervisión</label>
              <select 
                value={edited.human_oversight_model}
                onChange={(e) => setEdited(prev => ({ ...prev, human_oversight_model: e.target.value }))}
                className="w-full bg-teal-dark border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="HITL">HITL</option>
                <option value="HOTL">HOTL</option>
                <option value="HOOTL">HOOTL</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase">Backlog Type</label>
              <select 
                value={edited.hu_type}
                onChange={(e) => setEdited(prev => ({ ...prev, hu_type: e.target.value }))}
                className="w-full bg-teal-dark border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="tradicional">Tradicional</option>
                <option value="potenciada_ia">Potenciada IA</option>
                <option value="mixta_ia_humano">Mixta IA/Humano</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Razonamiento</label>
          <textarea 
            value={edited.classification?.reasoning || edited.classification_reasoning}
            onChange={(e) => setEdited(prev => ({ 
              ...prev, 
              classification: { ...prev.classification, reasoning: e.target.value },
              classification_reasoning: e.target.value 
            }))}
            className="w-full bg-teal-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400 h-24 resize-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Criterios de Aceptación</label>
        <div className="space-y-2">
          {(edited.acceptance_criteria || []).map((c: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input 
                value={c}
                onChange={(e) => {
                  const newCriteriaList = [...edited.acceptance_criteria];
                  newCriteriaList[idx] = e.target.value;
                  setEdited(prev => ({ ...prev, acceptance_criteria: newCriteriaList }));
                }}
                className="flex-1 bg-teal-dark border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
              />
              <button 
                onClick={() => {
                  const newCriteriaList = edited.acceptance_criteria.filter((_: any, i: number) => i !== idx);
                  setEdited(prev => ({ ...prev, acceptance_criteria: newCriteriaList }));
                }}
                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input 
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
              placeholder="Nuevo criterio (Gherkin)..."
              className="flex-1 bg-teal-dark/50 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-400 outline-none focus:border-teal-400"
            />
            <button 
              onClick={() => {
                if (!newCriteria) return;
                setEdited(prev => ({ ...prev, acceptance_criteria: [...(prev.acceptance_criteria || []), newCriteria] }));
                setNewCriteria('');
              }}
              className="px-3 py-1.5 bg-teal-400/20 text-teal-400 rounded-lg text-[10px] font-bold hover:bg-teal-400/30 transition-all flex items-center gap-1"
            >
              <Plus size={14} /> Añadir
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button 
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 transition-all"
        >
          Descartar
        </button>
        <button 
          onClick={() => onSave(edited)}
          className="px-6 py-2 bg-teal-400 text-teal-dark rounded-xl text-sm font-bold hover:bg-teal-500 transition-all flex items-center gap-2"
        >
          <Save size={16} /> Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ data, phaseId, onUpdateArtifact }) => {
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  if (!data) return null;

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="space-y-3 mb-8">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest border-b border-teal-400/20 pb-2">{title}</h3>
      <div className="text-slate-300">{content}</div>
    </div>
  );

  const renderList = (items: any[]) => (
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm">{typeof item === 'string' ? item : JSON.stringify(item)}</li>
      ))}
    </ul>
  );

  const renderTable = (headers: string[], rows: any[][]) => (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold">
          <tr>
            {headers.map((h, i) => <th key={i} className="px-4 py-2">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              {row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Custom rendering based on phase
  switch (phaseId) {
    case 0: // Visión
      const p = data.project || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Proyecto", <div className="space-y-1"><div className="text-xl font-bold text-white">{p.name}</div><p className="text-sm italic">{p.goal}</p></div>)}
            {renderSection("Problema", <p className="text-sm">{p.problem_statement}</p>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Métricas de Éxito", renderList(p.success_metrics || []))}
            {renderSection("Stakeholders", renderTable(["Rol", "Necesidad"], (p.stakeholders || []).map((s: any) => [s.role, s.need])))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Actores", renderTable(["Nombre", "Descripción"], (p.actors || []).map((a: any) => [a.name, a.description])))}
            {renderSection("MVP Scope", <p className="text-sm">{p.mvp_scope}</p>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderSection("Restricciones", renderList(p.constraints || []))}
            {renderSection("Supuestos", renderList(p.assumptions || []))}
            {renderSection("Ambientes", renderList(p.environments || []))}
          </div>
        </div>
      );

    case 1: { // Backlog (Smart Product Backlog)
      const epics = data.epics || [];
      const stories = data.user_stories || [];
      const requirements = data.requirements || {};

      return (
        <div className="space-y-12">
          {/* Epics and Stories Grouped */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest border-b border-teal-400/20 pb-2">User Stories by Epic</h3>
            {epics.map((epic: any) => (
              <div key={epic.id} className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Epic {epic.id}</div>
                  <div className="text-lg font-bold text-white">{epic.name}</div>
                  <div className="text-sm text-slate-400 mt-1">{epic.business_outcome}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 ml-4 border-l-2 border-white/5 pl-4">
                  {stories.filter((s: any) => s.epic_id === epic.id).map((story: any) => {
                    const acceptanceCriteria = story.acceptance_criteria || [];
                    const dependencies = story.dependencies || [];
                    const dor = story.definition_of_ready || [];
                    const dod = story.definition_of_done || [];

                    return (
                      <div key={story.id} className="glass-panel p-5 space-y-4 border border-white/5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 max-w-full">
                            <div className="text-[10px] text-teal-400 font-mono">ID: {story.id}</div>
                            <h4 className="text-md font-bold text-white">{story.title}</h4>
                            <p className="text-sm text-slate-300 font-medium italic">{story.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-sm">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-teal-400 uppercase">Valor de Negocio</div>
                            <div className="text-white font-medium">{story.business_value || 'N/D'}/10</div>
                          </div>

                          {dependencies.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-teal-400 uppercase">Dependencias</div>
                              <div className="flex flex-wrap gap-1">
                                {dependencies.map((depId: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[10px] font-mono">
                                    {depId}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {acceptanceCriteria.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-white/5">
                            <div className="text-xs font-bold text-teal-400 uppercase">Criterios de Aceptación</div>
                            <ol className="list-decimal list-inside space-y-1 pl-1 text-sm text-slate-300">
                              {acceptanceCriteria.map((criterion: string, i: number) => (
                                <li key={i}>{criterion}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs">
                          {dor.length > 0 && (
                            <div className="space-y-1">
                              <div className="font-bold text-teal-400 uppercase">Definición de Listo (DoR)</div>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                {dor.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dod.length > 0 && (
                            <div className="space-y-1">
                              <div className="font-bold text-teal-400 uppercase">Definición de Terminado (DoD)</div>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                {dod.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderSection("Requerimientos Funcionales", renderTable(["ID", "Descripción"], (requirements.functional || []).map((r: any) => [r.id, r.description])))}
            {renderSection("No Funcionales", renderTable(["ID", "Descripción"], (requirements.non_functional || []).map((r: any) => [r.id, r.description])))}
          </div>
        </div>
      );
    }

    case 2: { // Clasificación (Smart Product Backlog with decision matrix)
      const epics = data.epics || [];
      const stories = data.user_stories || [];
      const requirements = data.requirements || {};

      const handleSaveStory = (storyId: string, updatedStory: any) => {
        const newStories = stories.map((s: any) => 
          s.id === storyId ? { ...updatedStory, isManualEdit: true } : s
        );
        onUpdateArtifact?.({ ...data, user_stories: newStories });
        setEditingStoryId(null);
      };

      return (
        <div className="space-y-12">
          {/* Epics and Stories Grouped */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest border-b border-teal-400/20 pb-2">User Stories by Epic</h3>
            {epics.map((epic: any) => (
              <div key={epic.id} className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Epic {epic.id}</div>
                  <div className="text-lg font-bold text-white">{epic.name}</div>
                  <div className="text-sm text-slate-400 mt-1">{epic.business_outcome}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 ml-4 border-l-2 border-white/5 pl-4">
                  {stories.filter((s: any) => s.epic_id === epic.id).map((story: any) => {
                    const classification = story.classification || story.classification_metrics || {};
                    const d1Val = classification.d1 ?? classification.dimension_1 ?? 0;
                    const d2Val = classification.d2 ?? classification.dimension_2 ?? 0;
                    const d3Val = classification.d3 ?? classification.dimension_3 ?? 0;
                    const scoreC = classification.score ?? classification.score_c ?? (d1Val + d2Val + d3Val);
                    const classType = classification.type || story.hu_type || 'tradicional';
                    const supervision = story.human_oversight_model || classification.human_oversight_model || (classType === 'potenciada_ia' ? 'HITL' : classType === 'mixta_ia_humano' ? 'HOTL' : 'HOOTL');
                    const reasoningText = classification.reasoning || story.classification_reasoning || 'Sin razonamiento';

                    return (
                      <div key={story.id}>
                        {editingStoryId === story.id ? (
                          <div className="glass-panel p-6 space-y-6 border-2 border-teal-400/50 bg-teal-400/5">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <h4 className="text-lg font-bold text-white">Editar Historia {story.id}</h4>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setEditingStoryId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-all flex items-center gap-2"
                                >
                                  <X size={14} /> Cancelar
                                </button>
                              </div>
                            </div>
                            
                            <StoryEditor 
                              story={story} 
                              onSave={(updated) => handleSaveStory(story.id, updated)} 
                              onCancel={() => setEditingStoryId(null)} 
                            />
                          </div>
                        ) : (
                          <div className="glass-panel p-5 space-y-4 border border-white/5 hover:border-teal-400/30 transition-colors relative group">
                            <button 
                              onClick={() => setEditingStoryId(story.id)}
                              className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Editar historia"
                            >
                              <Edit2 size={16} />
                            </button>

                            <div className="flex justify-between items-start pr-8">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-[10px] text-teal-400 font-mono">Story {story.id}</div>
                                  {story.isManualEdit && (
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase">
                                      <CheckCircle2 size={8} /> Editado por investigador
                                    </div>
                                  )}
                                </div>
                                <h4 className="text-md font-bold text-white">{story.title}</h4>
                                <p className="text-sm text-slate-300 font-medium italic">{story.description}</p>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <div className={cn(
                                  "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                                  classType === 'potenciada_ia' ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                  classType === 'mixta_ia_humano' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                  "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                )}>
                                  {classType.replace(/_/g, ' ')}
                                </div>
                                <div className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-slate-400 uppercase border border-white/5">
                                  Supervisión: {supervision}
                                </div>
                              </div>
                            </div>

                            {/* Decision Matrix Scores */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-black/20 p-2 rounded text-center">
                                <div className="text-[9px] text-slate-500 uppercase">D1 Patterns</div>
                                <div className="text-xs font-bold text-white">{d1Val}</div>
                              </div>
                              <div className="bg-black/20 p-2 rounded text-center">
                                <div className="text-[9px] text-slate-500 uppercase">D2 Data</div>
                                <div className="text-xs font-bold text-white">{d2Val}</div>
                              </div>
                              <div className="bg-black/20 p-2 rounded text-center">
                                <div className="text-[9px] text-slate-500 uppercase">D3 Tolerance</div>
                                <div className="text-xs font-bold text-white">{d3Val}</div>
                              </div>
                              <div className="bg-teal-400/10 p-2 rounded text-center border border-teal-400/20">
                                <div className="text-[9px] text-teal-400 uppercase font-bold font-sans">Score C</div>
                                <div className="text-xs font-bold text-teal-400 font-mono">{scoreC}</div>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded italic">
                              <span className="font-bold text-slate-500 not-italic uppercase text-[9px] mr-2">Razonamiento:</span>
                              {reasoningText}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderSection("Requerimientos Funcionales", renderTable(["ID", "Descripción"], (requirements.functional || []).map((r: any) => [r.id, r.description])))}
            {renderSection("No Funcionales", renderTable(["ID", "Descripción"], (requirements.non_functional || []).map((r: any) => [r.id, r.description])))}
          </div>
        </div>
      );
    }

    case 3: // Estimación
      return (
        <div className="space-y-8">
          <div className="bg-teal-medium/30 p-6 rounded-xl border border-teal-400/20 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">Análisis del Equipo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderSection("Calidad del Contexto", <span className="px-2 py-1 bg-teal-400/20 text-teal-400 rounded text-xs font-bold uppercase">{data.team_analysis?.team_context_quality}</span>)}
              {renderSection("Velocidad Referencia", <div className="text-2xl font-bold text-white">{data.velocity_reference?.avg_points_per_sprint} <span className="text-xs text-slate-400">SP/Sprint</span></div>)}
              {renderSection("Base", <span className="text-xs text-slate-400">{data.velocity_reference?.basis}</span>)}
            </div>
            {renderSection("Escala Personalizada", renderTable(["Puntos", "Significado"], Object.entries(data.personal_scale || {}).map(([k, v]) => [k, v])))}
          </div>
          {renderSection("Estimaciones", renderTable(["Story ID", "Puntos", "Horas", "Confianza", "Referencia"], (data.estimations || []).map((e: any) => [e.story_id, e.story_points, e.estimated_hours, e.confidence, e.reference_story || 'N/A'])))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Totales", <div className="text-xl font-bold text-white">{data.total_points} Puntos / {data.estimated_sprints} Sprints</div>)}
            {renderSection("Advertencias", renderList(data.estimation_warnings || []))}
          </div>
        </div>
      );

    case 4: // Priorización
      const backlog = data.prioritized_backlog || [];
      const analysis = data.company_analysis || {};
      
      // Si la estructura normal falla o no hay análisis, mostrar lista simple de respaldo
      if (backlog.length > 0 && !analysis.primary_pain) {
        return (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-yellow-400 text-sm font-bold">Modo de Respaldo: Priorización Detectada</p>
            </div>
            <div className="space-y-4">
              {backlog.map((b: any, idx: number) => {
                // WSJF Score Order of precedence
                let wsjfVal: any = 'N/D';
                if (b.priority_score !== undefined && b.priority_score !== null) {
                  wsjfVal = b.priority_score;
                } else if (b.wsjf_score !== undefined && b.wsjf_score !== null) {
                  wsjfVal = b.wsjf_score;
                } else if (b.final_score !== undefined && b.final_score !== null) {
                  wsjfVal = b.final_score;
                } else if (
                  b.vn_score !== undefined && b.vn_score !== null &&
                  b.ce_score !== undefined && b.ce_score !== null &&
                  b.rt_score !== undefined && b.rt_score !== null &&
                  Number(b.rt_score) !== 0
                ) {
                  wsjfVal = ((Number(b.vn_score) + Number(b.ce_score)) / Number(b.rt_score)).toFixed(2);
                }

                // Justification Order of precedence
                let justVal: string = 'Sin justificación';
                if (b.priority_justification) {
                  justVal = b.priority_justification;
                } else if (b.justification_company_specific) {
                  justVal = b.justification_company_specific;
                } else if (b.score_justification) {
                  justVal = b.score_justification;
                } else if (b.explanation) {
                  justVal = b.explanation;
                }

                return (
                  <div key={b.story_id || idx} className="glass-panel p-4 border-l-4 border-l-teal-400">
                    <div className="font-bold text-white">Historia: {b.story_id} (Posición: {b.position}) - WSJF: {wsjfVal}</div>
                    <div className="text-sm text-slate-300 mt-1">{justVal}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-8">
          <div className="bg-teal-medium/30 p-6 rounded-xl border border-teal-400/20 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">Análisis de la Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderSection("Dolor Principal", <p className="text-sm">{analysis.primary_pain || 'N/A'}</p>)}
              {renderSection("Usuario Crítico", <p className="text-sm">{analysis.critical_user_profile || 'N/A'}</p>)}
            </div>
            {renderSection("Restricciones No Negociables", renderList(analysis.non_negotiable_constraints || []))}
          </div>
          {renderSection("Backlog Priorizado", renderTable(["Pos", "Story ID", "WSJF", "Justificación"], backlog.map((b: any) => {
            // WSJF Score Order of precedence
            let wsjfVal: any = 'N/D';
            if (b.priority_score !== undefined && b.priority_score !== null) {
              wsjfVal = b.priority_score;
            } else if (b.wsjf_score !== undefined && b.wsjf_score !== null) {
              wsjfVal = b.wsjf_score;
            } else if (b.final_score !== undefined && b.final_score !== null) {
              wsjfVal = b.final_score;
            } else if (
              b.vn_score !== undefined && b.vn_score !== null &&
              b.ce_score !== undefined && b.ce_score !== null &&
              b.rt_score !== undefined && b.rt_score !== null &&
              Number(b.rt_score) !== 0
            ) {
              wsjfVal = ((Number(b.vn_score) + Number(b.ce_score)) / Number(b.rt_score)).toFixed(2);
            }

            // Justification Order of precedence
            let justVal: string = 'N/A';
            if (b.priority_justification) {
              justVal = b.priority_justification;
            } else if (b.justification_company_specific) {
              justVal = b.justification_company_specific;
            } else if (b.score_justification) {
              justVal = b.score_justification;
            }

            return [
              b.position || '?', 
              b.story_id || '?', 
              wsjfVal, 
              justVal
            ];
          })))}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['sprint_1', 'sprint_2', 'sprint_3'].map(s => {
              const sprint = data.sprint_plan?.[s] || {};
              const capacity = sprint.capacity_used_percent || 0;
              const exceedsLimit = capacity > 70;
              return (
                <div key={s} className="glass-panel p-4 space-y-2">
                  <div className="text-xs font-bold text-teal-400 uppercase">{s.replace('_', ' ')}</div>
                  <div className="text-sm font-bold text-white">{sprint.goal || 'Pendiente'}</div>
                  <div className="text-[10px] text-slate-400">
                    {sprint.total_points || 0} SP (
                    <span className={cn(exceedsLimit ? "text-red-500 font-bold" : "text-slate-400")}>
                      {capacity}%
                    </span>
                    )
                  </div>
                  {exceedsLimit && (
                    <div className="text-[9px] text-red-500 bg-red-500/10 p-1.5 rounded border border-red-500/20 font-bold uppercase tracking-tight mt-1 animate-pulse">
                      Supera el límite del 70 por ciento recomendado por la metodología AIASE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 5: // Arquitectura
      const arch = data.architecture?.recommended || {};
      const safeJoin = (val: any) => Array.isArray(val) ? val.join(', ') : '';
      
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Estilo Recomendado", <div className="space-y-2"><div className="text-lg font-bold text-white">{arch.style || 'N/A'}</div><p className="text-sm">{arch.justification || 'N/A'}</p></div>)}
            {renderSection("Stack Técnico", renderTable(["Capa", "Tecnología"], [["Frontend", arch.frontend || 'N/A'], ["Backend", arch.backend || 'N/A'], ["Database", arch.database || 'N/A']]))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Componentes IA", renderList(arch.ai_components || []))}
            {renderSection("Seguridad", renderList(arch.security_baseline || []))}
          </div>
          {renderSection("Modelo de Datos", renderTable(["Entidad", "Atributos", "Relaciones"], (data.data_model?.entities || []).map((e: any) => [e.name || 'N/A', safeJoin(e.attributes), safeJoin(e.relationships)])))}
          {renderSection("Alternativas", renderTable(["Nombre", "Pros", "Cons"], (data.alternatives || []).map((a: any) => [a.name || 'N/A', safeJoin(a.pros), safeJoin(a.cons)])))}
          {data.integrations && data.integrations.length > 0 && renderSection("Integraciones", renderTable(["Sistema", "Tipo", "Protocolo"], data.integrations.map((i: any) => [i.system || 'N/A', i.type || 'N/A', i.protocol || 'N/A'])))}
          {data.security_decisions && data.security_decisions.length > 0 && renderSection("Decisiones de Seguridad", renderTable(["Decisión", "Razón"], data.security_decisions.map((d: any) => [d.decision || 'N/A', d.rationale || 'N/A'])))}
        </div>
      );

    case 6: // Diseño Técnico
      return (
        <div className="space-y-8">
          {(data.design_artifacts || []).map((art: any, i: number) => (
            <div key={i} className="glass-panel p-6 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Story ID: {art.story_id}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Contrato API</h4>
                  {renderTable(["Método", "Path", "Descripción"], (art.api_contract?.endpoints || []).map((e: any) => [e.method, e.path, e.description]))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Componentes UI</h4>
                  {renderTable(["Nombre", "Tipo", "Props"], (art.ui_components || []).map((c: any) => [c.name, c.type, (c.props || []).join(', ')]))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Diagrama de Secuencia</h4>
                {renderTable(["Actor", "Acción", "Target"], (art.sequence_diagram?.steps || []).map((s: any) => [s.actor, s.action, s.target]))}
              </div>
            </div>
          ))}
        </div>
      );

    case 7: // Código
      const totalFiles = (data.code_artifacts || []).reduce((acc: number, art: any) => acc + (art.files?.length || 0), 0);
      
      if (totalFiles === 0) {
        return (
          <div className="p-8 text-center space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl inline-block max-w-md">
              <p className="text-red-400 font-bold text-lg mb-2">Error de Generación</p>
              <p className="text-slate-400 text-sm">El agente no generó código, por favor rechaza y vuelve a ejecutar.</p>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-8">
          {(data.code_artifacts || []).map((art: any, i: number) => (
            <div key={i} className="space-y-4">
              <h3 className="text-lg font-bold text-white">Story ID: {art.story_id}</h3>
              {(art.files || []).map((file: any, j: number) => (
                <div key={j} className="glass-panel overflow-hidden">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                    <span className="text-xs font-mono text-teal-400">{file.path}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{file.language}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    <code>{file.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Dependencias", renderList(data.dependencies_required || []))}
            {renderSection("Variables de Entorno", renderList(data.environment_variables || []))}
          </div>
        </div>
      );

    case 8: // QA
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-teal-medium/30 p-4 rounded-xl border border-teal-400/20">
            <span className="text-sm font-bold text-white">Cobertura Estimada</span>
            <span className="text-2xl font-bold text-teal-400">{data.coverage_estimate}%</span>
          </div>
          {(data.test_suite || []).map((suite: any, i: number) => (
            <div key={i} className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Story ID: {suite.story_id}</h3>
              {(suite.unit_tests || []).map((test: any, j: number) => (
                <div key={j} className="border-l-2 border-teal-400 pl-4 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{test.description}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded uppercase">{test.type}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-teal-400 font-bold">GIVEN</span> {test.given} <br/>
                    <span className="text-teal-400 font-bold">WHEN</span> {test.when} <br/>
                    <span className="text-teal-400 font-bold">THEN</span> {test.then}
                  </div>
                  <pre className="mt-2 p-3 bg-black/30 rounded text-[10px] font-mono text-slate-400">
                    <code>{test.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          ))}
          {renderSection("Casos Manuales Requeridos", renderList(data.manual_cases_required || []))}
        </div>
      );

    case 9: // Despliegue
      const depl = data.deployment || {};
      const mon = data.monitoring || {};
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {renderSection("Pipeline CI/CD", <div className="glass-panel p-4 space-y-2"><div className="text-sm font-bold text-white">{depl.pipeline?.tool}</div><pre className="text-[10px] font-mono text-slate-400 bg-black/20 p-2 rounded">{depl.pipeline?.config_content}</pre></div>)}
              {renderSection("Infraestructura", renderTable(["Ambiente", "Tipo"], (depl.infrastructure || []).map((i: any) => [i.environment, i.config_type])))}
            </div>
            <div className="space-y-6">
              {renderSection("Monitoreo KPIs", renderTable(["Nombre", "Target", "Alerta"], (mon.kpis || []).map((k: any) => [k.name, k.target, k.alert_threshold])))}
              {renderSection("Alertas", renderTable(["Nombre", "Condición", "Severidad"], (mon.alerts || []).map((a: any) => [a.name, a.condition, a.severity])))}
              {renderSection("SLOs", renderTable(["Servicio", "Disponibilidad", "Latencia"], (mon.slos || []).map((s: any) => [s.service, s.availability_target, s.latency_p99])))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderSection("Plan de Rollback", <p className="text-sm">{depl.rollback_plan}</p>)}
            {renderSection("Secretos Requeridos", renderList(depl.secrets_required || []))}
            {renderSection("Logging", <div className="text-sm">Retención: {mon.logging?.retention_days} días <br/> Enmascarado: {(mon.logging?.sensitive_fields_masked || []).join(', ')}</div>)}
          </div>
        </div>
      );

    default:
      return <pre className="text-xs text-slate-400 bg-black/20 p-4 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
  }
};
