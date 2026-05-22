'use client';

import { useState, useRef, useEffect } from 'react';
import { agents, synthesizer, debateTopics, DebateMessage, DebateState } from '@/lib/agents';
import { config, getApiKey, setApiKey } from '@/lib/config';

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
            body: JSON.stringify({
              topic,
              apiKey,
              messages: currentMessages,
              currentRound: round,
              currentAgentIndex: agentIdx,
              phase: 'debating',
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate response');
          }

          const message = await response.json();
          currentMessages = [...currentMessages, message];

          setDebateState(prev => ({
            ...prev,
            messages: [...currentMessages],
            currentRound: round,
            currentAgentIndex: agentIdx,
            tokensUsed: prev.tokensUsed + estimateTokens(message.content),
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
        body: JSON.stringify({
          topic,
          apiKey,
          messages: currentMessages,
          phase: 'synthesizing',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate synthesis');
      }

      const synthesis = await response.json();
      currentMessages = [...currentMessages, synthesis];

      setDebateState(prev => ({
        ...prev,
        messages: [...currentMessages],
        phase: 'complete',
        tokensUsed: prev.tokensUsed + estimateTokens(synthesis.content),
        endTime: Date.now(),
      }));
    } catch (error: any) {
      console.error('Synthesis error:', error);
      alert(`Error: ${error.message}`);
    }

    setIsStarting(false);
  };

  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const resetDebate = () => {
    setDebateState({
      topic: '',
      messages: [],
      currentRound: 1,
      totalRounds: config.debate.totalRounds,
      currentAgentIndex: 0,
      phase: 'idle',
      tokensUsed: 0,
    });
    setSelectedTopic('');
  };

  const getProgress = () => {
    if (debateState.phase === 'complete') return 100;
    if (debateState.phase === 'synthesizing') return 95;
    return ((debateState.currentRound - 1) * agents.length + debateState.currentAgentIndex + 1) / (debateState.totalRounds * agents.length) * 100;
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="header">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Debate Arena</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by MiMo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {apiKey && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-green)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>API Connected</span>
                </div>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 rounded-xl transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="modal-content animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="p-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure your API key</p>
                </div>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>MiMo API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-..."
                  className="input"
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Get your key from{' '}
                <a href="https://platform.xiaomimimo.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>
                  platform.xiaomimimo.com
                </a>
              </p>
              <button
                onClick={handleSaveApiKey}
                className="btn-primary w-full"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Idle State - Topic Selection */}
        {debateState.phase === 'idle' && (
          <div className="space-y-16 animate-fade-in-up">
            {/* Hero Section */}
            <div className="hero-bg text-center py-16 relative">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Multi-Agent AI System</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="gradient-text">AI Debate</span>
                  <br />
                  <span style={{ color: 'var(--text-primary)' }}>Arena</span>
                </h2>
                <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Watch 4 AI agents debate from different perspectives, then see MiMo synthesize all arguments into a balanced conclusion.
                </p>
              </div>
            </div>

            {/* Agent Cards */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ background: 'var(--accent-purple)' }} />
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Meet the Agents</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {agents.map((agent, index) => (
                  <div 
                    key={agent.id} 
                    className="card p-5 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-3xl mb-3">{agent.avatar}</div>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: agent.color }}>{agent.name}</h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.role}</p>
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{agent.personality}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Topic */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 rounded-full" style={{ background: 'var(--accent-blue)' }} />
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Start a Debate</h3>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter any topic for debate..."
                  className="input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && customTopic && startDebate(customTopic)}
                />
                <button
                  onClick={() => customTopic && startDebate(customTopic)}
                  disabled={!customTopic || isStarting}
                  className="btn-primary"
                >
                  {isStarting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      Starting...
                    </span>
                  ) : 'Debate'}
                </button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Suggested Topics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {debateTopics.map((topic, index) => (
                  <button
                    key={topic.id}
                    onClick={() => startDebate(topic.title + ': ' + topic.description)}
                    className="topic-card text-left animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-purple)' }}>
                        {topic.category}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{topic.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Debate State */}
        {debateState.phase !== 'idle' && (
          <div className="space-y-8">
            {/* Debate Header */}
            <div className="card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge" style={{ 
                      background: debateState.phase === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
                      color: debateState.phase === 'complete' ? 'var(--accent-green)' : 'var(--accent-purple)' 
                    }}>
                      {debateState.phase === 'debating' && `Round ${debateState.currentRound}/${debateState.totalRounds}`}
                      {debateState.phase === 'synthesizing' && 'Synthesizing'}
                      {debateState.phase === 'complete' && 'Complete'}
                    </span>
                    {debateState.phase === 'debating' && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {agents[debateState.currentAgentIndex]?.name} speaking
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{debateState.topic}</h2>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Tokens</p>
                    <p className="font-mono text-lg font-semibold" style={{ color: 'var(--accent-yellow)' }}>
                      {debateState.tokensUsed.toLocaleString()}
                    </p>
                  </div>
                  {debateState.phase === 'complete' && (
                    <button onClick={resetDebate} className="btn-secondary">
                      New Debate
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full rounded-full progress-bar"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>

            {/* Debate Messages */}
            <div className="space-y-4">
              {debateState.messages.map((message, index) => {
                const isSynthesis = message.agentId === 'synthesizer';

                return (
                  <div
                    key={message.id || index}
                    className="debate-message p-5 animate-fade-in-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="agent-avatar"
                        style={{ 
                          background: `${message.agentColor}15`, 
                          border: `1px solid ${message.agentColor}30` 
                        }}
                      >
                        {message.agentAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-semibold text-sm" style={{ color: message.agentColor }}>
                            {message.agentName}
                          </span>
                          <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                            {message.agentRole}
                          </span>
                          {!isSynthesis && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              R{message.round}
                            </span>
                          )}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading States */}
              {debateState.phase === 'debating' && (
                <div className="card p-5 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div
                      className="agent-avatar animate-pulse"
                      style={{ 
                        background: `${agents[debateState.currentAgentIndex]?.color}15`, 
                        border: `1px solid ${agents[debateState.currentAgentIndex]?.color}30` 
                      }}
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

              {debateState.phase === 'synthesizing' && (
                <div className="card p-5 animate-fade-in" style={{ borderColor: 'var(--accent-yellow)' }}>
                  <div className="flex items-center gap-4">
                    <div
                      className="agent-avatar animate-pulse"
                      style={{ 
                        background: `${synthesizer.color}15`, 
                        border: `1px solid ${synthesizer.color}30` 
                      }}
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
              <div className="card p-6 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--accent-green)' }} />
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Debate Statistics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card">
                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-blue)' }}>{debateState.messages.length}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Arguments</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-purple)' }}>{debateState.totalRounds}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rounds</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
                      {Math.round((debateState.endTime - debateState.startTime) / 1000)}s
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Duration</p>
                  </div>
                  <div className="stat-card">
                    <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-yellow)' }}>
                      {(debateState.tokensUsed / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tokens</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-purple)' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Debate Arena</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Built for MiMo 100T Program
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
