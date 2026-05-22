import { NextRequest, NextResponse } from 'next/server';
import { agents, synthesizer } from '@/lib/agents';
import { config } from '@/lib/config';

export const maxDuration = 30;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callMiMo(
  messages: Message[],
  apiKey: string,
  maxTokens: number = config.mimo.maxTokens
): Promise<string> {
  const response = await fetch(`${config.mimo.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.mimo.model,
      messages,
      max_tokens: maxTokens,
      temperature: config.mimo.temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiMo API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}

export async function POST(request: NextRequest) {
  try {
    const { topic, apiKey, messages: existingMessages, currentRound, currentAgentIndex, phase } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // If this is a synthesis request
    if (phase === 'synthesizing') {
      const debateContext = existingMessages
        .map((m: any) => `[${m.agentName} - Round ${m.round}]: ${m.content}`)
        .join('\n\n');

      const synthesisMessages: Message[] = [
        { role: 'system', content: synthesizer.prompt },
        {
          role: 'user',
          content: `Topic: "${topic}"\n\nDebate Arguments:\n${debateContext}\n\nPlease synthesize all arguments and provide a comprehensive conclusion.`
        }
      ];

      const synthesis = await callMiMo(synthesisMessages, apiKey, config.debate.maxTokensSynthesis);

      return NextResponse.json({
        agentId: 'synthesizer',
        agentName: synthesizer.name,
        agentRole: synthesizer.role,
        agentAvatar: synthesizer.avatar,
        agentColor: synthesizer.color,
        content: synthesis,
        round: 0,
        timestamp: Date.now(),
      });
    }

    // Regular debate round
    const agent = agents[currentAgentIndex];
    if (!agent) {
      return NextResponse.json({ error: 'Invalid agent index' }, { status: 400 });
    }

    // Build context from previous messages
    const previousContext = existingMessages
      .filter((m: any) => m.round === currentRound)
      .map((m: any) => `[${m.agentName}]: ${m.content}`)
      .join('\n\n');

    const previousRoundsContext = existingMessages
      .filter((m: any) => m.round < currentRound)
      .map((m: any) => `[${m.agentName} - Round ${m.round}]: ${m.content}`)
      .join('\n\n');

    const debateMessages: Message[] = [
      { role: 'system', content: agent.prompt },
      {
        role: 'user',
        content: `Topic: "${topic}"\nRound: ${currentRound} of ${config.debate.totalRounds}\n\n${previousRoundsContext ? `Previous Rounds:\n${previousRoundsContext}\n\n` : ''}${previousContext ? `Arguments in this round so far:\n${previousContext}\n\n` : ''}Please present your ${agent.role} perspective on this topic. Be concise but thorough (200-400 words).`
      }
    ];

    const content = await callMiMo(debateMessages, apiKey, config.debate.maxTokensPerAgent);

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      agentAvatar: agent.avatar,
      agentColor: agent.color,
      content,
      round: currentRound,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Debate API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
