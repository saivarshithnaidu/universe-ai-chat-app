/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UniverseAI — MCP Connector Registry
 *  Single source of truth: connectors, auth types, tools, and routing.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthType = 'oauth' | 'token' | 'public';

export type ConnectorCategory =
  | 'AI & Dev'
  | 'Productivity'
  | 'Job & Business'
  | 'Design'
  | 'Database & Storage'
  | 'Deployment'
  | 'Automation'
  | 'Analytics'
  | 'Auth'
  | '3D & Visual';

export interface ConnectorTool {
  id: string;
  name: string;
  description: string;
  intentKeywords: string[];
}

export interface ConnectorDef {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: ConnectorCategory;
  authType: AuthType;     // 'oauth' | 'token' | 'public'
  tools: ConnectorTool[];
  docsUrl?: string;
  oauthUrl?: string;      // For OAuth connectors (can be simulated)
  tokenLabel?: string;    // Label shown in the token input field
  tokenHint?: string;     // Placeholder / format hint
}

// ─── Intent Router ────────────────────────────────────────────────────────────

const ROUTER: { pattern: RegExp; connectorId: string; toolId: string }[] = [
  // AI & Dev
  { pattern: /github|create repo|push code|github issue/i,      connectorId: 'github',       toolId: 'github.create_repo' },
  { pattern: /hugging ?face|run model|ai model inference/i,      connectorId: 'huggingface',  toolId: 'huggingface.run_model' },
  { pattern: /openai|gpt-4|chatgpt/i,                            connectorId: 'openai',       toolId: 'openai.chat' },
  { pattern: /apify|scrape|web scraper|extract data/i,           connectorId: 'apify',        toolId: 'apify.run_actor' },
  // Productivity
  { pattern: /slack|send to slack|notify slack/i,                connectorId: 'slack',        toolId: 'slack.send_message' },
  { pattern: /gmail|send email|draft email|write email/i,        connectorId: 'gmail',        toolId: 'gmail.send' },
  { pattern: /trello|create card|trello board/i,                 connectorId: 'trello',       toolId: 'trello.create_card' },
  { pattern: /clickup|click up/i,                                connectorId: 'clickup',      toolId: 'clickup.create_task' },
  { pattern: /confluence|wiki page|atlassian wiki/i,             connectorId: 'confluence',   toolId: 'confluence.create_page' },
  // Job & Business
  { pattern: /jira|jira issue|jira ticket/i,                     connectorId: 'jira',         toolId: 'jira.create_issue' },
  { pattern: /hubspot|crm contact|hubspot contact/i,             connectorId: 'hubspot',      toolId: 'hubspot.create_contact' },
  { pattern: /stripe|payment|billing|invoice/i,                  connectorId: 'stripe',       toolId: 'stripe.create_payment' },
  { pattern: /shopify|store|product inventory/i,                 connectorId: 'shopify',      toolId: 'shopify.get_products' },
  // Database
  { pattern: /firebase|firestore/i,                              connectorId: 'firebase',     toolId: 'firebase.write' },
  { pattern: /mongodb|mongo|atlas/i,                             connectorId: 'mongodb',      toolId: 'mongodb.find' },
  { pattern: /pinecone|vector|embeddings/i,                      connectorId: 'pinecone',     toolId: 'pinecone.upsert' },
  // Deployment
  { pattern: /vercel|deploy to vercel/i,                         connectorId: 'vercel',       toolId: 'vercel.deploy' },
  // Automation / Comms
  { pattern: /twilio|send sms|text message|whatsapp/i,           connectorId: 'twilio',       toolId: 'twilio.send_sms' },
  { pattern: /discord|send to discord|discord message/i,         connectorId: 'discord',      toolId: 'discord.send_message' },
  // Database (existing)
  { pattern: /supabase|database|sql|table|rows|records/i,        connectorId: 'supabase',     toolId: 'supabase.select' },
  { pattern: /insert|add (?:to|record|row)|create record/i,      connectorId: 'supabase',     toolId: 'supabase.insert' },
  { pattern: /airtable/i,                                         connectorId: 'airtable',     toolId: 'airtable.create_record' },
  // Productivity (existing)
  { pattern: /notion|create page|wiki/i,                          connectorId: 'notion',       toolId: 'notion.create_page' },
  { pattern: /google drive|upload file|upload to drive/i,         connectorId: 'google_drive', toolId: 'google_drive.upload' },
  { pattern: /read (?:from )?drive|drive file/i,                  connectorId: 'google_drive', toolId: 'google_drive.read' },
  { pattern: /pdf|summarize doc|read doc|read file/i,             connectorId: 'pdf_viewer',   toolId: 'pdf_viewer.summarize' },
  { pattern: /resume|cv |generate resume/i,                       connectorId: 'resumeforge',  toolId: 'resumeforge.generate' },
  // Job & Business (existing)
  { pattern: /job|jobs|hiring|vacancy|vacancies|indeed/i,         connectorId: 'indeed',       toolId: 'indeed.search_jobs' },
  { pattern: /leads?|prospects?|apollo|find contacts?/i,          connectorId: 'apollo',       toolId: 'apollo.find_leads' },
  { pattern: /linear|create issue|bug report/i,                   connectorId: 'linear',       toolId: 'linear.create_issue' },
  { pattern: /asana|create task|add task/i,                       connectorId: 'asana',        toolId: 'asana.create_task' },
  // AI & Dev (existing)
  { pattern: /replit|run code|execute code/i,                     connectorId: 'replit',       toolId: 'replit.run_code' },
  { pattern: /tavily|deep search|research/i,                      connectorId: 'tavily',       toolId: 'tavily.search' },
  { pattern: /postman|test api|api test/i,                        connectorId: 'postman',      toolId: 'postman.test_api' },
  { pattern: /lovable|generate app|build app/i,                   connectorId: 'lovable',      toolId: 'lovable.generate_app' },
  // Design (existing)
  { pattern: /figma|design prompt|ui design/i,                    connectorId: 'figma',        toolId: 'figma.generate_prompt' },
  { pattern: /canva|poster|banner|graphic/i,                      connectorId: 'canva',        toolId: 'canva.generate' },
  // Deployment (existing)
  { pattern: /netlify|deploy|go live/i,                           connectorId: 'netlify',      toolId: 'netlify.deploy' },
  // Automation (existing)
  { pattern: /zapier|trigger workflow|automate/i,                  connectorId: 'zapier',       toolId: 'zapier.trigger' },
  { pattern: /n8n|run workflow|automation workflow/i,              connectorId: 'n8n',          toolId: 'n8n.run_workflow' },
  // Analytics (existing)
  { pattern: /clarity|user behavior|analytics/i,                   connectorId: 'clarity',      toolId: 'clarity.analyze' },
  // Auth (existing)
  { pattern: /clerk|manage user|auth user/i,                       connectorId: 'clerk',        toolId: 'clerk.manage_user' },
  // 3D (existing)
  { pattern: /three ?js|3d scene|render 3d/i,                     connectorId: 'threejs',      toolId: 'threejs.render' },
];

