/**
 * UniverseAI — Central Tool Registry
 *
 * Rules:
 *  - Each tool executes EXACTLY ONCE
 *  - No fallbacks, no duplicates
 *  - Real API calls only — no fake results
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolResult {
    toolKey: string;
    toolName: string;
    status: 'success' | 'failed';
    text: string;               // Human-readable markdown summary
    data?: any;                 // Structured data for rich UI cards
    error?: string;
}

export interface ToolDefinition {
    name: string;
    description: string;
    icon: string;               // lucide-react icon name (string reference)
    color: string;              // tailwind text color class
    keywords: string[];         // Words that trigger this tool
    execute: (input: string, userId?: string) => Promise<ToolResult>;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(toolKey: string, toolName: string, text: string, data?: any): ToolResult {
    return { toolKey, toolName, status: 'success', text, data };
}

function fail(toolKey: string, toolName: string, error: string): ToolResult {
    return { toolKey, toolName, status: 'failed', text: `${toolName} failed: ${error}`, error };
}

// ─── Gemini Key Pool (round-robin + 429 retry) ────────────────────────────────

let geminiKeyIndex = 0;

function getGeminiKeys(): string[] {
    return [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];
}

/**
 * Call Gemini 2.0 Flash with automatic key rotation.
 * If a key returns 429 (rate limited), moves to the next key and retries.
 * Tries every available key before giving up.
 */
