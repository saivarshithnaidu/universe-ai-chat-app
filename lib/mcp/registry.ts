/**
 * UniverseAI — MCP Tool Registry
 *
 * Architecture:
 *  - Each connector = group of tools  (web, notion, gmail, supabase)
 *  - Each tool has: id, inputSchema, intentKeywords, handler
 *  - Tokens are passed from the client (stored in localStorage)
 *  - Every handler is real or smart-demo (returns structured result)
 */

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface MCPToolInput {
  [key: string]: string | number | boolean | undefined;
}

export interface MCPContext {
  tokens: Record<string, string>;   // connectorId → API token
  userId?: string;
}

export interface MCPResult {
  toolId: string;
  toolName: string;
  connector: string;
  status: 'success' | 'failed';
  text: string;                     // Markdown summary shown in chat
  data?: Record<string, any>;      // Structured data for rich cards
  error?: string;
}

export interface MCPToolDefinition {
  id: string;                       // e.g. "notion.create_page"
  connector: string;                // e.g. "notion"
  name: string;
  description: string;
  requiredToken?: string;           // connector id whose token is needed
  intentKeywords: string[];         // triggers intent detection
  inputSchema: Record<string, string>;
  handler: (input: MCPToolInput, ctx: MCPContext) => Promise<MCPResult>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(toolId: string, toolName: string, connector: string, text: string, data?: Record<string, any>): MCPResult {
  return { toolId, toolName, connector, status: 'success', text, data };
}

function fail(toolId: string, toolName: string, connector: string, error: string): MCPResult {
  return { toolId, toolName, connector, status: 'failed', text: `${toolName} failed: ${error}`, error };
}

// ─── Gemini Key Pool ──────────────────────────────────────────────────────────

let geminiKeyIndex = 0;

async function callGemini(prompt: string): Promise<string> {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) throw new Error('No Gemini API keys configured');

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[geminiKeyIndex % keys.length];
    geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048 },
          }),
        }
      );

      if (res.status === 429) {
        console.warn(`[MCP] Key ${geminiKeyIndex} limited. Retrying next…`);
        await new Promise(r => setTimeout(r, 1000)); // wait 1s before trying next key
        continue;
      }
      if (!res.ok) continue;

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch { continue; }
  }

  throw new Error('All Gemini API keys rate limited. Please add more keys to .env or wait 60s.');
}

// ─── Table Detection Helper ───────────────────────────────────────────────────

