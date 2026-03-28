import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GITHUB_OWNER = 'iaashishjindal';
const GITHUB_REPO = 'ocoperator';
const GITHUB_API = 'https://api.github.com';

// Fetch a file from GitHub and return its content + sha
async function ghGet(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { content, sha: json.sha };
}

// Create or update a file on GitHub
async function ghPut(path: string, content: string, message: string, sha: string | undefined, token: string) {
  const body: any = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT ${path} failed: ${res.status} — ${err}`);
  }
  return res.json();
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    // Verify webhook secret
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('x-webhook-secret');
      if (authHeader !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('GITHUB_TOKEN not configured');

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

    // Step 1: Read current experiments.ts to find the next experiment number
    const { content: expTsContent, sha: expTsSha } = await ghGet('lib/experiments.ts', githubToken);
    const slugMatches = expTsContent.match(/'experiment-(\d+)'/g) || [];
    const maxNum = slugMatches.reduce((max: number, s: string) => {
      const n = parseInt(s.match(/\d+/)?.[0] || '0');
      return Math.max(max, n);
    }, 0);
    const nextNum = maxNum + 1;
    const slug = `experiment-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // Step 2: Generate MDX content with Gemini
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = `You are writing a post for "OC Operator" — an honest, casual AI experiments lab notebook at ocoperator.com.

The author dictated this over WhatsApp:
---
${message}
---

Write a complete blog post for experiment #${nextNum} in this exact MDX format. Match the casual, honest, slightly self-deprecating tone. Show the mess. Don't make it sound polished or corporate.

The MDX file must start with this metadata export, then the sections:

export const metadata = {
  number: ${nextNum},
  slug: '${slug}',
  title: 'GENERATE A GOOD TITLE',
  date: '${today}',
  summary: 'ONE SENTENCE SUMMARY — honest and specific, not marketing-speak',
  tags: ['tag1', 'tag2', 'tag3'],
  bill: {
    models: [
      { name: 'claude-sonnet-4-6', tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    ],
    total_cost_usd: 0,
    duration_mins: 0,
    notes: 'Bill to be updated.',
  },
}

## The Problem

[What they were trying to do and why]

## The Plan

[What approach was taken]

## What Went Wrong (Human Side)

[Human mistakes, wrong assumptions, things they had to figure out themselves]

## The AI's Take

[Where the AI struggled, got things wrong, or was unhelpful — be honest]

## How We Fixed It

[Bullet list of each problem and its fix]

## The Outcome

[What actually shipped, how well it works]

Write the full MDX. Only output the raw MDX — no code fences, no explanation, just the file content starting with "export const metadata".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'text/plain' },
    });

    if (!response.text) throw new Error('Gemini returned empty response');

    // Strip any accidental markdown fences
    let mdxContent = response.text.trim();
    if (mdxContent.startsWith('```')) {
      mdxContent = mdxContent.replace(/^```[^\n]*\n/, '').replace(/```$/, '').trim();
    }

    // Step 3: Commit the new MDX file
    const mdxPath = `content/experiments/${slug}.mdx`;
    await ghPut(mdxPath, mdxContent, `Add Experiment #${String(nextNum).padStart(3, '0')} via WhatsApp`, undefined, githubToken);

    // Step 4: Update lib/experiments.ts to add the new slug
    const updatedExpTs = expTsContent.replace(
      /export const EXPERIMENT_SLUGS = \[([^\]]*)\] as const/,
      (_, inner) => {
        const trimmed = inner.trimEnd();
        const newInner = trimmed.endsWith(',')
          ? `${trimmed}\n  '${slug}',`
          : `${trimmed},\n  '${slug}',`;
        return `export const EXPERIMENT_SLUGS = [${newInner}\n] as const`;
      }
    );
    await ghPut('lib/experiments.ts', updatedExpTs, `Register ${slug} in EXPERIMENT_SLUGS`, expTsSha, githubToken);

    const durationMs = Date.now() - startTime;
    const postUrl = `https://ocoperator.com/experiments/${slug}`;

    return NextResponse.json({
      ok: true,
      slug,
      url: postUrl,
      number: nextNum,
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error('[whatsapp/blog] Error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error', durationMs }, { status: 500 });
  }
}
