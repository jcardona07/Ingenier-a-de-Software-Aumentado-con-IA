/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrgContext {
  companyName: string;
  industry: string;
  techStack: string;
  qualityStandards: string;
  definitionOfDone: string;
  constraints: string;
  averageVelocity?: number;
  teamHistory?: string;
}

export type PhaseStatus = 'locked' | 'working' | 'waiting' | 'approved' | 'rejected';

export interface Phase {
  id: number;
  name: string;
  specialty: string;
  agentName: string;
  model: 'Gemini' | 'Claude';
  status: PhaseStatus;
  artifact?: any;
  rejectionReason?: string;
  regenerations?: number;
}

export interface ExperimentMetric {
  phaseId: number;
  phaseName: string;
  model: string;
  ragActive: boolean;
  durationSeconds: number;
  attempts: number;
  finalDecision: string;
  artifactAtApproval?: any;
  manualEditsCount?: number;
  totalItemsCount?: number;
}

export interface AppState {
  mode: 'Single' | 'Dual';
  experimentMode: 'full' | 'research';
  ragActive: boolean;
  geminiKey: string;
  claudeKey: string;
  isGeminiVerified: boolean;
  isClaudeVerified: boolean;
  orgContext: OrgContext | null;
  teamRepoUrl: string;
  teamRepoContext: any | null;
  currentPhaseIndex: number;
  phases: Phase[];
  projectIdea: string;
  experimentMetrics: ExperimentMetric[];
}

export const INITIAL_PHASES: Phase[] = [
  { id: 0, name: "Visión", specialty: "Descubrimiento del Producto", agentName: "Agente de Visión", model: 'Gemini', status: 'locked' },
  { id: 1, name: "Backlog", specialty: "Generación de Historias de Usuario", agentName: "Agente de Backlog", model: 'Gemini', status: 'locked' },
  { id: 2, name: "Clasificación", specialty: "Matriz de Decisión IA vs Tradicional", agentName: "Agente de Clasificación", model: 'Gemini', status: 'locked' },
  { id: 3, name: "Estimación", specialty: "Analogía Contextualizada con RAG", agentName: "Agente de Estimación", model: 'Claude', status: 'locked' },
  { id: 4, name: "Priorización", specialty: "Valor Neto Ajustado por Riesgo", agentName: "Agente de Priorización", model: 'Claude', status: 'locked' },
  { id: 5, name: "Arquitectura", specialty: "Diseño de Sistema y DevSecOps", agentName: "Agente 5", model: 'Claude', status: 'locked' },
  { id: 6, name: "Diseño", specialty: "Diseño de API e Interfaz", agentName: "Agente 6", model: 'Claude', status: 'locked' },
  { id: 7, name: "Código", specialty: "Implementación Full-stack", agentName: "Agente 7", model: 'Gemini', status: 'locked' },
  { id: 8, name: "QA", specialty: "Pruebas y Seguridad", agentName: "Agente 8", model: 'Claude', status: 'locked' },
  { id: 9, name: "Despliegue", specialty: "CI/CD y Monitoreo", agentName: "Agente 9", model: 'Gemini', status: 'locked' },
];
