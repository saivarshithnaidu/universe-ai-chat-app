import { CONNECTOR_REGISTRY, routeToConnector, executeSimulatedTool, getConnectorById, isConnectorConnected } from './connectors';
import { executeMCPTool } from './registry';
import { handleGeminiAgent } from '../gemini';

export type ToolResult = {
  type: 'tool' | 'error' | 'auth_required';
  tool: string;
  connector: string;
  status: 'success' | 'error' | 'busy';
  text: string;
  data?: any;
  message?: string;
};

// ─── 1. REGEX FAST PATH ──────────────────────────────────────────────────────
function detectToolRegex(input: string) {
  // Supabase Insert
  if (/add|insert|create|new.*(record|candidate|profile|user)/i.test(input)) {
    return { toolId: 'supabase.insert', connectorId: 'supabase' };
  }
  // Supabase Select
  if (/show|get|list|fetch|find.*(records|data|candidates|profiles)/i.test(input)) {
    return { toolId: 'supabase.select', connectorId: 'supabase' };
  }
  // Web Search
  if (/search|find|lookup|who is|what is/i.test(input)) {
    return { toolId: 'web_search', connectorId: 'web' };
  }
  
  // Registry-based auto-routing (from connectors.ts)
  const autoRoute = routeToConnector(input);
  if (autoRoute) return { toolId: autoRoute.toolId, connectorId: autoRoute.connectorId };

  return null;
}

// ─── 2. AI INTELLIGENT FALLBACK ──────────────────────────────────────────────
async function decideToolWithAI(input: string, enabledConnectorIds: string[]): Promise<{ toolId: string; connectorId: string } | null> {
  const activeConnectors = CONNECTOR_REGISTRY.filter(c => enabledConnectorIds.includes(c.id));
  
  const prompt = `
    You are a strict tool selector for UniverseAI.
    User Input: "${input}"

    Available Connectors & Tools:
    ${JSON.stringify(activeConnectors.map(c => ({ id: c.id, name: c.name, tools: c.tools })))}

    RULES:
    1. Return ONLY valid JSON: { "toolId": "name", "connectorId": "id" }
    2. If no tool matches, return: { "toolId": "none", "connectorId": "none" }
    3. Do NOT explain. Do NOT return text. ONLY JSON.
  `;

  try {
    const response = await handleGeminiAgent([{ role: 'user', content: prompt }], "You are a JSON-only tool router.");
    
    if (response.status !== 'success') {
      console.warn("[Engine] AI Decision failed:", response.text);
      return null;
    }

    // Strip markdown backticks if present
    const cleanJson = response.text.replace(/```json|```/g, '').trim();
    const decision = JSON.parse(cleanJson);
    
    if (decision.toolId && decision.toolId !== 'none' && decision.connectorId && decision.connectorId !== 'none') {
      return decision;
    }
  } catch (e) {
    console.error("[Engine] AI Decision Error:", e);
  }
  return null;
}

// ─── 3. VALIDATION & EXECUTION ENGINE ─────────────────────────────────────────
export async function processHybridTool(
  input: string, 
  { enabledConnectorIds, tokens, userId }: { enabledConnectorIds: string[]; tokens: Record<string, string>; userId: string }
): Promise<ToolResult | null> {
  
  // STEP 1: Regex Detection (Fast)
  let route = detectToolRegex(input);
  
  // STEP 2: AI Fallback (Smart)
  if (!route) {
    console.log("[Engine] Regex missed. Trying AI fallback...");
    route = await decideToolWithAI(input, enabledConnectorIds);
  }

  if (!route) return null;

  // STEP 3: Safety Validation
  const { toolId, connectorId } = route;
  const connector = getConnectorById(connectorId);

  // Unknown connector (not in registry) — skip unless it's web/supabase builtin
  if (!connector && connectorId !== 'web' && connectorId !== 'supabase') return null;

  // Public connectors are always connected, skip the enabled check
  const isPublic = connector?.authType === 'public';

  // Is connector enabled by user toggle?
  if (!isPublic && !enabledConnectorIds.includes(connectorId)) {
    return {
      type: 'error',
      tool: toolId,
      connector: connectorId,
      status: 'error',
      text: `**${connector?.name || connectorId}** is toggled OFF — enable it in the [+] menu to use this tool.`,
    };
  }

  // Is connector actually connected (has token / oauth / is public)?
  if (connector && !isConnectorConnected(connector, tokens)) {
    return {
      type: 'error',
      tool: toolId,
      connector: connectorId,
      status: 'error',
      text: `**${connector.name}** is not connected yet. Go to the **Connectors** tab → click **${
        connector.authType === 'oauth' ? 'Connect via OAuth' : 'Add Token'
      }**.`,
    };
  }

  // STEP 4: Execution
  console.log(`[Engine] Executing ${toolId} via ${connectorId}...`);

  // Path A: Real MCP Tools (Supabase, Web Search)
  if (connectorId === 'supabase' || connectorId === 'web') {
    const result = await executeMCPTool(
      toolId,
      { prompt: input, query: input, table: 'candidate_profiles' },
      { tokens, userId }
    );
    
    return {
      type: 'tool',
      tool: toolId,
      connector: connectorId,
      status: result.status as any,
      text: result.text,
      data: result.data,
    };
  }

  // Path B: Simulated Tools (Rest of Registry)
  const simResult = executeSimulatedTool(toolId, input);
  return {
    type: 'tool',
    tool: toolId,
    connector: connectorId,
    status: simResult.status as any,
    text: simResult.message,
    data: simResult.data,
  };
}
