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
  averageVelocity: number;
  teamHistory: string;
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
}

export interface AppState {
  mode: 'Single' | 'Dual';
  geminiKey: string;
  claudeKey: string;
  isGeminiVerified: boolean;
  isClaudeVerified: boolean;
  orgContext: OrgContext | null;
  currentPhaseIndex: number;
  phases: Phase[];
  projectIdea: string;
}

export const INITIAL_PHASES: Phase[] = [
  { id: 1, name: "Visión", specialty: "Descubrimiento de Producto", agentName: "Agente 1", model: 'Gemini', status: 'locked' },
  { id: 2, name: "Backlog", specialty: "Historias de Usuario y Requerimientos", agentName: "Agente 2", model: 'Gemini', status: 'locked' },
  { id: 3, name: "Estimación", specialty: "Estimación Ágil", agentName: "Agente 3", model: 'Claude', status: 'locked' },
  { id: 4, name: "Priorización", specialty: "Alineación de Valor de Negocio", agentName: "Agente 4", model: 'Claude', status: 'locked' },
  { id: 5, name: "Arquitectura", specialty: "Diseño de Sistema y DevSecOps", agentName: "Agente 5", model: 'Claude', status: 'locked' },
  { id: 6, name: "Diseño", specialty: "Diseño de API e Interfaz", agentName: "Agente 6", model: 'Claude', status: 'locked' },
  { id: 7, name: "Código", specialty: "Implementación Full-stack", agentName: "Agente 7", model: 'Gemini', status: 'locked' },
  { id: 8, name: "QA", specialty: "Pruebas y Seguridad", agentName: "Agente 8", model: 'Claude', status: 'locked' },
  { id: 9, name: "Despliegue", specialty: "CI/CD y Monitoreo", agentName: "Agente 9", model: 'Gemini', status: 'locked' },
];
