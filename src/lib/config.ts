export const config = {
  mimo: {
    baseUrl: 'https://api.xiaomimimo.com/v1',
    model: 'MiMo-V2.5-Flash',
    maxTokens: 2000,
    temperature: 0.8,
  },
  debate: {
    totalRounds: 8,
    agentsPerRound: 4,
    maxTokensPerAgent: 8000,
    maxTokensSynthesis: 6000,
  },
  app: {
    name: 'MiMo Debate Arena',
    version: '1.0.0',
    description: 'Multi-Agent AI Debate Platform powered by MiMo',
  }
};

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mimo_api_key');
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mimo_api_key', key);
}

export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mimo_api_key');
}
