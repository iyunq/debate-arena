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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

    // Start debate loop
    await runDebate(topic);
  };

  const runDebate = async (topic: string) => {
    let currentMessages: DebateMessage[] = [];
    let currentRound = 1;
    let currentAgentIndex = 0;

    // Run all rounds
    for (let round = 1; round <= config.debate.totalRounds; round++) {
      // Run all agents in each round
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

          // Small delay between agents for visual effect
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error('Debate error:', error);
          alert(`Error: ${error.message}`);
          setIsStarting(false);
          return;
        }
      }
    }

    // Synthesis phase
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                <span className="text-xl">⚔️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">MiMo Debate Arena</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Multi-Agent AI Debate Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>MiMo API</span>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg transition-colors"
                style={{ background: showSettings ? 'var(--accent-purple)' : 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-primary)' }}>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="glass rounded-2xl p-6 max-w-md w-full" style={{ border: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>API Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>MiMo API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="Enter your MiMo API key"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Get your API key from{' '}
                <a href="https://platform.xiaomimimo.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>
                  platform.xiaomimimo.com
                </a>
              </p>
              <button
                onClick={handleSaveApiKey}
                className="w-full py-3 rounded-xl font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white' }}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Idle State - Topic Selection */}
        {debateState.phase === 'idle' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-12">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">AI Debate Arena</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Watch 4 AI agents debate from different perspectives — Optimist, Skeptic, Analyst, and Contrarian — then see MiMo synthesize all arguments
              </p>
            </div>

            {/* Agent Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="glass rounded-xl p-4 text-center card-hover" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="text-3xl mb-2">{agent.avatar}</div>
                  <h3 className="font-semibold text-sm" style={{ color: agent.color }}>{agent.name}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{agent.role}</p>
                </div>
              ))}
            </div>

            {/* Custom Topic Input */}
            <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border-primary)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Start a Debate</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter any topic for debate..."
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                  onKeyDown={(e) => e.key === 'Enter' && customTopic && startDebate(customTopic)}
                />
                <button
                  onClick={() => customTopic && startDebate(customTopic)}
                  disabled={!customTopic || isStarting}
                  className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: 'white' }}
                >
                  {isStarting ? 'Starting...' : 'Debate!'}
                </button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Or choose a topic:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {debateTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => startDebate(topic.title + ': ' + topic.description)}
                    className="glass rounded-xl p-4 text-left card-hover transition-all"
                    style={{ border: '1px solid var(--border-primary)' }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-purple)' }}>
                        {topic.category}
                      </span>
                    </div>
                    <h4 className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{topic.title}</h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Debate State */}
        {debateState.phase !== 'idle' && (
          <div className="space-y-6">
            {/* Debate Header */}
            <div className="glass rounded-xl p-4" style={{ border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{debateState.topic}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      Round {debateState.currentRound} / {debateState.totalRounds}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {debateState.phase === 'debating' && `Agent: ${agents[debateState.currentAgentIndex]?.name}`}
                      {debateState.phase === 'synthesizing' && 'Synthesizing...'}
                      {debateState.phase === 'complete' && 'Debate Complete'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tokens Used</p>
                    <p className="font-mono text-sm font-semibold" style={{ color: 'var(--accent-yellow)' }}>
                      {debateState.tokensUsed.toLocaleString()}
                    </p>
                  </div>
                  {debateState.phase === 'complete' && (
                    <button
                      onClick={resetDebate}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      New Debate
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {debateState.phase === 'debating' && (
                <div className="mt-4">
                  <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{
                        width: `${((debateState.currentRound - 1) * agents.length + debateState.currentAgentIndex + 1) / (debateState.totalRounds * agents.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Debate Messages */}
            <div className="space-y-4">
              {debateState.messages.map((message, index) => {
                const isSynthesis = message.agentId === 'synthesizer';
                const agentClass = isSynthesis ? 'synthesizer' : agents.find(a => a.id === message.agentId)?.colorClass || '';

                return (
                  <div
                    key={message.id || index}
                    className={`debate-message ${agentClass} rounded-xl p-5 animate-fade-in-up`}
                    style={{
                      borderLeftColor: message.agentColor,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                        style={{ background: `${message.agentColor}20`, border: `1px solid ${message.agentColor}40` }}
                      >
                        {message.agentAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="font-semibold text-sm" style={{ color: message.agentColor }}>
                            {message.agentName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                            {message.agentRole}
                          </span>
                          {!isSynthesis && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Round {message.round}
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

              {/* Loading indicator */}
              {debateState.phase === 'debating' && (
                <div className="glass rounded-xl p-5" style={{ border: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse" style={{ background: `${agents[debateState.currentAgentIndex]?.color}20` }}>
                      <span className="text-xl">{agents[debateState.currentAgentIndex]?.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: agents[debateState.currentAgentIndex]?.color }}>
                        {agents[debateState.currentAgentIndex]?.name} is thinking...
                      </p>
                      <div className="flex gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: agents[debateState.currentAgentIndex]?.color, animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {debateState.phase === 'synthesizing' && (
                <div className="glass rounded-xl p-5" style={{ border: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse" style={{ background: `${synthesizer.color}20` }}>
                      <span className="text-xl">{synthesizer.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: synthesizer.color }}>
                        {synthesizer.name} is synthesizing all arguments...
                      </p>
                      <div className="flex gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: synthesizer.color, animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Completion Stats */}
            {debateState.phase === 'complete' && debateState.startTime && debateState.endTime && (
              <div className="glass rounded-xl p-6" style={{ border: '1px solid var(--border-primary)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Debate Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{debateState.messages.length}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total Arguments</p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>{debateState.totalRounds}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Rounds</p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
                      {Math.round((debateState.endTime - debateState.startTime) / 1000)}s
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Duration</p>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-yellow)' }}>
                      {debateState.tokensUsed.toLocaleString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tokens Used</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Powered by MiMo API • Multi-Agent Debate System • Built for MiMo 100T Program
          </p>
        </div>
      </footer>
    </div>
  );
}