export function routeToConnector(prompt: string): { connectorId: string; toolId: string } | null {
  for (const rule of ROUTER) {
    if (rule.pattern.test(prompt)) return { connectorId: rule.connectorId, toolId: rule.toolId };
  }
  return null;
}

// ─── Simulated Tool Handlers ───────────────────────────────────────────────────

export type ToolResult = { status: 'success' | 'error'; message: string; data?: any };

const SIMULATED_HANDLERS: Record<string, (i: string) => ToolResult> = {
  // Existing
  'notion.create_page':       (i) => ({ status: 'success', message: `✅ Notion page created: "${i.slice(0, 40)}"`,   data: { pageId: 'notion-' + Date.now() } }),
  'google_drive.upload':      ()  => ({ status: 'success', message: `✅ File uploaded to Google Drive`,              data: { fileId: 'gdrive-' + Date.now() } }),
  'google_drive.read':        ()  => ({ status: 'success', message: `✅ File read from Google Drive`,               data: { content: 'Sample document content...' } }),
  'pdf_viewer.summarize':     ()  => ({ status: 'success', message: `✅ Document summarized`,                        data: { summary: 'Key points extracted from the PDF.' } }),
  'resumeforge.generate':     ()  => ({ status: 'success', message: `✅ Resume generated`,                          data: { resumeUrl: 'https://resumeforge.ai/preview/' + Date.now() } }),
  'indeed.search_jobs':       (i) => ({ status: 'success', message: `✅ Found 12 listings for "${i.slice(0, 30)}"`, data: { jobs: [{ title: 'Software Engineer', company: 'TechCorp', location: 'Bangalore' }, { title: 'Full Stack Dev', company: 'StartupXYZ', location: 'Remote' }] } }),
  'apollo.find_leads':        ()  => ({ status: 'success', message: `✅ Found 8 qualified leads`,                   data: { leads: [{ name: 'John D.', company: 'Acme Corp', title: 'CTO' }] } }),
  'linear.create_issue':      (i) => ({ status: 'success', message: `✅ Linear issue: "${i.slice(0, 40)}"`,         data: { issueId: 'ENG-' + Math.floor(Math.random() * 1000) } }),
  'asana.create_task':        (i) => ({ status: 'success', message: `✅ Asana task: "${i.slice(0, 40)}"`,           data: { taskId: 'task-' + Date.now() } }),
  'replit.run_code':          ()  => ({ status: 'success', message: `✅ Code executed on Replit`,                   data: { output: 'Hello, World!' } }),
  'tavily.search':            (i) => ({ status: 'success', message: `✅ Deep research: "${i.slice(0, 40)}"`,        data: { sources: 8 } }),
  'postman.test_api':         ()  => ({ status: 'success', message: `✅ API test passed — 200 OK`,                  data: { status: 200, responseTime: '142ms' } }),
  'lovable.generate_app':     ()  => ({ status: 'success', message: `✅ App generated`,                             data: { appUrl: 'https://lovable.dev/app/' + Date.now() } }),
  'figma.generate_prompt':    ()  => ({ status: 'success', message: `✅ Figma design prompt ready`,                 data: { prompt: 'Minimalist dashboard with dark mode...' } }),
  'canva.generate':           ()  => ({ status: 'success', message: `✅ Canva design created`,                      data: { designUrl: 'https://canva.com/design/' + Date.now() } }),
  'netlify.deploy':           ()  => ({ status: 'success', message: `✅ Deployed to Netlify`,                       data: { url: 'https://your-app.netlify.app' } }),
  'zapier.trigger':           ()  => ({ status: 'success', message: `✅ Zapier workflow triggered`,                 data: { workflowId: 'zap-' + Date.now() } }),
  'n8n.run_workflow':         ()  => ({ status: 'success', message: `✅ n8n workflow executed`,                     data: { runId: 'n8n-' + Date.now() } }),
  'clarity.analyze':          ()  => ({ status: 'success', message: `✅ Behavior analyzed`,                         data: { sessions: 1247, topPage: '/dashboard' } }),
  'clerk.manage_user':        ()  => ({ status: 'success', message: `✅ User action completed`,                     data: { userId: 'user-' + Date.now() } }),
  'threejs.render':           ()  => ({ status: 'success', message: `✅ 3D scene rendered (60fps)`,                 data: { sceneId: 'scene-' + Date.now(), fps: 60 } }),
  'airtable.create_record':   ()  => ({ status: 'success', message: `✅ Record created in Airtable`,               data: { recordId: 'rec' + Date.now() } }),
  // New
  'github.create_repo':       (i) => ({ status: 'success', message: `✅ GitHub repo created: "${i.slice(0, 40)}"`, data: { repoUrl: 'https://github.com/user/' + Date.now() } }),
  'github.create_issue':      (i) => ({ status: 'success', message: `✅ GitHub issue filed: "${i.slice(0, 40)}"`,  data: { issueId: Math.floor(Math.random() * 999) } }),
  'github.push_code':         ()  => ({ status: 'success', message: `✅ Code pushed to GitHub`,                    data: { commit: 'abc1234' } }),
  'huggingface.run_model':    (i) => ({ status: 'success', message: `✅ HuggingFace model ran for: "${i.slice(0,30)}"`, data: { output: 'Model inference complete.' } }),
  'openai.chat':              (i) => ({ status: 'success', message: `✅ OpenAI responded to: "${i.slice(0,30)}"`,  data: { model: 'gpt-4o', tokens: 142 } }),
  'slack.send_message':       (i) => ({ status: 'success', message: `✅ Slack message sent: "${i.slice(0, 40)}"`, data: { channel: '#general', ts: Date.now() } }),
  'gmail.send':               (i) => ({ status: 'success', message: `✅ Email drafted: "${i.slice(0, 40)}"`,       data: { subject: i.slice(0, 30), status: 'drafted' } }),
  'trello.create_card':       (i) => ({ status: 'success', message: `✅ Trello card: "${i.slice(0, 40)}"`,         data: { cardId: 'card-' + Date.now() } }),
  'clickup.create_task':      (i) => ({ status: 'success', message: `✅ ClickUp task: "${i.slice(0, 40)}"`,        data: { taskId: 'task-' + Date.now() } }),
  'confluence.create_page':   (i) => ({ status: 'success', message: `✅ Confluence page created: "${i.slice(0,40)}"`, data: { pageId: 'page-' + Date.now() } }),
  'jira.create_issue':        (i) => ({ status: 'success', message: `✅ Jira issue created: "${i.slice(0, 40)}"`, data: { issueKey: 'PROJ-' + Math.floor(Math.random() * 999) } }),
  'hubspot.create_contact':   (i) => ({ status: 'success', message: `✅ HubSpot contact added: "${i.slice(0,35)}"`, data: { contactId: 'hs-' + Date.now() } }),
  'stripe.create_payment':    (i) => ({ status: 'success', message: `✅ Stripe payment intent created`,             data: { paymentId: 'pi_' + Date.now(), status: 'requires_payment_method' } }),
  'shopify.get_products':     ()  => ({ status: 'success', message: `✅ Fetched 10 Shopify products`,               data: { products: [{ id: 1, title: 'Sample Product', price: '29.99' }] } }),
  'firebase.write':           (i) => ({ status: 'success', message: `✅ Firebase document written`,                 data: { docId: 'doc-' + Date.now() } }),
  'mongodb.find':             (i) => ({ status: 'success', message: `✅ MongoDB query returned 5 docs`,             data: { docs: [{ _id: 'abc123', name: 'Sample' }] } }),
  'pinecone.upsert':          ()  => ({ status: 'success', message: `✅ Pinecone vectors upserted`,                 data: { upserted: 3, namespace: 'default' } }),
  'vercel.deploy':            ()  => ({ status: 'success', message: `✅ Deployed to Vercel`,                        data: { url: 'https://your-app.vercel.app', deployId: 'dpl-' + Date.now() } }),
  'twilio.send_sms':          (i) => ({ status: 'success', message: `✅ SMS sent: "${i.slice(0, 40)}"`,            data: { sid: 'SM' + Date.now(), status: 'sent' } }),
  'discord.send_message':     (i) => ({ status: 'success', message: `✅ Discord message sent: "${i.slice(0,40)}"`, data: { messageId: Date.now() } }),
  'apify.run_actor':          (i) => ({ status: 'success', message: `✅ Apify actor ran for: "${i.slice(0,40)}"`,  data: { datasetId: 'ds-' + Date.now(), items: 42 } }),
};

