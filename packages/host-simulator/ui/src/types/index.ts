export interface Persona {
  id: string;
  name: string;
  role: string;
  isSiteAdmin: boolean;
  licenseTier: "Essential" | "Advanced" | "UltimateIQ";
  isOnTrial: boolean;
  tenantId: string;
  instanceFeatureFlag: boolean;
  tenantFeatureFlag: boolean;
  kpis: Record<string, number | string>;
}

export interface ResolvedMessage {
  id: string;
  title: string;
  body: string;
  upgradePath: string;
  displayOrder: number;
}

export interface GetMessagesResponse {
  messages: ResolvedMessage[];
  reason?: string;
}
