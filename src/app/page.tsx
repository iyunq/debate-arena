'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { agents, synthesizer, debateTopics, DebateMessage, DebateState } from '@/lib/agents';
import { config, getApiKey, setApiKey } from '@/lib/config';
import {
  Layers, Settings, X, Zap, ArrowRight, Clock,
  MessageSquare, Hash, Trophy, Flame, Send, Loader2,
  BarChart3, Sparkles, Brain, Lightbulb, Target,
  Compass, Globe, Cpu, Users, ChevronRight,
  RefreshCw, CheckCircle2, AlertCircle, Quote,
  Play, Shuffle, TrendingUp, Award
} from 'lucide-react';

const agentIconMap: Record<string, React.ReactNode> = {
  '☀️': <Sparkles className="w-5 h-5" />,
  '🔍': <Target className="w-5 h-5" />,
  '📊': <BarChart3 className="w-5 h-5" />,
  '🔄': <Compass className="w-5 h-5" />,
  '🧠': <Brain className="w-5 h-5" />,
};

const agentColorMap: Record<string, string> = {
  Optimist: 'var(--accent-green)',
  Skeptic: 'var(--accent-orange)',
  Analyst: 'var(--accent-blue)',
  Contrarian: 'var(--accent-purple)',
  Synthesizer: 'var(--accent-yellow)',
};

const topicCategoryIcons: Record<string, React.ReactNode> = {
  Technology: <Cpu className="w-4 h-4" />,
  Workplace: <Users className="w-4 h-4" />,
  Society: <Globe className="w-4 h-4" />,
  Finance: <BarChart3 className="w-4 h-4" />,
  Environment: <Lightbulb className="w-4 h-4" />,
  Education: <Brain className="w-4 h-4" />,
};