export function executeSimulatedTool(toolId: string, input: string): ToolResult {
  const handler = SIMULATED_HANDLERS[toolId];
  if (!handler) return { status: 'error', message: `❌ Tool "${toolId}" not found in registry` };
  return handler(input);
}

// ─── Connector Registry ───────────────────────────────────────────────────────

export const CONNECTOR_REGISTRY: ConnectorDef[] = [

  // ── 🧠 AI & Dev ─────────────────────────────────────────────────────────────
  {
    id: 'github', name: 'GitHub', category: 'AI & Dev', authType: 'token',
    logo: 'https://github.com/favicon.ico',
    description: 'Create repos, push code, and file issues on GitHub.',
    tokenLabel: 'GitHub Personal Access Token', tokenHint: 'Enter your GitHub Token',
    tools: [
      { id: 'github.create_repo',  name: 'Create Repo',   description: 'New repository',  intentKeywords: ['github', 'create repo', 'new repository'] },
      { id: 'github.create_issue', name: 'Create Issue',  description: 'File a bug',       intentKeywords: ['github issue', 'file issue', 'bug on github'] },
      { id: 'github.push_code',    name: 'Push Code',     description: 'Push to branch',   intentKeywords: ['push code', 'commit to github'] },
    ],
    docsUrl: 'https://docs.github.com/en/rest',
  },
  {
    id: 'huggingface', name: 'Hugging Face', category: 'AI & Dev', authType: 'token',
    logo: '🤗',
    description: 'Run AI models and inference via Hugging Face API.',
    tokenLabel: 'HuggingFace API Token', tokenHint: 'Enter your HuggingFace Token',
    tools: [{ id: 'huggingface.run_model', name: 'Run Model', description: 'AI inference', intentKeywords: ['hugging face', 'huggingface', 'run model', 'ai model'] }],
    docsUrl: 'https://huggingface.co/docs/api-inference',
  },
  {
    id: 'openai', name: 'OpenAI', category: 'AI & Dev', authType: 'token',
    logo: '🔮',
    description: 'Access GPT-4o, DALL·E, and Whisper via OpenAI API.',
    tokenLabel: 'OpenAI API Key', tokenHint: 'Enter your OpenAI Key',
    tools: [{ id: 'openai.chat', name: 'Chat Completion', description: 'GPT-4o call', intentKeywords: ['openai', 'gpt', 'gpt-4', 'chatgpt'] }],
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'apify', name: 'Apify', category: 'AI & Dev', authType: 'token',
    logo: 'https://apify.com/favicon.ico',
    description: 'Advanced web scraping and data extraction via Apify actors.',
    tokenLabel: 'Apify API Token', tokenHint: 'Enter your Apify Token',
    tools: [{ id: 'apify.run_actor', name: 'Run Actor', description: 'Web scraper', intentKeywords: ['apify', 'scrape', 'web scraper', 'extract data'] }],
    docsUrl: 'https://docs.apify.com',
  },
  {
    id: 'replit', name: 'Replit', category: 'AI & Dev', authType: 'token',
    logo: 'https://cdn.worldvectorlogo.com/logos/replit.svg',
    description: 'Run and execute code in Replit environments.',
    tokenLabel: 'Replit API Token', tokenHint: 'Enter your Replit Token',
    tools: [{ id: 'replit.run_code', name: 'Run Code', description: 'Execute code snippets', intentKeywords: ['replit', 'run code', 'execute'] }],
    docsUrl: 'https://docs.replit.com',
  },
  {
    id: 'lovable', name: 'Lovable', category: 'AI & Dev', authType: 'token',
    logo: 'https://lovable.dev/favicon.ico',
    description: 'Generate full-stack web apps from natural language.',
    tokenLabel: 'Lovable API Key', tokenHint: 'Enter your Lovable Key',
    tools: [{ id: 'lovable.generate_app', name: 'Generate App', description: 'Build apps with AI', intentKeywords: ['lovable', 'generate app', 'build app'] }],
    docsUrl: 'https://docs.lovable.dev',
  },
  {
    id: 'postman', name: 'Postman', category: 'AI & Dev', authType: 'token',
    logo: 'https://www.postman.com/favicon-32x32.png',
    description: 'Test and validate APIs instantly.',
    tokenLabel: 'Postman API Key', tokenHint: 'Enter your Postman Key',
    tools: [{ id: 'postman.test_api', name: 'Test API', description: 'Run API tests', intentKeywords: ['postman', 'test api', 'api test'] }],
    docsUrl: 'https://www.postman.com/docs',
  },
  {
    id: 'tavily', name: 'Tavily', category: 'AI & Dev', authType: 'token',
    logo: 'https://tavily.com/favicon.ico',
    description: 'Deep web research powered by AI.',
    tokenLabel: 'Tavily API Key', tokenHint: 'Enter your Tavily Key',
    tools: [{ id: 'tavily.search', name: 'Deep Search', description: 'Advanced AI search', intentKeywords: ['tavily', 'deep search', 'research'] }],
    docsUrl: 'https://docs.tavily.com',
  },

  // ── 📄 Productivity ──────────────────────────────────────────────────────────
  {
    id: 'slack', name: 'Slack', category: 'Productivity', authType: 'token',
    logo: 'https://slack.com/favicon.ico',
    description: 'Send messages and notifications to Slack channels.',
    tokenLabel: 'Slack Bot Token', tokenHint: 'xoxb-xxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'slack.send_message', name: 'Send Message', description: 'Post to channel', intentKeywords: ['slack', 'send to slack', 'notify slack', 'slack message'] }],
    docsUrl: 'https://api.slack.com/methods',
  },
  {
    id: 'gmail', name: 'Gmail', category: 'Productivity', authType: 'token',
    logo: 'https://mail.google.com/favicon.ico',
    description: 'Draft and send professional emails via Gmail.',
    tokenLabel: 'Gmail API Key', tokenHint: 'AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'gmail.send', name: 'Send Email', description: 'Draft and send email', intentKeywords: ['gmail', 'send email', 'email', 'write email', 'draft email'] }],
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    id: 'trello', name: 'Trello', category: 'Productivity', authType: 'token',
    logo: 'https://trello.com/favicon.ico',
    description: 'Create cards and manage boards in Trello.',
    tokenLabel: 'Trello API Key + Token', tokenHint: 'key:token (from trello.com/app-key)',
    tools: [{ id: 'trello.create_card', name: 'Create Card', description: 'Add a Trello card', intentKeywords: ['trello', 'create card', 'trello board', 'add card'] }],
    docsUrl: 'https://developer.atlassian.com/cloud/trello',
  },
  {
    id: 'clickup', name: 'ClickUp', category: 'Productivity', authType: 'token',
    logo: 'https://clickup.com/favicon.ico',
    description: 'Manage tasks and projects in ClickUp.',
    tokenLabel: 'ClickUp Personal Token', tokenHint: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'clickup.create_task', name: 'Create Task', description: 'Add ClickUp task', intentKeywords: ['clickup', 'create task', 'click up'] }],
    docsUrl: 'https://clickup.com/api',
  },
  {
    id: 'confluence', name: 'Confluence', category: 'Productivity', authType: 'token',
    logo: '📘',
    description: 'Create and manage pages in your Confluence wiki.',
    tokenLabel: 'Confluence API Token', tokenHint: 'Atlassian API token from id.atlassian.com',
    tools: [{ id: 'confluence.create_page', name: 'Create Page', description: 'Add wiki page', intentKeywords: ['confluence', 'create confluence', 'wiki page', 'atlassian wiki'] }],
    docsUrl: 'https://developer.atlassian.com/cloud/confluence',
  },
  {
    id: 'notion', name: 'Notion', category: 'Productivity', authType: 'token',
    logo: 'https://www.notion.so/front-static/favicon.ico',
    description: 'Create pages, databases, and notes in Notion.',
    tokenLabel: 'Notion Integration Token',
    tokenHint: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'notion.create_page', name: 'Create Page', description: 'Add a Notion page', intentKeywords: ['notion', 'create page', 'wiki', 'notes'] }],
    docsUrl: 'https://developers.notion.com/docs/authorization',
  },
  {
    id: 'google_drive', name: 'Google Drive', category: 'Productivity', authType: 'token',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
    description: 'Upload, read, and manage Google Drive files.',
    tokenLabel: 'Google API Key',
    tokenHint: 'AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [
      { id: 'google_drive.upload', name: 'Upload File', description: 'Upload to Drive', intentKeywords: ['google drive', 'upload file'] },
      { id: 'google_drive.read',   name: 'Read File',   description: 'Read from Drive',  intentKeywords: ['read from drive', 'drive file'] },
    ],
    docsUrl: 'https://developers.google.com/drive/api/guides/about-sdk',
  },
  {
    id: 'pdf_viewer', name: 'PDF Viewer', category: 'Productivity', authType: 'public',
    logo: '📄',
    description: 'Summarize and extract insights from PDFs. No setup needed.',
    tools: [{ id: 'pdf_viewer.summarize', name: 'Summarize PDF', description: 'Extract key info', intentKeywords: ['pdf', 'summarize doc', 'read doc'] }],
  },
  {
    id: 'resumeforge', name: 'ResumeForge', category: 'Productivity', authType: 'token',
    logo: '📝',
    description: 'Generate professional ATS-optimized resumes.',
    tokenLabel: 'ResumeForge API Key', tokenHint: 'rf_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'resumeforge.generate', name: 'Generate Resume', description: 'Create a resume', intentKeywords: ['resume', 'cv', 'generate resume'] }],
  },

  // ── 💼 Job & Business ────────────────────────────────────────────────────────
  {
    id: 'jira', name: 'Jira', category: 'Job & Business', authType: 'token',
    logo: 'https://jira.atlassian.com/favicon.ico',
    description: 'Create and track issues in Jira projects.',
    tokenLabel: 'Jira API Token', tokenHint: 'Atlassian API token from id.atlassian.com',
    tools: [{ id: 'jira.create_issue', name: 'Create Issue', description: 'Log a Jira ticket', intentKeywords: ['jira', 'create jira', 'jira issue', 'jira ticket'] }],
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3',
  },
  {
    id: 'hubspot', name: 'HubSpot', category: 'Job & Business', authType: 'token',
    logo: 'https://www.hubspot.com/favicon.ico',
    description: 'Manage CRM contacts and deals in HubSpot.',
    tokenLabel: 'HubSpot Private App Token', tokenHint: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    tools: [{ id: 'hubspot.create_contact', name: 'Create Contact', description: 'Add CRM contact', intentKeywords: ['hubspot', 'crm', 'create contact', 'hubspot contact'] }],
    docsUrl: 'https://developers.hubspot.com',
  },
  {
    id: 'stripe', name: 'Stripe', category: 'Job & Business', authType: 'token',
    logo: 'https://stripe.com/favicon.ico',
    description: 'Create payment intents and manage Stripe billing.',
    tokenLabel: 'Stripe Secret Key', tokenHint: 'sk_test_... (Enter your Stripe key)',
    tools: [{ id: 'stripe.create_payment', name: 'Create Payment', description: 'Payment intent', intentKeywords: ['stripe', 'payment', 'charge', 'billing', 'invoice'] }],
    docsUrl: 'https://stripe.com/docs/api',
  },
  {
    id: 'shopify', name: 'Shopify', category: 'Job & Business', authType: 'token',
    logo: 'https://shopify.com/favicon.ico',
    description: 'Manage products, orders, and customers in Shopify.',
    tokenLabel: 'Shopify Admin API Token', tokenHint: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'shopify.get_products', name: 'Get Products', description: 'List products', intentKeywords: ['shopify', 'products', 'store', 'inventory', 'orders'] }],
    docsUrl: 'https://shopify.dev/docs/api/admin-rest',
  },
  {
    id: 'indeed', name: 'Indeed', category: 'Job & Business', authType: 'token',
    logo: 'https://indeed.com/favicon.ico',
    description: 'Search real job listings across industries.',
    tokenLabel: 'Indeed API Key', tokenHint: 'pub_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'indeed.search_jobs', name: 'Search Jobs', description: 'Find job listings', intentKeywords: ['job', 'jobs', 'hiring', 'vacancy', 'indeed'] }],
    docsUrl: 'https://developer.indeed.com',
  },
  {
    id: 'apollo', name: 'Apollo.io', category: 'Job & Business', authType: 'token',
    logo: 'https://apollo.io/favicon.ico',
    description: 'Find B2B leads and company contacts.',
    tokenLabel: 'Apollo API Key', tokenHint: 'api_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'apollo.find_leads', name: 'Find Leads', description: 'Prospect discovery', intentKeywords: ['leads', 'prospects', 'apollo', 'find contacts'] }],
    docsUrl: 'https://apolloio.github.io/apollo-api-docs',
  },
  {
    id: 'linear', name: 'Linear', category: 'Job & Business', authType: 'token',
    logo: 'https://linear.app/favicon.ico',
    description: 'Create and manage engineering issues.',
    tokenLabel: 'Linear Personal API Key',
    tokenHint: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'linear.create_issue', name: 'Create Issue', description: 'Log a bug or feature', intentKeywords: ['linear', 'create issue', 'bug report'] }],
    docsUrl: 'https://linear.app/docs/api',
  },
  {
    id: 'asana', name: 'Asana', category: 'Job & Business', authType: 'token',
    logo: 'https://asana.com/favicon.ico',
    description: 'Create tasks and manage projects in Asana.',
    tokenLabel: 'Asana Personal Access Token',
    tokenHint: '1/xxxxxxxx:yyyyyyyy',
    tools: [{ id: 'asana.create_task', name: 'Create Task', description: 'Add a new task', intentKeywords: ['asana', 'create task', 'add task'] }],
    docsUrl: 'https://developers.asana.com/docs/personal-access-token',
  },

  // ── 🎨 Design ────────────────────────────────────────────────────────────────
  {
    id: 'figma', name: 'Figma', category: 'Design', authType: 'token',
    logo: 'https://static.figma.com/app/icon/1/favicon.ico',
    description: 'Generate AI design prompts for Figma.',
    tokenLabel: 'Figma Personal Token', tokenHint: 'figd_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'figma.generate_prompt', name: 'Generate Design Prompt', description: 'UI/UX design prompts', intentKeywords: ['figma', 'design prompt', 'ui design'] }],
    docsUrl: 'https://www.figma.com/developers',
  },
  {
    id: 'canva', name: 'Canva', category: 'Design', authType: 'token',
    logo: 'https://static.canva.com/web/images/12487a1e0770d29351bd4ce4f87ec8fe.svg',
    description: 'Create stunning graphics and designs.',
    tokenLabel: 'Canva API Key', tokenHint: 'OAuthToken_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'canva.generate', name: 'Generate Design', description: 'Create graphics', intentKeywords: ['canva', 'poster', 'banner', 'graphic'] }],
    docsUrl: 'https://www.canva.dev',
  },

  // ── 🗄 Database & Storage ─────────────────────────────────────────────────────
  {
    id: 'firebase', name: 'Firebase', category: 'Database & Storage', authType: 'token',
    logo: 'https://firebase.google.com/favicon.ico',
    description: 'Read and write data to Firebase Firestore.',
    tokenLabel: 'Firebase Service Account JSON', tokenHint: '{"type":"service_account", ...}',
    tools: [{ id: 'firebase.write', name: 'Write Document', description: 'Firestore write', intentKeywords: ['firebase', 'firestore', 'write to firebase'] }],
    docsUrl: 'https://firebase.google.com/docs/firestore',
  },
  {
    id: 'mongodb', name: 'MongoDB', category: 'Database & Storage', authType: 'token',
    logo: 'https://www.mongodb.com/favicon.ico',
    description: 'Query and insert documents in MongoDB Atlas.',
    tokenLabel: 'MongoDB Connection URI', tokenHint: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
    tools: [{ id: 'mongodb.find', name: 'Find Documents', description: 'Query collection', intentKeywords: ['mongodb', 'mongo', 'find documents', 'atlas'] }],
    docsUrl: 'https://www.mongodb.com/docs/atlas/api',
  },
  {
    id: 'pinecone', name: 'Pinecone', category: 'Database & Storage', authType: 'token',
    logo: '🌲',
    description: 'Upsert and query vector embeddings in Pinecone.',
    tokenLabel: 'Pinecone API Key', tokenHint: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    tools: [{ id: 'pinecone.upsert', name: 'Upsert Vectors', description: 'Store embeddings', intentKeywords: ['pinecone', 'vector', 'embeddings', 'vector database'] }],
    docsUrl: 'https://docs.pinecone.io',
  },
  {
    id: 'supabase', name: 'Supabase', category: 'Database & Storage', authType: 'token',
    logo: 'https://supabase.com/favicon/favicon-32x32.png',
    description: 'Query and insert data into your Supabase database.',
    tokenLabel: 'Supabase URL + Anon Key', tokenHint: 'https://xxx.supabase.co|anon_key',
    tools: [
      { id: 'supabase.select', name: 'Query Table',   description: 'Fetch rows', intentKeywords: ['supabase', 'fetch', 'table', 'database', 'query'] },
      { id: 'supabase.insert', name: 'Insert Record', description: 'Add a row',  intentKeywords: ['insert', 'add record', 'new record', 'add to'] },
    ],
    docsUrl: 'https://supabase.com/docs',
  },
  {
    id: 'airtable', name: 'Airtable', category: 'Database & Storage', authType: 'token',
    logo: 'https://airtable.com/favicon/favicon-32x32.png',
    description: 'Create records in Airtable bases.',
    tokenLabel: 'Airtable Personal Token', tokenHint: 'pat_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'airtable.create_record', name: 'Create Record', description: 'Add an Airtable row', intentKeywords: ['airtable', 'create record'] }],
    docsUrl: 'https://airtable.com/developers/web/api/introduction',
  },

  // ── 🚀 Deployment ─────────────────────────────────────────────────────────────
  {
    id: 'vercel', name: 'Vercel', category: 'Deployment', authType: 'token',
    logo: 'https://vercel.com/favicon.ico',
    description: 'Deploy and manage projects on Vercel.',
    tokenLabel: 'Vercel Access Token', tokenHint: 'vercel_token_xxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'vercel.deploy', name: 'Deploy Project', description: 'Deploy to Vercel', intentKeywords: ['vercel', 'deploy to vercel', 'vercel deploy'] }],
    docsUrl: 'https://vercel.com/docs/rest-api',
  },
  {
    id: 'netlify', name: 'Netlify', category: 'Deployment', authType: 'token',
    logo: 'https://www.netlify.com/v3/img/components/logomark.png',
    description: 'Deploy web projects to Netlify instantly.',
    tokenLabel: 'Netlify Personal Token', tokenHint: 'nfp_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'netlify.deploy', name: 'Deploy Project', description: 'Ship to production', intentKeywords: ['netlify', 'deploy', 'go live'] }],
    docsUrl: 'https://docs.netlify.com',
  },

  // ── 🔗 Automation ─────────────────────────────────────────────────────────────
  {
    id: 'twilio', name: 'Twilio', category: 'Automation', authType: 'token',
    logo: 'https://www.twilio.com/favicon.ico',
    description: 'Send SMS and WhatsApp messages via Twilio.',
    tokenLabel: 'Twilio Account SID + Auth Token', tokenHint: 'ACxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    tools: [{ id: 'twilio.send_sms', name: 'Send SMS', description: 'SMS notification', intentKeywords: ['twilio', 'sms', 'text message', 'whatsapp', 'send sms'] }],
    docsUrl: 'https://www.twilio.com/docs/sms',
  },
  {
    id: 'discord', name: 'Discord', category: 'Automation', authType: 'token',
    logo: 'https://discord.com/favicon.ico',
    description: 'Send messages and alerts to Discord channels.',
    tokenLabel: 'Discord Webhook URL', tokenHint: 'https://discord.com/api/webhooks/...',
    tools: [{ id: 'discord.send_message', name: 'Send Message', description: 'Post to channel', intentKeywords: ['discord', 'send to discord', 'discord message', 'discord alert'] }],
    docsUrl: 'https://discord.com/developers/docs/resources/webhook',
  },
  {
    id: 'zapier', name: 'Zapier', category: 'Automation', authType: 'token',
    logo: 'https://zapier.com/favicon.ico',
    description: 'Trigger Zapier workflows from chat.',
    tokenLabel: 'Zapier Webhook URL', tokenHint: 'https://hooks.zapier.com/hooks/catch/...',
    tools: [{ id: 'zapier.trigger', name: 'Trigger Workflow', description: 'Run a Zap', intentKeywords: ['zapier', 'trigger workflow', 'automate'] }],
    docsUrl: 'https://zapier.com/developer',
  },
  {
    id: 'n8n', name: 'n8n', category: 'Automation', authType: 'token',
    logo: 'https://n8n.io/favicon.ico',
    description: 'Execute n8n automation workflows.',
    tokenLabel: 'n8n Webhook URL', tokenHint: 'https://your-n8n.cloud/webhook/...',
    tools: [{ id: 'n8n.run_workflow', name: 'Run Workflow', description: 'Trigger n8n flow', intentKeywords: ['n8n', 'run workflow', 'automation'] }],
    docsUrl: 'https://docs.n8n.io',
  },

  // ── 📊 Analytics ──────────────────────────────────────────────────────────────
  {
    id: 'clarity', name: 'Clarity', category: 'Analytics', authType: 'token',
    logo: 'https://clarity.microsoft.com/favicon.ico',
    description: 'Analyze user behavior with Microsoft Clarity.',
    tokenLabel: 'Clarity API Key', tokenHint: 'clarity_xxxxxxxxxxxxxxxx',
    tools: [{ id: 'clarity.analyze', name: 'Analyze Behavior', description: 'User insights', intentKeywords: ['clarity', 'user behavior', 'analytics'] }],
    docsUrl: 'https://learn.microsoft.com/en-us/clarity',
  },

  // ── 🔐 Auth ───────────────────────────────────────────────────────────────────
  {
    id: 'clerk', name: 'Clerk', category: 'Auth', authType: 'token',
    logo: 'https://clerk.com/favicon.ico',
    description: 'Manage users and authentication with Clerk.',
    tokenLabel: 'Clerk Secret Key', tokenHint: 'sk_live_... (Enter your Clerk key)',
    tools: [{ id: 'clerk.manage_user', name: 'Manage User', description: 'User operations', intentKeywords: ['clerk', 'manage user', 'auth user'] }],
    docsUrl: 'https://clerk.com/docs',
  },

  // ── 🌐 3D & Visual ────────────────────────────────────────────────────────────
  {
    id: 'threejs', name: 'Three.js', category: '3D & Visual', authType: 'public',
    logo: '🌐',
    description: 'Render 3D scenes and animations. No setup needed.',
    tools: [{ id: 'threejs.render', name: 'Render 3D Scene', description: 'Create 3D visuals', intentKeywords: ['threejs', '3d scene', 'render 3d'] }],
    docsUrl: 'https://threejs.org/docs',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getConnectorsByCategory(): Record<ConnectorCategory, ConnectorDef[]> {
  const result = {} as Record<ConnectorCategory, ConnectorDef[]>;
  for (const c of CONNECTOR_REGISTRY) {
    if (!result[c.category]) result[c.category] = [];
    result[c.category].push(c);
  }
  return result;
}

export function getConnectorById(id: string): ConnectorDef | undefined {
  return CONNECTOR_REGISTRY.find(c => c.id === id);
}

/** Returns true if the connector is considered "connected" given saved tokens */
export function isConnectorConnected(connector: ConnectorDef, tokens: Record<string, string>): boolean {
  if (connector.authType === 'public') return true;
  return !!tokens[connector.id];
}
