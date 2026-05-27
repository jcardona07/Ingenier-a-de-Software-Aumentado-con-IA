import React from 'react';
import { cn } from '../lib/utils';

interface ArtifactViewerProps {
  data: any;
  phaseId: number;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ data, phaseId }) => {
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
    case 1: // Visión
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

    case 2: // Backlog
      return (
        <div className="space-y-8">
          {renderSection("Épicas", renderTable(["ID", "Nombre", "Resultado de Negocio"], (data.epics || []).map((e: any) => [e.id, e.name, e.business_outcome])))}
          {renderSection("Historias de Usuario", renderTable(["ID", "Título", "Descripción", "Tipo"], (data.user_stories || []).map((s: any) => [s.id, s.title, s.description, s.hu_type])))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection("Requerimientos Funcionales", renderTable(["ID", "Descripción", "Prioridad"], (data.requirements?.functional || []).map((r: any) => [r.id, r.description, r.priority])))}
            {renderSection("No Funcionales", renderTable(["ID", "Descripción", "Categoría"], (data.requirements?.non_functional || []).map((r: any) => [r.id, r.description, r.category])))}
          </div>
        </div>
      );

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
              {backlog.map((b: any, idx: number) => (
                <div key={b.story_id || idx} className="glass-panel p-4 border-l-4 border-l-teal-400">
                  <div className="font-bold text-white">Historia: {b.story_id} (Posición: {b.position})</div>
                  <div className="text-sm text-slate-300 mt-1">{b.justification_company_specific || b.score_justification || b.explanation || "Sin justificación"}</div>
                </div>
              ))}
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
          {renderSection("Backlog Priorizado", renderTable(["Pos", "Story ID", "WSJF", "Justificación"], backlog.map((b: any) => [
            b.position || '?', 
            b.story_id || '?', 
            b.wsjf_score || b.final_score || '?', 
            b.justification_company_specific || b.score_justification || 'N/A'
          ])))}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['sprint_1', 'sprint_2', 'sprint_3'].map(s => (
              <div key={s} className="glass-panel p-4 space-y-2">
                <div className="text-xs font-bold text-teal-400 uppercase">{s.replace('_', ' ')}</div>
                <div className="text-sm font-bold text-white">{data.sprint_plan?.[s]?.goal || 'Pendiente'}</div>
                <div className="text-[10px] text-slate-400">{data.sprint_plan?.[s]?.total_points || 0} SP ({data.sprint_plan?.[s]?.capacity_used_percent || 0}%)</div>
              </div>
            ))}
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