const stats = [
  { label: 'Agents Active', value: '4', icon: Layers, desc: 'Unique perspectives' },
  { label: 'Debate Rounds', value: '3', icon: MessageSquare, desc: 'Per session' },
  { label: 'Tokens Used', value: '0', icon: Zap, dynamic: true, desc: 'Total consumed' },
  { label: 'MiMo Model', value: 'V2.5', icon: BarChart3, desc: 'Reasoning engine' },
];

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function Home() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [debateState, setDebateState] = useState<DebateState>({
    topic: '',
    messages: [],
    currentRound: 1,
    totalRounds: config.debate.totalRounds,
    currentAgentIndex: 0,
    phase: 'idle',
    tokensUsed: 0,
  });
  const [tokenBreakdown, setTokenBreakdown] = useState({ prompt: 0, completion: 0, total: 0 });
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) setApiKeyState(savedKey);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateState.messages]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setShowSettings(false);
    }
  };

  const startDebate = async (topic: string) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setSelectedTopic(topic);
    setIsStarting(true);
    setDebateState({
      topic,
      messages: [],
      currentRound: 1,
      totalRounds: config.debate.totalRounds,
      currentAgentIndex: 0,
      phase: 'debating',
      tokensUsed: 0,
      startTime: Date.now(),
    });
    await runDebate(topic);
  };

  const runDebate = async (topic: string) => {
    let currentMessages: DebateMessage[] = [];

    for (let round = 1; round <= config.debate.totalRounds; round++) {
      for (let agentIdx = 0; agentIdx < agents.length; agentIdx++) {
        try {
          const response = await fetch('/api/debate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, apiKey, messages: currentMessages, currentRound: round, currentAgentIndex: agentIdx, phase: 'debating' }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate response');
          }
          const result = await response.json();
          const message = { ...result };
          delete message.usage;
          currentMessages = [...currentMessages, message];
          const usage = result.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
          setDebateState(prev => ({
            ...prev,
            messages: [...currentMessages],
            currentRound: round,
            currentAgentIndex: agentIdx,
            tokensUsed: prev.tokensUsed + (usage.total_tokens || estimateTokens(result.content)),
          }));
          setTokenBreakdown(prev => ({
            prompt: prev.prompt + (usage.prompt_tokens || 0),
            completion: prev.completion + (usage.completion_tokens || 0),
            total: prev.total + (usage.total_tokens || 0),
          }));
          await new Promise(resolve => setTimeout(resolve, 400));
        } catch (error: any) {
          console.error('Debate error:', error);
          alert(`Error: ${error.message}`);
          setIsStarting(false);
          return;
        }
      }
    }

    setDebateState(prev => ({ ...prev, phase: 'synthesizing' }));
    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, apiKey, messages: currentMessages, phase: 'synthesizing' }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate synthesis');
      }
      const synthesisResult = await response.json();
      const synthesis = { ...synthesisResult };
      delete synthesis.usage;
      currentMessages = [...currentMessages, synthesis];
      const synthUsage = synthesisResult.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      setDebateState(prev => ({
        ...prev,
        messages: [...currentMessages],
        phase: 'complete',
        tokensUsed: prev.tokensUsed + (synthUsage.total_tokens || estimateTokens(synthesisResult.content)),
        endTime: Date.now(),
      }));
      setTokenBreakdown(prev => ({
        prompt: prev.prompt + (synthUsage.prompt_tokens || 0),
        completion: prev.completion + (synthUsage.completion_tokens || 0),
        total: prev.total + (synthUsage.total_tokens || 0),
      }));
    } catch (error: any) {
      console.error('Synthesis error:', error);
      alert(`Error: ${error.message}`);
    }
    setIsStarting(false);
  };

  const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

  const resetDebate = () => {
    setDebateState({ topic: '', messages: [], currentRound: 1, totalRounds: config.debate.totalRounds, currentAgentIndex: 0, phase: 'idle', tokensUsed: 0 });
    setTokenBreakdown({ prompt: 0, completion: 0, total: 0 });
    setSelectedTopic('');
  };

  const getProgress = () => {
    if (debateState.phase === 'complete') return 100;
    if (debateState.phase === 'synthesizing') return 95;
    return ((debateState.currentRound - 1) * agents.length + debateState.currentAgentIndex + 1) / (debateState.totalRounds * agents.length) * 100;
  };

  return (
    <div className="min-h-screen noise-bg">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: 'rgba(6, 6, 10, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Debate Arena</h1>
              <p className="text-[10px] text-[var(--text-muted)]">Multi-Agent AI System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {apiKey ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" style={{ boxShadow: '0 0 6px var(--accent-green)' }} />
                <span className="text-[var(--text-secondary)]">API Connected</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)]" />
                <span className="text-[var(--text-muted)]">No API Key</span>
              </div>
            )}
            <Link
              href="/analytics"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="modal-content animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)]">
                    <Settings className="w-4 h-4 text-[var(--accent-purple)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Settings</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure your MiMo API key</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">MiMo API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-mimo-..."
                  className="input-field w-full px-4 py-3 text-sm"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Get your key from{' '}
                <a href="https://platform.xiaomimimo.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-blue)] hover:underline">
                  platform.xiaomimimo.com
                </a>
              </p>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                className="btn-primary w-full py-3 text-sm"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ IDLE STATE ═══════════════ */}
      {debateState.phase === 'idle' && (
        <div>
          {/* ── Hero ── */}
          <section className="relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] pointer-events-none" style={{
              background: 'radial-gradient(circle, var(--accent-blue), transparent 70%)',
              animation: 'orbFloat 12s ease-in-out infinite',
            }} />
            <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none" style={{
              background: 'radial-gradient(circle, var(--accent-purple), transparent 70%)',
              animation: 'orbFloat 15s ease-in-out infinite reverse',
            }} />
            <div className="absolute bottom-20 left-1/3 w-[300px] h-[300px] rounded-full opacity-[0.05] pointer-events-none" style={{
              background: 'radial-gradient(circle, var(--accent-pink), transparent 70%)',
              animation: 'orbFloat 10s ease-in-out infinite 2s',
            }} />

            <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-28 pb-24 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-subtle text-xs text-[var(--accent-purple)] mb-8 border border-[var(--border)]">
                <Sparkles className="w-3 h-3" />
                <span>Multi-Agent AI Debate System</span>
              </div>

              {/* Title */}
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                AI Debate
                <br />
                <span className="gradient-text">Arena</span>
              </h2>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
                Watch <span className="text-[var(--text-primary)] font-semibold">4 AI agents</span> debate from different perspectives — Optimist, Skeptic, Analyst & Contrarian — then see MiMo synthesize all arguments into a balanced conclusion.
              </p>

              {/* Feature highlights */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-xs">
                {[
                  { icon: Brain, text: 'Multi-Agent Reasoning' },
                  { icon: Zap, text: 'Real-time Synthesis' },
                  { icon: BarChart3, text: 'Token Analytics' },
                ].map((f, i) => (
                  <div key={i} className="feature-card glass-subtle px-4 py-2 rounded-lg border border-[var(--border)] flex items-center gap-2">
                    <f.icon className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                    <span className="text-[var(--text-secondary)]">{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => document.getElementById('start-debate')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-primary px-7 py-3 text-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Start a Debate
                </button>
                <button
                  onClick={() => document.getElementById('agents-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-7 py-3 rounded-xl glass-subtle text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border)] flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Meet the Agents
                </button>
              </div>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card glass rounded-xl p-5 text-center border border-[var(--border)]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <stat.icon className="w-4 h-4 text-[var(--accent-purple)]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 tracking-tight">
                    {stat.dynamic ? debateState.tokensUsed.toLocaleString() : stat.value}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-medium">{stat.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{stat.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Agent Cards ── */}
          <section id="agents-section" className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-subtle text-[10px] text-[var(--accent-cyan)] mb-4 border border-[var(--border)]">
                <Users className="w-3 h-3" />
                <span>DEBATE TEAM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
                <span className="gradient-text">Meet the Agents</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
                Each agent brings a unique perspective to every debate, powered by MiMo reasoning engine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {agents.map((agent, i) => {
                const color = agentColorMap[agent.name] || 'var(--accent-blue)';
                const delay = i * 100;
                return (
                  <div
                    key={agent.id}
                    className="agent-glow-card glass rounded-2xl p-6 border relative overflow-hidden"
                    style={{
                      '--agent-color': color,
                      borderColor: `${color}25`,
                      background: `linear-gradient(180deg, ${color}08 0%, rgba(15, 15, 26, 0.7) 100%)`,
                      animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
                    } as React.CSSProperties}
                  >
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

                    {/* Agent number + avatar */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="text-2xl">{agent.avatar}</div>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-base font-bold mb-0.5" style={{ color }}>{agent.name}</h3>
                    <div className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium mb-4" style={{ background: `${color}15`, color }}>
                      {agent.role}
                    </div>

                    {/* Personality */}
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{agent.personality}</p>

                    {/* Stance */}
                    <div className="pt-3 border-t border-[var(--border)]">
                      <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">&ldquo;{agent.stance}&rdquo;</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Start Debate ── */}
          <section id="start-debate" className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="glass rounded-2xl p-8 sm:p-10 gradient-border relative overflow-hidden">
              {/* Inner glow */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.06] pointer-events-none" style={{
                background: 'radial-gradient(circle, var(--accent-purple), transparent 60%)',
              }} />

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-subtle text-[10px] text-[var(--accent-green)] mb-4 border border-[var(--border)]">
                    <Sparkles className="w-3 h-3" />
                    <span>NEW DEBATE</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Start a Debate</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Enter any topic and watch the agents argue it out from multiple perspectives.</p>
                </div>

                <div className="flex gap-3 max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter any topic for debate..."
                    className="input-field flex-1 px-5 py-3.5 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && customTopic && !isStarting && startDebate(customTopic)}
                  />
                  <button
                    onClick={() => customTopic && startDebate(customTopic)}
                    disabled={!customTopic || isStarting}
                    className="btn-primary px-6 sm:px-8 py-3.5 text-sm flex items-center gap-2"
                  >
                    {isStarting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Debate</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-subtle text-[10px] text-[var(--accent-cyan)] mb-4 border border-[var(--border)]">
                <Play className="w-3 h-3" />
                <span>PROCESS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">How It Works</h2>
              <p className="text-sm text-[var(--text-secondary)]">Four-stage adversarial reasoning pipeline</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { num: '1', icon: Send, title: 'Submit Topic', desc: 'Enter any debate topic or choose from curated suggestions', color: 'var(--accent-blue)' },
                { num: '2', icon: Shuffle, title: 'Multi-Agent Debate', desc: '4 agents argue from unique perspectives across 3 rounds', color: 'var(--accent-purple)' },
                { num: '3', icon: Brain, title: 'Synthesis', desc: 'MiMo analyzes all arguments and generates balanced conclusion', color: 'var(--accent-yellow)' },
                { num: '4', icon: Award, title: 'Results', desc: 'View complete debate transcript with token usage analytics', color: 'var(--accent-green)' },
              ].map((step, i) => (
                <div key={i} className="glass rounded-xl p-5 border border-[var(--border)] text-center" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="step-number mx-auto mb-4" style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}>
                    {step.num}
                  </div>
                  <step.icon className="w-5 h-5 mx-auto mb-3" style={{ color: step.color }} />
                  <h4 className="text-sm font-semibold mb-2 text-[var(--text-primary)]">{step.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Suggested Topics ── */}
          <section className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-subtle text-[10px] text-[var(--accent-blue)] mb-4 border border-[var(--border)]">
                <Lightbulb className="w-3 h-3" />
                <span>SUGGESTED</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Pick a Topic</h2>
              <p className="text-sm text-[var(--text-secondary)]">Choose from curated topics to start instantly</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {debateTopics.map((topic, i) => (
                <button
                  key={topic.id}
                  onClick={() => customTopic ? startDebate(customTopic) : startDebate(topic.title + ': ' + topic.description)}
                  className="topic-card glass rounded-xl p-5 text-left border border-[var(--border)]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--accent-purple)] text-[10px] font-medium border border-[var(--border)]">
                      {topicCategoryIcons[topic.category] || <Hash className="w-3 h-3" />}
                      {topic.category}
                    </span>
                    <ChevronRight className="arrow-slide w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2 text-[var(--text-primary)]">{topic.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{topic.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── Built With ── */}
          <section className="max-w-6xl mx-auto px-6 lg:px-8 mb-24">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-subtle text-[10px] text-[var(--accent-yellow)] mb-4 border border-[var(--border)]">
                <Cpu className="w-3 h-3" />
                <span>STACK</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Built With</h2>
              <p className="text-sm text-[var(--text-secondary)]">Powered by Xiaomi MiMo Reasoning Engine</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { name: 'Next.js 16', icon: '⚡', desc: 'React framework' },
                { name: 'TypeScript', icon: '📘', desc: 'Type safety' },
                { name: 'Tailwind CSS', icon: '🎨', desc: 'Styling' },
                { name: 'MiMo API', icon: '🧠', desc: 'AI reasoning' },
                { name: 'Vercel', icon: '▲', desc: 'Deployment' },
              ].map((t) => (
                <div key={t.name} className="tech-badge glass-subtle px-4 py-3 rounded-lg border border-[var(--border)] text-center">
                  <div className="text-xl mb-2">{t.icon}</div>
                  <div className="text-xs text-[var(--text-primary)] font-semibold mb-0.5">{t.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{t.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════ DEBATE / COMPLETE STATE ═══════════════ */}
      {debateState.phase !== 'idle' && (
        <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
          {/* ── Debate Header ── */}
          <div className="glass rounded-2xl p-6 sm:p-8 mb-8 border border-[var(--border)]">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="badge"
                    style={{
                      background: debateState.phase === 'complete'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : debateState.phase === 'synthesizing'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(139, 92, 246, 0.1)',
                      color: debateState.phase === 'complete'
                        ? 'var(--accent-green)'
                        : debateState.phase === 'synthesizing'
                        ? 'var(--accent-yellow)'
                        : 'var(--accent-purple)',
                    }}
                  >
                    {debateState.phase === 'debating' && (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Round {debateState.currentRound}/{debateState.totalRounds}</>
                    )}
                    {debateState.phase === 'synthesizing' && (
                      <><Brain className="w-3 h-3 animate-pulse" /> Synthesizing</>
                    )}
                    {debateState.phase === 'complete' && (
                      <><CheckCircle2 className="w-3 h-3" /> Complete</>
                    )}
                  </span>
                  {debateState.phase === 'debating' && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {agents[debateState.currentAgentIndex]?.name} speaking
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-snug">
                  {debateState.topic}
                </h2>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Tokens</p>
                  <p className="font-mono text-lg sm:text-xl font-bold gradient-text-green">
                    {debateState.tokensUsed.toLocaleString()}
                  </p>
                </div>

                {debateState.phase === 'complete' && (
                  <button
                    onClick={resetDebate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-subtle text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Debate
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[3px] rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="progress-bar h-full" style={{ width: `${getProgress()}%` }} />
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="space-y-5 mb-8">
            {debateState.messages.map((message, index) => {
              const isSynthesis = message.agentId === 'synthesizer';
              const color = agentColorMap[message.agentName] || 'var(--accent-blue)';

              return (
                <div
                  key={message.id || index}
                  className="message-card glass rounded-xl p-5 sm:p-6 border"
                  style={{
                    '--msg-color': isSynthesis ? 'var(--accent-yellow)' : color,
                    borderColor: isSynthesis ? 'rgba(234, 179, 8, 0.2)' : `${color}20`,
                    animationDelay: `${index * 80}ms`,
                  } as React.CSSProperties}
                >
                  <div className="flex items-start gap-4">
                    {/* Agent avatar */}
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: isSynthesis
                          ? 'rgba(234, 179, 8, 0.12)'
                          : `${color}12`,
                        border: `1px solid ${
                          isSynthesis ? 'rgba(234, 179, 8, 0.25)' : `${color}25`
                        }`,
                      }}
                    >
                      {message.agentAvatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: isSynthesis ? 'var(--accent-yellow)' : color }}>
                          {message.agentName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[10px] text-[var(--text-muted)] border border-[var(--border)]">
                          {message.agentRole}
                        </span>
                        {!isSynthesis && (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            Round {message.round}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Loading: Debating ── */}
            {debateState.phase === 'debating' && (
              <div className="glass rounded-xl p-5 sm:p-6 border border-[var(--border)] animate-fade-in">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl animate-pulse"
                    style={{
                      background: `${agents[debateState.currentAgentIndex]?.color}12`,
                      border: `1px solid ${agents[debateState.currentAgentIndex]?.color}25`,
                    }}
                  >
                    {agents[debateState.currentAgentIndex]?.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: agents[debateState.currentAgentIndex]?.color }}>
                      {agents[debateState.currentAgentIndex]?.name} is thinking
                    </p>
                    <div className="flex gap-1.5 mt-2.5">
                      <div className="typing-dot" style={{ background: agents[debateState.currentAgentIndex]?.color }} />
                      <div className="typing-dot" style={{ background: agents[debateState.currentAgentIndex]?.color }} />
                      <div className="typing-dot" style={{ background: agents[debateState.currentAgentIndex]?.color }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Loading: Synthesizing ── */}
            {debateState.phase === 'synthesizing' && (
              <div className="glass rounded-xl p-5 sm:p-6 border animate-fade-in" style={{ borderColor: 'rgba(234, 179, 8, 0.25)' }}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl animate-pulse"
                    style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.25)' }}
                  >
                    {synthesizer.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: synthesizer.color }}>
                      {synthesizer.name} is synthesizing
                    </p>
                    <div className="flex gap-1.5 mt-2.5">
                      <div className="typing-dot" style={{ background: synthesizer.color }} />
                      <div className="typing-dot" style={{ background: synthesizer.color }} />
                      <div className="typing-dot" style={{ background: synthesizer.color }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Completion Stats ── */}
          {debateState.phase === 'complete' && debateState.startTime && debateState.endTime && (
            <div className="glass rounded-2xl p-6 sm:p-8 border border-[var(--border)] animate-slide-up">
              <div className="flex items-center gap-2 mb-7">
                <BarChart3 className="w-4 h-4 text-[var(--accent-purple)]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Debate Statistics</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { value: debateState.messages.length, label: 'Arguments', color: 'var(--accent-blue)', icon: MessageSquare },
                  { value: debateState.totalRounds, label: 'Rounds', color: 'var(--accent-purple)', icon: Layers },
                  { value: formatTime(debateState.endTime - debateState.startTime), label: 'Duration', color: 'var(--accent-green)', icon: Clock },
                  { value: `${(debateState.tokensUsed / 1000).toFixed(1)}k`, label: 'Total Tokens', color: 'var(--accent-yellow)', icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="stat-card glass-subtle rounded-xl p-5 text-center border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ background: `${stat.color}12` }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {tokenBreakdown.total > 0 && (
                <>
                  <div className="divider my-4" />
                  <div className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Token Breakdown</span>
                      <div className="flex flex-wrap gap-4">
                        <span className="text-xs text-[var(--text-secondary)]">
                          Prompt: <span className="text-[var(--accent-blue)] font-mono font-semibold">{tokenBreakdown.prompt.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          Completion: <span className="text-[var(--accent-green)] font-mono font-semibold">{tokenBreakdown.completion.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          Total: <span className="text-[var(--accent-yellow)] font-mono font-bold">{tokenBreakdown.total.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] mt-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Debate Arena</div>
                <div className="text-[10px] text-[var(--text-muted)]">Multi-Agent AI Debate Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="https://platform.xiaomimimo.com" target="_blank" rel="noopener noreferrer" className="footer-link text-[var(--text-secondary)] hover:text-[var(--accent-purple)]">MiMo API</a>
              <a href="https://github.com/farhezam/debate-arena" target="_blank" rel="noopener noreferrer" className="footer-link text-[var(--text-secondary)] hover:text-[var(--accent-purple)]">GitHub</a>
              <span className="text-[var(--text-muted)]">·</span>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
