
export type AgentType = 'main' | 'sales' | 'existing' | 'support';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 encoded image data
  timestamp: Date;
  isError?: boolean;
  feedback?: 'positive' | 'negative';
  groundingLinks?: Array<{ title: string; uri: string }>;
  ticketId?: string; // Track generated ticket IDs
  quickFixes?: string[]; // Suggested troubleshooting steps
}

export interface KnowledgeSource {
  id: string;
  name: string;
  size: number;
  data: string; // base64
  mimeType: string;
}

export interface WebResource {
  id: string;
  title: string;
  uri: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  knowledgeSources: KnowledgeSource[];
  webResources: WebResource[];
}

export enum ServiceType {
  MOBILE = 'Mobile',
  FIBER = 'Fiber',
  PEOTV = 'PEOTV',
  ENTERPRISE = 'Enterprise'
}

export interface IncidentReport {
  customerName: string;
  email: string;
  serviceType: string;
  issueDescription: string;
  location: string;
}
