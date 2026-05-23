'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, TrendingUp, Clock, BarChart3, ArrowLeft,
  Calendar, DollarSign, Activity, Layers, MessageSquare,
  Brain, Target, Sparkles, Award, ChevronRight
} from 'lucide-react';

// Mock data untuk demo — token usage lebih tinggi
const mockSessions = [
  {
    id: 1,
    topic: 'AI and Employment',
    date: '2026-05-22',
    duration: '6m 15s',
    rounds: 4,
    tokensUsed: 42500,
    promptTokens: 18500,
    completionTokens: 24000,
    cost: 0.2125,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 2,
    topic: 'Remote Work Future',
    date: '2026-05-22',
    duration: '5m 42s',
    rounds: 4,
    tokensUsed: 38750,
    promptTokens: 16800,
    completionTokens: 21950,
    cost: 0.1938,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 3,
    topic: 'Social Media Impact',
    date: '2026-05-21',
    duration: '7m 08s',
    rounds: 4,
    tokensUsed: 52300,
    promptTokens: 22600,
    completionTokens: 29700,
    cost: 0.2615,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 4,
    topic: 'Cryptocurrency Future',
    date: '2026-05-21',
    duration: '6m 33s',
    rounds: 4,
    tokensUsed: 45800,
    promptTokens: 19800,
    completionTokens: 26000,
    cost: 0.2290,
    agents: ['Dr. Aurora', 'Prof. Shadow', 'Dr. Logic', 'Ms. Paradox'],
  },
  {
    id: 5,
    topic: 'Climate Action',
    date: '2026-05-20',
    duration: '5m 55s',
    rounds: 4,
    tokensUsed: 41200,
    promptTokens: 17900,
    completionTokens: 23300,
    cost: 0.2060,
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-blue-400" />
              <div>
                <div className="font-bold text-lg">Debate Arena</div>
                <div className="text-xs text-white/40">Multi-Agent AI System</div>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              Analytics Dashboard
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Activity className="w-3 h-3" />
            TOKEN ANALYTICS
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Usage <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Analytics</span>
          </h1>
          <p className="text-white/60 text-lg">
            Comprehensive token usage metrics and cost analysis powered by MiMo API
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{totalStats.totalSessions}</div>
            <div className="text-sm text-white/50">Total Sessions</div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{totalStats.totalTokens.toLocaleString()}</div>
            <div className="text-sm text-white/50">Total Tokens</div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold mb-1">${totalStats.totalCost.toFixed(4)}</div>
            <div className="text-sm text-white/50">Total Cost</div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-1">{totalStats.avgTokensPerSession.toLocaleString()}</div>
            <div className="text-sm text-white/50">Avg Tokens/Session</div>
          </div>
        </div>

        {/* Token Breakdown */}
        <div className="glass rounded-2xl p-8 border border-white/5 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Token Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Prompt Tokens</span>
                <span className="text-sm font-mono text-blue-400">{totalStats.totalPromptTokens.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  style={{ width: `${(totalStats.totalPromptTokens / totalStats.totalTokens) * 100}%` }}
                />
              </div>
              <div className="text-xs text-white/40 mt-1">
                {((totalStats.totalPromptTokens / totalStats.totalTokens) * 100).toFixed(1)}% of total
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Completion Tokens</span>
                <span className="text-sm font-mono text-purple-400">{totalStats.totalCompletionTokens.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                  style={{ width: `${(totalStats.totalCompletionTokens / totalStats.totalTokens) * 100}%` }}
                />
              </div>
              <div className="text-xs text-white/40 mt-1">
                {((totalStats.totalCompletionTokens / totalStats.totalTokens) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div className="glass rounded-2xl p-8 border border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Session History
          </h2>
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                      {session.topic}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
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
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Tokens Used</div>
                    <div className="font-mono text-sm font-semibold text-purple-400">
                      {session.tokensUsed.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">Cost</div>
                    <div className="font-mono text-sm font-semibold text-green-400">
                      ${session.cost.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">Breakdown</div>
                    <div className="text-xs text-white/60">
                      {session.promptTokens.toLocaleString()} / {session.completionTokens.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
          <p className="text-sm text-blue-400/80">
            💡 All metrics are calculated based on MiMo API usage. Token costs may vary based on your plan.
          </p>
        </div>
      </div>
    </div>
  );
}