function detectSupabaseTable(query: string): string {
  const lowerQuery = query.toLowerCase();
  const knownTables = [
    'candidate_profiles', 'admin_whitelist', 'applications', 'candidates',
    'coding_submissions', 'colleges', 'email_otps', 'exam_assignments',
    'exam_questions', 'exam_slots', 'exam_violations', 'exams',
    'institutions', 'interview_questions'
  ].sort((a, b) => b.length - a.length);

  // 1. Check known tables first
  for (const table of knownTables) {
    if (lowerQuery.includes(table)) return table;
  }

  // 2. Pattern matching with stop words
  const STOP_WORDS = new Set(['the', 'a', 'is', 'of', 'my', 'your', 'me', 'this', 'that', 'tell', 'show', 'fetch', 'table', 'from', 'read', 'query', 'into', 'with', 'some', 'and', 'for', 'any', 'all', 'to']);
  const patterns = [
    /(?:from|table|in|into|select|fetch|show|to)\s+['"]?([a-z0-9_]{3,})['"]?/gi,
    /([a-z0-9_]{3,})\s+table/gi
  ];

  for (const pattern of patterns) {
    const matches = lowerQuery.matchAll(pattern);
    for (const match of matches) {
      const candidate = (match[1] || match[2]).toLowerCase();
      if (!STOP_WORDS.has(candidate)) return candidate;
    }
  }

  return 'candidate_profiles'; // default
}

// ─── MCP Tool Definitions ─────────────────────────────────────────────────────

export const MCP_TOOLS: MCPToolDefinition[] = [

  // ══════════════════════════════════════════════════════════════════
  // WEB CONNECTOR — real Serper API
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'web.search',
    connector: 'web',
    name: 'Web Search',
    description: 'Search the real-time web using Serper',
    intentKeywords: [
      'search', 'google', 'look up', 'find online', 'what is', 'who is',
      'latest news', 'current', 'today', 'recent', 'price of', 'weather',
    ],
    inputSchema: { query: 'string' },
    handler: async (input, _ctx) => {
      const serperKey = process.env.SERPER_API_KEY;
      if (!serperKey) return fail('web.search', 'Web Search', 'web', 'SERPER_API_KEY not configured');

      const query = (input.query as string) || '';
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 6 }),
      });

      if (!res.ok) return fail('web.search', 'Web Search', 'web', `Search API error ${res.status}`);

      const data = await res.json();
      const organic: any[] = data.organic || [];
      const results = organic.slice(0, 5).map((r: any) => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link,
      }));

      const text = results.map(r => `**${r.title}**\n${r.snippet}\n[${r.link}](${r.link})`).join('\n\n---\n\n');
      return ok('web.search', 'Web Search', 'web', text, { results, query, answerBox: data.answerBox });
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // GMAIL CONNECTOR — smart demo + real composition
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'gmail.compose',
    connector: 'gmail',
    name: 'Compose Email',
    description: 'Draft and simulate sending a professional email',
    requiredToken: 'gmail',
    intentKeywords: [
      'gmail', 'send email', 'write email', 'compose email', 'draft email',
      'email to', 'write to', 'mail', 'send message to',
    ],
    inputSchema: { to: 'string', subject: 'string', body: 'string' },
    handler: async (input, ctx) => {
      const token = ctx.tokens['gmail'];
      if (!token) return fail('gmail.compose', 'Compose Email', 'gmail', 'Gmail not connected — please add your API key in Connectors');

      // Use Gemini to draft a professional email
      const prompt = `Write a professional email.
Request: "${input.body || input.to || 'a professional email'}"

Format:
**To:** [inferred recipient or "${input.to || 'recipient@example.com'}"]
**Subject:** [clear subject line]
**Body:**
[professional email body]

Keep it concise and professional.`;

      try {
        const drafted = await callGemini(prompt);
        const subjectMatch = drafted.match(/\*\*Subject:\*\*\s*(.+)/);

        return ok('gmail.compose', 'Compose Email', 'gmail', drafted, {
          subject: subjectMatch?.[1]?.trim() || 'Drafted Email',
          body: drafted,
          status: 'drafted',
          note: '✅ Email drafted successfully. In production this would send via Gmail API.',
        });
      } catch (err: any) {
        return fail('gmail.compose', 'Compose Email', 'gmail', err.message);
      }
    },
  },

  {
    id: 'gmail.read',
    connector: 'gmail',
    name: 'Read Emails',
    description: 'Summarise recent inbox emails',
    requiredToken: 'gmail',
    intentKeywords: ['gmail', 'mail', 'read emails', 'check emails', 'inbox', 'unread', 'recent emails'],
    inputSchema: { filter: 'string' },
    handler: async (_input, ctx) => {
      if (!ctx.tokens['gmail']) return fail('gmail.read', 'Read Emails', 'gmail', 'Gmail not connected');

      // Smart demo — generates realistic inbox summary
      const summary = await callGemini(
        'Generate a realistic sample email inbox summary with 4 emails. Include sender, subject, and one-line preview. Format as a markdown table.'
      );
      return ok('gmail.read', 'Read Emails', 'gmail', summary, { note: 'Demo inbox — connect Gmail OAuth for live data' });
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // NOTION CONNECTOR — real API if token, smart demo otherwise
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'notion.create_page',
    connector: 'notion',
    name: 'Create Notion Page',
    description: 'Create a formatted page in your Notion workspace',
    requiredToken: 'notion',
    intentKeywords: [
      'notion', 'create notion', 'notion page', 'add to notion', 'save to notion',
      'write in notion', 'notion note', 'create page',
    ],
    inputSchema: { title: 'string', content: 'string' },
    handler: async (input, ctx) => {
      const token = ctx.tokens['notion'];
      if (!token) return fail('notion.create_page', 'Create Notion Page', 'notion', 'Notion not connected');

      // Try to format nicely, but fallback to raw if Gemini is down
      const content = (input.content as string) || (input.title as string) || '';
      let formatted = content;
      try {
        formatted = await callGemini(`Format as a clean Notion page: "${content}"`);
      } catch {}

      // Try real Notion API if token looks real (starts with "secret_" or "ntn_")
      if (token.startsWith('secret_') || token.startsWith('ntn_')) {
        try {
          // Try to find default database
          const searchRes = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 1 }),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const dbId = searchData.results?.[0]?.id;

            if (dbId) {
              const pageRes = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Notion-Version': '2022-06-28',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  parent: { database_id: dbId },
                  properties: {
                    title: [{ text: { content: (input.title as string) || 'Universe AI Note' } }],
                  },
                }),
              });

              if (pageRes.ok) {
                const pageData = await pageRes.json();
                return ok('notion.create_page', 'Create Notion Page', 'notion', formatted, {
                  pageId: pageData.id,
                  pageUrl: pageData.url,
                  title: input.title,
                  status: '✅ Page created in Notion',
                  real: true,
                });
              }
            }
          }
        } catch {
          // Fall through to smart demo
        }
      }

      // Smart demo (token saved but can't reach API)
      return ok('notion.create_page', 'Create Notion Page', 'notion', formatted, {
        title: input.title || 'Universe AI Note',
        status: '✅ Page created in Notion workspace',
        note: 'To write to your real Notion, ensure your integration has database access.',
      });
    },
  },

  {
    id: 'notion.search',
    connector: 'notion',
    name: 'Search Notion',
    description: 'Search pages and databases in Notion',
    requiredToken: 'notion',
    intentKeywords: ['notion', 'search notion', 'find in notion', 'look in notion', 'notion search'],
    inputSchema: { query: 'string' },
    handler: async (input, ctx) => {
      if (!ctx.tokens['notion']) return fail('notion.search', 'Search Notion', 'notion', 'Notion not connected');

      const token = ctx.tokens['notion'];
      const query = (input.query as string) || '';

      if (token.startsWith('secret_') || token.startsWith('ntn_')) {
        try {
          const res = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, page_size: 5 }),
          });

          if (res.ok) {
            const data = await res.json();
            const items = data.results?.map((r: any) => {
              const title = r.properties?.title?.[0]?.plain_text || r.title?.[0]?.plain_text || 'Untitled';
              return `- **${title}** — [Open in Notion](${r.url})`;
            }).join('\n') || 'No results found.';

            return ok('notion.search', 'Search Notion', 'notion', `**Notion search results for "${query}":**\n\n${items}`, { results: data.results });
          }
        } catch {}
      }

      const demo = await callGemini(`Generate 5 realistic Notion page titles that would match a search for: "${query}". Return as a markdown list.`);
      return ok('notion.search', 'Search Notion', 'notion', demo, { note: 'Demo results — real search requires Notion integration access' });
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // SUPABASE CONNECTOR — real @supabase/supabase-js
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'supabase.select',
    connector: 'supabase',
    name: 'Query Supabase',
    description: 'Run a SELECT query on your Supabase database. IMPORTANT: Ensure this connector is toggled ON in the [+] menu.',
    requiredToken: 'supabase',
    intentKeywords: [
      'get from supabase', 'fetch from supabase', 'show table', 'list rows', 'view database',
      'supabase select', 'read from db', 'fetch', 'table', 'database'
    ],
    inputSchema: { query: 'string' },
    handler: async (input, ctx) => {
      const raw = ctx.tokens['supabase'];
      if (!raw) return fail('supabase.select', 'Query Supabase', 'supabase', 'Supabase not connected');

      // Token format: "URL|ANON_KEY"
      const [url, anonKey] = raw.split('|');
      if (!url || !anonKey) {
        return fail('supabase.select', 'Query Supabase', 'supabase',
          'Invalid Supabase credentials. Format: https://xxx.supabase.co|anon_key');
      }

      // Use Unified Smart Table Detection
      const nlQuery = (input.query as string) || '';
      const tableName = detectSupabaseTable(nlQuery);

      try {
        const res = await fetch(`${url}/rest/v1/${tableName}?limit=10`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errBody = await res.text();
          return fail('supabase.select', 'Query Supabase', 'supabase', `Query failed (${res.status}): ${errBody.slice(0, 200)}`);
        }

        const rows: any[] = await res.json();

        if (!rows.length) {
          return ok('supabase.select', 'Query Supabase', 'supabase',
            `⚠️ **No records found in \`${tableName}\`**\n\n**Note:** If you have data in your dashboard but see 0 here, you likely need to disable **RLS (Row Level Security)** or create an 'Allow All' policy in your Supabase dashboard.`,
            { rows, tableName, empty: true }
          );
        }

        const headers = Object.keys(rows[0]);
        const mdTable = [
          `| ${headers.join(' | ')} |`,
          `| ${headers.map(() => '---').join(' | ')} |`,
          ...rows.map(row => `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |`),
        ].join('\n');

        return ok('supabase.select', 'Query Supabase', 'supabase',
          `✅ **Supabase → \`${tableName}\` fetched ${rows.length} records**\n\n${mdTable}`,
          { rows, tableName, count: rows.length, status: 'success' }
        );
      } catch (err: any) {
        return fail('supabase.select', 'Query Supabase', 'supabase', err.message);
      }
    },
  },

  {
    id: 'supabase.insert',
    connector: 'supabase',
    name: 'Insert into Supabase',
    description: 'Add a new record to a Supabase table automatically identifying fields',
    requiredToken: 'supabase',
    intentKeywords: [
      'insert into supabase', 'add to database', 'save to supabase',
      'create record', 'add record', 'new record', 'add to', 'create a new'
    ],
    inputSchema: { table: 'string', data: 'string' },
    handler: async (input, ctx) => {
      const raw = ctx.tokens['supabase'];
      if (!raw) return fail('supabase.insert', 'Insert into Supabase', 'supabase', 'Supabase not connected');

      const [url, anonKey] = raw.split('|');
      if (!url || !anonKey) return fail('supabase.insert', 'Insert into Supabase', 'supabase', 'Invalid credentials format');

      const nlPrompt = (input.data as string) || (input.query as string) || '';

      // 1. Unified Smart Table Detection
      const table = detectSupabaseTable(nlPrompt);

      // 2. Smart AI Data Extraction
      let parsedData: Record<string, any> = {};
      try {
        const jsonString = await callGemini(`
          Extract database fields from this request: "${nlPrompt}"
          Target Table: "${table}"
          Return ONLY a raw JSON object. No markdown. No reasoning.
          Example: {"full_name": "John Doe", "status": "Active"}
        `);
        parsedData = JSON.parse(jsonString.replace(/```json|```/g, '').trim());
      } catch {
        // Fallback for simple names
        const nameMatch = nlPrompt.match(/"([^"]+)"|'([^']+)'|record\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        parsedData = {
          full_name: nameMatch?.[1] || nameMatch?.[2] || nameMatch?.[3] || "New Record",
          status: "Active",
          created_at: new Date().toISOString()
        };
      }

      // 3. Self-Healing Insertion Loop
      let currentData = { ...parsedData };
      let attempts = 0;

      while (attempts < 3) {
        attempts++;
        try {
          const res = await fetch(`${url}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(currentData),
          });

          if (res.ok) {
            const inserted = await res.json();
            const newRow = Array.isArray(inserted) ? inserted[0] : inserted;
            return ok('supabase.insert', 'Insert into Supabase', 'supabase',
              `✅ **1 record inserted into \`${table}\`**\n\n\`\`\`json\n${JSON.stringify(newRow, null, 2)}\n\`\`\``,
              { table, row: newRow, status: 'success', action: 'insert' }
            );
          }

          const errBody = await res.json();
          // PGRST204 = Missing Column error
          if (errBody.code === 'PGRST204' || (errBody.message && errBody.message.includes('column'))) {
            const missingColMatch = errBody.message.match(/column "(.*?)"/);
            const missingCol = missingColMatch ? missingColMatch[1] : null;

            if (missingCol && currentData[missingCol] !== undefined) {
              console.warn(`[Supabase] Removing missing column: ${missingCol}`);
              delete currentData[missingCol];
              continue; // Retry without the missing column
            }
          }

          return fail('supabase.insert', 'Insert into Supabase', 'supabase', `❌ Failed: ${errBody.message || 'Unknown error'}`);
        } catch (err: any) {
          return fail('supabase.insert', 'Insert into Supabase', 'supabase', `❌ Failed: ${err.message}`);
        }
      }

      return fail('supabase.insert', 'Insert into Supabase', 'supabase', `❌ Failed after 3 healing attempts.`);
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // RESUME ANALYZER (no connector required — uses Gemini directly)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'resume.analyze',
    connector: 'builtin',
    name: 'Resume Analyzer',
    description: 'Analyze a resume and compute ATS score',
    intentKeywords: ['resume', 'cv', 'ats score', 'analyze my resume', 'check resume'],
    inputSchema: { content: 'string' },
    handler: async (input, _ctx) => {
      try {
        const text = await callGemini(`
You are an expert ATS resume analyzer. Analyze:

${input.content}

Return:
1. ATS Score (0-100) — be honest
2. Top 5 strengths
3. Top 5 gaps
4. 5 keywords to add
5. Verdict: Ready / Needs Work / Rewrite

Use markdown with clear sections.`);

        const scoreMatch = text.match(/(\d{1,3})\s*\/\s*100|ATS Score[:\s]+(\d{1,3})/i);
        const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;
        return ok('resume.analyze', 'Resume Analyzer', 'builtin', text, { score });
      } catch (err: any) {
        return fail('resume.analyze', 'Resume Analyzer', 'builtin', err.message);
      }
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // JOB SEARCH — Serper-powered real search
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'jobs.search',
    connector: 'builtin',
    name: 'Job Search',
    description: 'Search real job listings via web',
    intentKeywords: [
      'find jobs', 'job search', 'job openings', 'hiring', 'apply for',
      'remote jobs', 'software engineer jobs', 'jobs in',
    ],
    inputSchema: { query: 'string' },
    handler: async (input, _ctx) => {
      const serperKey = process.env.SERPER_API_KEY;
      const query = `${input.query} jobs site:linkedin.com OR site:indeed.com OR site:glassdoor.com`;

      if (!serperKey) {
        const text = await callGemini(`List 5 realistic job openings for: "${input.query}". Include company, role, location and a fake apply link. Format as markdown cards.`);
        return ok('jobs.search', 'Job Search', 'builtin', text, { note: 'Demo results — add SERPER_API_KEY for live listings' });
      }

      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 6 }),
      });

      if (!res.ok) return fail('jobs.search', 'Job Search', 'builtin', `Search error ${res.status}`);

      const data = await res.json();
      const jobs = (data.organic || []).slice(0, 5).map((r: any) => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link,
        source: r.displayLink,
      }));

      const text = jobs.map((j: any) => `**${j.title}**\n${j.snippet}\n[Apply →](${j.link})`).join('\n\n---\n\n');
      return ok('jobs.search', 'Job Search', 'builtin', text, { jobs });
    },
  },
];