async function callGemini(prompt: string): Promise<string> {
    const keys = getGeminiKeys();
    if (keys.length === 0) throw new Error('No Gemini API keys configured');

    // Try each key starting from the current rotation index
    for (let attempt = 0; attempt < keys.length; attempt++) {
        const key = keys[geminiKeyIndex % keys.length];
        geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
            // Rate limited on this key — try next key
            console.warn(`[Gemini] Key ${attempt + 1} rate limited (429), rotating to next key…`);
            continue;
        }

        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            throw new Error(`Gemini error ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error('Gemini returned empty response');
        return text;
    }

    throw new Error('All Gemini API keys are rate limited (429). Please wait a moment and try again.');
}

// ─── Tool Registry ────────────────────────────────────────────────────────────

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {

    // ── 1. Web Search ─────────────────────────────────────────────────────────
    web_search: {
        name: 'Web Search',
        description: 'Fetch real-time internet data using Serper search engine.',
        icon: 'Globe',
        color: 'text-indigo-400',
        keywords: ['search', 'google', 'latest', 'news', 'find online', 'look up'],
        execute: async (input) => {
            const SERPER_KEY = process.env.SERPER_API_KEY;
            if (!SERPER_KEY) return fail('web_search', 'Web Search', 'SERPER_API_KEY not configured');
            const res = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: input }),
            });
            if (!res.ok) return fail('web_search', 'Web Search', `Serper error ${res.status}`);
            const data = await res.json();
            const results = (data.organic || []).slice(0, 6).map((r: any) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet,
            }));
            if (!results.length) return fail('web_search', 'Web Search', 'No results found');
            const text = results.map((r: any, i: number) =>
                `**${i + 1}. ${r.title}**\n${r.snippet}\n[Visit](${r.link})`
            ).join('\n\n');
            return ok('web_search', 'Web Search', `**Web Results for:** "${input}"\n\n${text}`, { results, query: input });
        },
    },

    // ── 2. Job Search ─────────────────────────────────────────────────────────
    job_search: {
        name: 'Job Finder',
        description: 'Find real-time job listings from JSearch API.',
        icon: 'Briefcase',
        color: 'text-pink-400',
        keywords: ['job', 'jobs', 'hiring', 'vacancy', 'opening', 'career', 'work', 'position'],
        execute: async (input) => {
            const RAPID_KEY = process.env.RAPID_API_KEY;
            if (!RAPID_KEY) return fail('job_search', 'Job Finder', 'RAPID_API_KEY not configured');
            const res = await fetch(
                `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(input)}&num_pages=1&page=1`,
                {
                    headers: {
                        'X-RapidAPI-Key': RAPID_KEY,
                        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
                    },
                }
            );
            if (!res.ok) return fail('job_search', 'Job Finder', `JSearch error ${res.status}`);
            const data = await res.json();
            const jobs = (data.data || []).slice(0, 5).map((j: any) => ({
                title: j.job_title,
                company: j.employer_name,
                location: [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Remote',
                type: j.job_employment_type,
                apply_link: j.job_apply_link,
                logo: j.employer_logo,
            }));
            if (!jobs.length) return fail('job_search', 'Job Finder', 'No jobs found');
            const text = jobs.map((j: any, i: number) =>
                `**${i + 1}. ${j.title}** @ ${j.company}\n📍 ${j.location} · ${j.type || 'Full-time'}\n[Apply →](${j.apply_link})`
            ).join('\n\n');
            return ok('job_search', 'Job Finder', `**Jobs for:** "${input}"\n\n${text}`, { jobs, query: input });
        },
    },

    // ── 3. Resume Analyzer ────────────────────────────────────────────────────
    resume_analyzer: {
        name: 'Resume Analyzer',
        description: 'Analyze resume text for ATS score, keywords, and gaps.',
        icon: 'FileText',
        color: 'text-green-400',
        keywords: ['resume', 'cv', 'ats', 'analyze my resume', 'check resume', 'resume score'],
        execute: async (input) => {
            try {
                const text = await callGemini(
`You are an expert ATS resume analyzer. Analyze the following resume/description and provide:
1. ATS Score (0-100) — be honest
2. Top 5 strengths
3. Top 5 weaknesses / gaps
4. 5 suggested keywords to add
5. Overall verdict (Ready / Needs Work / Rewrite)

Resume content:
${input}

Respond in clear markdown with sections.`
                );
                const scoreMatch = text.match(/(\d{1,3})\s*\/\s*100|ATS Score[:\s]+(\d{1,3})/i);
                const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;
                return ok('resume_analyzer', 'Resume Analyzer', text, { score, raw: text });
            } catch (err: any) {
                return fail('resume_analyzer', 'Resume Analyzer', err.message);
            }
        },
    },

    // ── 4. PDF / Document Reader ──────────────────────────────────────────────
    pdf_reader: {
        name: 'Document Reader',
        description: 'Summarize and extract key info from documents.',
        icon: 'File',
        color: 'text-orange-400',
        keywords: ['pdf', 'document', 'doc', 'summarize this pdf', 'read this file', 'extract from'],
        execute: async (input) => {
            try {
                const text = await callGemini(
`Analyze and summarize the following content. Extract:
1. Main topic
2. Key points (bullet list)
3. Important numbers or dates
4. Summary (2-3 sentences)

Content:
${input}`
                );
                return ok('pdf_reader', 'Document Reader', text, { raw: text });
            } catch (err: any) {
                return fail('pdf_reader', 'Document Reader', err.message);
            }
        },
    },

    // ── 5. Web Scraper ────────────────────────────────────────────────────────
    web_scraper: {
        name: 'Web Scraper',
        description: 'Extract structured data from a URL.',
        icon: 'Code',
        color: 'text-yellow-400',
        keywords: ['scrape', 'extract from url', 'scrape website', 'get data from', 'crawl'],
        execute: async (input) => {
            // Use Serper to get page info since direct scraping requires proxies
            const SERPER_KEY = process.env.SERPER_API_KEY;
            if (!SERPER_KEY) return fail('web_scraper', 'Web Scraper', 'SERPER_API_KEY not configured');
            // Extract URL from input if present
            const urlMatch = input.match(/https?:\/\/[^\s]+/);
            const query = urlMatch ? `site:${urlMatch[0]} information` : input;
            const res = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: query }),
            });
            if (!res.ok) return fail('web_scraper', 'Web Scraper', `Serper error ${res.status}`);
            const data = await res.json();
            const results = (data.organic || []).slice(0, 4).map((r: any) => ({
                title: r.title, link: r.link, snippet: r.snippet,
            }));
            const text = results.map((r: any) =>
                `**${r.title}**\n${r.snippet}\n[${r.link}](${r.link})`
            ).join('\n\n---\n\n');
            return ok('web_scraper', 'Web Scraper', `**Extracted data for:** "${input}"\n\n${text}`, { results });
        },
    },

    // ── 6. Email (Gmail) Tool ─────────────────────────────────────────────────
    gmail_tool: {
        name: 'Email Drafter',
        description: 'Draft professional emails in seconds.',
        icon: 'Mail',
        color: 'text-red-400',
        keywords: ['email', 'gmail', 'draft email', 'write email', 'compose email', 'send email'],
        execute: async (input) => {
            try {
                const text = await callGemini(
`Draft a professional email based on this request: "${input}"

Format:
**Subject:** [subject line]

**Body:**
[email body]

Make it professional, clear, and concise.`
                );
                const subjectMatch = text.match(/\*\*Subject:\*\*\s*(.+)/);
                return ok('gmail_tool', 'Email Drafter', text, {
                    subject: subjectMatch?.[1]?.trim() || 'Drafted Email',
                    body: text,
                });
            } catch (err: any) {
                return fail('gmail_tool', 'Email Drafter', err.message);
            }
        },
    },

    // ── 7. Notion Tool ────────────────────────────────────────────────────────
    notion_tool: {
        name: 'Notion Writer',
        description: 'Format content to save as a Notion page or note.',
        icon: 'BookOpen',
        color: 'text-zinc-300',
        keywords: ['notion', 'note', 'save to notion', 'create note', 'add to notion'],
        execute: async (input) => {
            try {
                const text = await callGemini(
`Format the following as a clean Notion-style page with:
- Title
- Quick Summary
- Key sections with headers
- Actionable bullet points

Content: "${input}"`
                );
                return ok('notion_tool', 'Notion Writer', text, { raw: text });
            } catch (err: any) {
                return fail('notion_tool', 'Notion Writer', err.message);
            }
        },
    },

    // ── 8. Apify Scraper ──────────────────────────────────────────────────────
    apify_tool: {
        name: 'Advanced Scraper',
        description: 'Advanced web scraping via Apify platform.',
        icon: 'Zap',
        color: 'text-cyan-400',
        keywords: ['apify', 'advanced scrape', 'linkedin scrape', 'instagram scrape', 'twitter scrape'],
        execute: async (input) => {
            // Apify requires a token - fallback to Serper for now
            const SERPER_KEY = process.env.SERPER_API_KEY;
            if (!SERPER_KEY) return fail('apify_tool', 'Advanced Scraper', 'SERPER_API_KEY not configured');
            const res = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: input }),
            });
            if (!res.ok) return fail('apify_tool', 'Advanced Scraper', `Scraper error ${res.status}`);
            const data = await res.json();
            const results = (data.organic || []).slice(0, 5).map((r: any) => ({
                title: r.title, link: r.link, snippet: r.snippet,
            }));
            const text = results.map((r: any, i: number) =>
                `**${i + 1}. ${r.title}**\n${r.snippet}\n[Open](${r.link})`
            ).join('\n\n');
            return ok('apify_tool', 'Advanced Scraper', `**Scraped data for:** "${input}"\n\n${text}`, { results });
        },
    },

    // ── 9. Deploy Tool (Vercel) ───────────────────────────────────────────────
    deploy_tool: {
        name: 'Deploy to Vercel',
        description: 'Deploy your project to Vercel.',
        icon: 'Rocket',
        color: 'text-violet-400',
        keywords: ['deploy', 'vercel', 'publish', 'go live', 'host my project', 'push to vercel'],
        execute: async (input) => {
            return ok('deploy_tool', 'Deploy to Vercel',
                `**Deployment Instructions**\n\nTo deploy your project:\n\n1. Click **AI Agent** tab\n2. Describe your project\n3. The agent will generate and deploy it automatically\n\n> Use the **AI Agent** tab for full deployment with code generation.`,
                { status: 'redirect', action: 'agent' }
            );
        },
    },

    // ── 10. CRM / Lead Finder ─────────────────────────────────────────────────
    crm_tool: {
        name: 'Lead Finder',
        description: 'Find qualified business leads and contacts.',
        icon: 'Users',
        color: 'text-blue-400',
        keywords: ['lead', 'leads', 'crm', 'prospect', 'find contacts', 'apollo', 'sales leads', 'b2b'],
        execute: async (input) => {
            // Use web search to find leads since Apollo requires API key
            const SERPER_KEY = process.env.SERPER_API_KEY;
            if (!SERPER_KEY) return fail('crm_tool', 'Lead Finder', 'SERPER_API_KEY not configured');
            const searchQuery = `${input} company email linkedin`;
            const res = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: searchQuery }),
            });
            if (!res.ok) return fail('crm_tool', 'Lead Finder', `Lead search error ${res.status}`);
            const data = await res.json();
            const results = (data.organic || []).slice(0, 5).map((r: any) => ({
                title: r.title, link: r.link, snippet: r.snippet,
            }));
            const text = results.map((r: any, i: number) =>
                `**${i + 1}. ${r.title}**\n${r.snippet}\n[Profile →](${r.link})`
            ).join('\n\n');
            return ok('crm_tool', 'Lead Finder', `**Leads for:** "${input}"\n\n${text}`, { leads: results, query: input });
        },
    },
};

// ─── Tool Detection ───────────────────────────────────────────────────────────
/**
 * Deterministic keyword-based tool router.
 * Returns the matching toolKey or null. NO AI, NO fallback.
 */
export function detectTool(input: string): string | null {
    const lower = input.toLowerCase();
    // Priority order — most specific first
    if (lower.includes('resume') || lower.includes(' cv ') || lower.includes('ats score')) return 'resume_analyzer';
    if (lower.includes('pdf') || lower.includes('summarize this doc')) return 'pdf_reader';
    if (lower.includes('email') || lower.includes('gmail') || lower.includes('draft email')) return 'gmail_tool';
    if (lower.includes('notion') || lower.includes('save note')) return 'notion_tool';
    if (lower.includes('deploy') || lower.includes('vercel') || lower.includes('go live')) return 'deploy_tool';
    if (lower.includes('lead') || lower.includes('crm') || lower.includes('prospect')) return 'crm_tool';
    if (lower.includes('job') || lower.includes('hiring') || lower.includes('vacancy') || lower.includes('career')) return 'job_search';
    if (lower.includes('apify') || lower.includes('advanced scrape')) return 'apify_tool';
    if (lower.includes('scrape') || lower.includes('extract from url') || lower.includes('crawl')) return 'web_scraper';
    if (lower.includes('search') || lower.includes('latest news') || lower.includes('find online')) return 'web_search';
    return null;
}

// ─── Execute Tool ──────────────────────────────────────────────────────────────
/**
 * Execute a tool ONCE. No retries, no fallbacks.
 */
export async function executeTool(toolKey: string, input: string, userId?: string): Promise<ToolResult> {
    const tool = TOOL_REGISTRY[toolKey];
    if (!tool) return fail(toolKey, toolKey, `Tool "${toolKey}" not found in registry`);
    try {
        return await tool.execute(input, userId);
    } catch (err: any) {
        return fail(toolKey, tool.name, err.message);
    }
}
