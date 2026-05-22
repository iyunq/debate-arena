'use client';

import { useState, useRef, useEffect } from 'react';
import { agents, synthesizer, debateTopics, DebateMessage, DebateState } from '@/lib/agents';
import { config, getApiKey, setApiKey } from '@/lib/config';
import {
  Layers, Settings, X, Zap, ArrowRight, Clock,
  MessageSquare, Hash, Trophy, Flame, Send, Loader2,
  BarChart3
} from 'lucide-react';

const agentColorMap: Record<string, string> = {
  Optimist: 'var(--accent-green)',
  Skeptic: 'var(--accent-orange)',
  Analyst: 'var(--accent-blue)',
  Contrarian: 'var(--accent-purple)',
  Synthesizer: 'var(--accent-yellow)',
};

const stats = [
  { label: 'Agents Active', value: '4', icon: Layers },
  { label: 'Debate Rounds', value: '3', icon: MessageSquare },
  { label: 'Tokens Used', value: '0', icon: Zap, dynamic: true },
  { label: 'MiMo Model', value: 'V2.5', icon: BarChart3 },
];

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: 'rgba(6, 6, 10, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)]">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)]">Debate Arena</h1>
              <p className="text-[10px] text-[var(--text-muted)]">Powered by MiMo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {apiKey && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs text-[var(--text-secondary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
                <span>API Connected</span>
              </div>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="modal-content animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Configure your API key</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">MiMo API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-purple)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Get your key from{' '}
                <a href="https://platform.xiaomimimo.com" target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-blue)]">
                  platform.xiaomimimo.com
                </a>
              </p>
              <button onClick={handleSaveApiKey} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IDLE STATE */}
      {debateState.phase === 'idle' && (
        <div>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-blue)] rounded-full blur-[128px] opacity-10" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[128px] opacity-10" />
            <div className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-[var(--accent-purple)] mb-8">
                <Zap className="w-3 h-3" />
                <span>Multi-Agent AI Debate System</span>
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                AI Debate
                <br />
                <span className="gradient-text">Arena</span>
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
                Watch 4 AI agents debate from different perspectives, then see MiMo
                synthesize all arguments into a balanced conclusion.
              </p>
            </div>
          </section>

          {/* Stats */}
          <section className="max-w-5xl mx-auto px-8 mb-20">
            <div className="grid grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-5 text-center card-hover">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-[var(--accent-purple)]" />
                  <div className="text-2xl font-bold gradient-text mb-1">
                    {stat.dynamic ? debateState.tokensUsed.toLocaleString() : stat.value}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Agent Cards */}
          <section className="max-w-5xl mx-auto px-8 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">
                <span className="gradient-text">Meet the Agents</span>
              </h2>
              <p className="text-[var(--text-secondary)]">
                Each agent brings a unique perspective to the debate.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-[var(--accent-purple)] opacity-20 z-0" />
              {agents.map((agent, i) => {
                const color = agentColorMap[agent.name] || 'var(--accent-blue)';
                return (
                  <div key={agent.id} className="relative z-10 glass rounded-xl p-6 card-hover group text-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-4 mx-auto"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-3xl mb-3">{agent.avatar}</div>
                    <h3 className="text-lg font-bold mb-1" style={{ color }}>{agent.name}</h3>
                    <div className="text-xs font-medium mb-3" style={{ color }}>{agent.role}</div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{agent.personality}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Custom Topic Input */}
          <section className="max-w-5xl mx-auto px-8 mb-20">
            <div className="glass rounded-2xl p-8 gradient-border">
              <h2 className="text-2xl font-bold mb-2">Start a Debate</h2>
              <p className="text-[var(--text-secondary)] mb-6">Enter any topic and watch the agents argue it out.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter any topic for debate..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-purple)] transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && customTopic && startDebate(customTopic)}
                />
                <button
                  onClick={() => customTopic && startDebate(customTopic)}
                  disabled={!customTopic || isStarting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Debate
                </button>
              </div>
            </div>
          </section>

          {/* Suggested Topics */}
          <section className="max-w-5xl mx-auto px-8 mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Suggested Topics</h2>
              <p className="text-sm text-[var(--text-secondary)]">Pick a topic to start instantly</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {debateTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startDebate(topic.title + ': ' + topic.description)}
                  className="glass rounded-xl p-5 text-left card-hover group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--accent-purple)] text-[10px] font-medium">
                      {topic.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-purple)] transition-colors" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2 text-[var(--text-primary)]">{topic.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{topic.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="max-w-5xl mx-auto px-8 mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Built With</h2>
              <p className="text-sm text-[var(--text-secondary)]">Powered by Xiaomi MiMo Reasoning Engine</p>
            </div>
            <div className="flex justify-center gap-6 flex-wrap">
              {['Next.js 16', 'TypeScript', 'Tailwind CSS', 'MiMo API', 'Vercel'].map((t) => (
                <div key={t} className="px-4 py-2 glass rounded-lg text-xs text-[var(--text-secondary)]">
                  {t}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* DEBATE STATE */}
      {debateState.phase !== 'idle' && (
        <main className="max-w-5xl mx-auto px-8 py-12">
          {/* Debate Header */}
          <div className="glass rounded-xl p-6 mb-8">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: debateState.phase === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      color: debateState.phase === 'complete' ? 'var(--accent-green)' : 'var(--accent-purple)',
                    }}
                  >
                    {debateState.phase === 'debating' && `Round ${debateState.currentRound}/${debateState.totalRounds}`}
                    {debateState.phase === 'synthesizing' && 'Synthesizing'}
                    {debateState.phase === 'complete' && 'Complete'}
                  </span>
                  {debateState.phase === 'debating' && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {agents[debateState.currentAgentIndex]?.name} speaking
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{debateState.topic}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Tokens</p>
                  <p className="font-mono text-lg font-semibold text-[var(--accent-yellow)]">
                    {debateState.tokensUsed.toLocaleString()}
                  </p>
                </div>
                {debateState.phase === 'complete' && (
                  <button onClick={resetDebate} className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--border-hover)] transition-all">
                    New Debate
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)]">
              <div className="h-full rounded-full progress-bar" style={{ width: `${getProgress()}%` }} />
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 mb-8">
            {debateState.messages.map((message, index) => {
              const isSynthesis = message.agentId === 'synthesizer';
              const color = agentColorMap[message.agentName] || 'var(--accent-blue)';

              return (
                <div
                  key={message.id || index}
                  className="glass rounded-xl p-5 card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      {message.agentAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold text-sm" style={{ color }}>{message.agentName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[10px] text-[var(--text-muted)]">
                          {message.agentRole}
                        </span>
                        {!isSynthesis && (
                          <span className="text-xs text-[var(--text-muted)]">R{message.round}</span>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading: Debating */}
            {debateState.phase === 'debating' && (
              <div className="glass rounded-xl p-5 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl animate-pulse"
                    style={{ background: `${agents[debateState.currentAgentIndex]?.color}15`, border: `1px solid ${agents[debateState.currentAgentIndex]?.color}30` }}
                  >
                    {agents[debateState.currentAgentIndex]?.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: agents[debateState.currentAgentIndex]?.color }}>
                      {agents[debateState.currentAgentIndex]?.name} is thinking...
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading: Synthesizing */}
            {debateState.phase === 'synthesizing' && (
              <div className="glass rounded-xl p-5 animate-fade-in" style={{ borderColor: 'var(--accent-yellow)' }}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl animate-pulse"
                    style={{ background: `${synthesizer.color}15`, border: `1px solid ${synthesizer.color}30` }}
                  >
                    {synthesizer.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: synthesizer.color }}>
                      {synthesizer.name} is synthesizing...
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Completion Stats */}
          {debateState.phase === 'complete' && debateState.startTime && debateState.endTime && (
            <div className="glass rounded-xl p-6 animate-fade-in-up">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-6">Debate Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: debateState.messages.length, label: 'Arguments', color: 'var(--accent-blue)' },
                  { value: debateState.totalRounds, label: 'Rounds', color: 'var(--accent-purple)' },
                  { value: `${Math.round((debateState.endTime - debateState.startTime) / 1000)}s`, label: 'Duration', color: 'var(--accent-green)' },
                  { value: `${(debateState.tokensUsed / 1000).toFixed(1)}k`, label: 'Total Tokens', color: 'var(--accent-yellow)' },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-xl p-5 text-center">
                    <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>
              {tokenBreakdown.total > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Token Breakdown</span>
                    <div className="flex gap-6">
                      <span className="text-[var(--text-secondary)]">Prompt: <span className="text-[var(--accent-blue)] font-mono">{tokenBreakdown.prompt.toLocaleString()}</span></span>
                      <span className="text-[var(--text-secondary)]">Completion: <span className="text-[var(--accent-green)] font-mono">{tokenBreakdown.completion.toLocaleString()}</span></span>
                      <span className="text-[var(--text-secondary)]">Total: <span className="text-[var(--accent-yellow)] font-mono font-semibold">{tokenBreakdown.total.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-20">
        <div className="max-w-5xl mx-auto px-8 flex justify-between items-center text-xs text-[var(--text-secondary)]">
          <span>Debate Arena — Multi-Agent AI Debate Platform</span>
          <span>Built for MiMo 100T Program</span>
        </div>
      </footer>
    </div>
  );
}