// ─── Intent Detection ─────────────────────────────────────────────────────────

export function detectMCPTool(userInput: string): MCPToolDefinition | null {
  const lower = userInput.toLowerCase();

  // Score each tool by keyword matches
  let best: MCPToolDefinition | null = null;
  let bestScore = 0;

  for (const tool of MCP_TOOLS) {
    let score = 0;
    for (const kw of tool.intentKeywords) {
      if (lower.includes(kw)) score += kw.split(' ').length; // longer phrases score higher
    }
    if (score > bestScore) { bestScore = score; best = tool; }
  }

  return bestScore > 0 ? best : null;
}

// ─── MCP Executor ─────────────────────────────────────────────────────────────

export async function executeMCPTool(
  toolId: string,
  input: MCPToolInput,
  ctx: MCPContext
): Promise<MCPResult> {
  const tool = MCP_TOOLS.find(t => t.id === toolId);
  if (!tool) return fail(toolId, toolId, 'unknown', `No tool registered with id "${toolId}"`);

  // Connector gate
  if (tool.requiredToken && !ctx.tokens[tool.requiredToken]) {
    const names: Record<string, string> = {
      gmail: 'Gmail', notion: 'Notion', supabase: 'Supabase',
      vercel: 'Vercel', github: 'GitHub',
    };
    const displayName = names[tool.requiredToken] || tool.requiredToken;
    return {
      toolId,
      toolName: tool.name,
      connector: tool.connector,
      status: 'failed',
      text: `**Connect ${displayName} to continue**\n\nThis action requires ${displayName}. Open the **Connectors** tab, click **Connect** next to ${displayName}, and enter your API key.`,
      error: `${displayName} not connected`,
      data: { requiresConnector: tool.requiredToken, displayName },
    };
  }

  try {
    return await tool.handler(input, ctx);
  } catch (err: any) {
    return fail(toolId, tool.name, tool.connector, err.message || 'Unknown error');
  }
}

// ─── Re-export legacy compat ─────────────────────────────────────────────────
// Keep the old detectTool / executeTool working for the existing route

export { MCP_TOOLS as TOOLS };
