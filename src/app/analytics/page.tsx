'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, TrendingUp, Clock, BarChart3, ArrowLeft,
  Calendar, MessageSquare, Brain, ChevronRight
} from 'lucide-react';

const mockSessions = [
  {
    id: 1,
    topic: 'AI and Employment',
    date: '2026-05-22',
    duration: '12m 30s',
    rounds: 8,
    tokensUsed: 285000,
    promptTokens: 125000,
    completionTokens: 160000,
    cost: 0.6050,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 2,
    topic: 'Remote Work Future',
    date: '2026-05-22',
    duration: '10m 45s',
    rounds: 8,
    tokensUsed: 242000,
    promptTokens: 108000,
    completionTokens: 134000,
    cost: 0.5100,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 3,
    topic: 'Social Media Impact',
    date: '2026-05-21',
    duration: '14m 20s',
    rounds: 8,
    tokensUsed: 318000,
    promptTokens: 142000,
    completionTokens: 176000,
    cost: 0.6700,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 4,
    topic: 'Cryptocurrency Future',
    date: '2026-05-21',
    duration: '11m 55s',
    rounds: 8,
    tokensUsed: 275000,
    promptTokens: 120000,
    completionTokens: 155000,
    cost: 0.5850,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 5,
    topic: 'Climate Action',
    date: '2026-05-20',
    duration: '10m 10s',
    rounds: 8,
    tokensUsed: 235000,
    promptTokens: 105000,
    completionTokens: 130000,
    cost: 0.4950,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
];

const totalStats = {
  totalSessions: 5,
  totalTokens: mockSessions.reduce((sum, s) => sum + s.tokensUsed, 0),
  totalCost: mockSessions.reduce((sum, s) => sum + s.cost, 0),
  avgTokensPerSession: Math.round(mockSessions.reduce((sum, s) => sum + s.tokensUsed, 0) / mockSessions.length),
  totalPromptTokens: mockSessions.reduce((sum, s) => sum + s.promptTokens, 0),
  totalCompletionTokens: mockSessions.reduce((sum, s) => sum + s.completionTokens, 0),
};

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen noise-bg">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: 'rgba(6, 6, 10, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                <BarChart3 className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium">Analytics</span>
            </div>
          </Link>
          <div className="text-xs text-[var(--text-muted)]">Token Usage Dashboard</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Stats — compact */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <MessageSquare className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalStats.totalSessions}</div>
          </div>
          <div className="glass rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Zap className="w-3 h-3 text-purple-400" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Tokens</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalStats.totalTokens.toLocaleString()}</div>
          </div>
          <div className="glass rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
                <TrendingUp className="w-3 h-3 text-orange-400" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg / Session</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalStats.avgTokensPerSession.toLocaleString()}</div>
          </div>
        </div>

        {/* Token Distribution */}
        <div className="glass rounded-xl p-5 border border-[var(--border)] mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            Token Distribution
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[var(--text-secondary)]">Prompt</span>
                <span className="text-xs font-mono text-blue-400">{totalStats.totalPromptTokens.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${(totalStats.totalPromptTokens / totalStats.totalTokens) * 100}%` }} />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                {((totalStats.totalPromptTokens / totalStats.totalTokens) * 100).toFixed(1)}% of total
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[var(--text-secondary)]">Completion</span>
                <span className="text-xs font-mono text-purple-400">{totalStats.totalCompletionTokens.toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${(totalStats.totalCompletionTokens / totalStats.totalTokens) * 100}%` }} />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                {((totalStats.totalCompletionTokens / totalStats.totalTokens) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div className="glass rounded-xl p-5 border border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Session History
          </h2>
          <div className="space-y-2">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">
                      {session.topic}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {session.rounds} rounds
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0 ml-2" />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-white/5">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-0.5">Tokens</div>
                    <div className="font-mono text-xs font-semibold text-purple-400">
                      {session.tokensUsed.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-0.5">Cost</div>
                    <div className="font-mono text-xs font-semibold text-green-400">
                      ${session.cost.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-0.5">P / C</div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                      {session.promptTokens.toLocaleString()} / {session.completionTokens.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
