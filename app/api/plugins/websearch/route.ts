import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[WEB SEARCH API] Querying Serper for: "${query}"`);

        const SERPER_KEY = process.env.SERPER_API_KEY || "85c8893963msh114488fd2269p165319jsn4401802954a1"; // Fallback or placeholder
        
        const response = await fetch("https://google.serper.dev/search", {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Serper API Error: ${err}`);
        }

        const data = await response.json();
        
        // Return top 5 results: title, link, snippet
        const results = (data.organic || []).slice(0, 5).map((res: any) => ({
            title: res.title,
            link: res.link,
            snippet: res.snippet
        }));

        if (results.length === 0) {
            return NextResponse.json({ text: `I couldn't find any web results for: "${query}".` });
        }

        // Format as a text block for the UI
        let formattedText = `HEADING: WEB SEARCH RESULTS FOR "${query.toUpperCase()}"\n\n`;
        results.forEach((res: any, index: number) => {
            formattedText += `Step ${index + 1}: ${res.title}\n`;
            formattedText += `- Snippet: ${res.snippet}\n`;
            formattedText += `- Visit: [${res.link}](${res.link})\n\n`;
        });

        formattedText += `SEPARATOR\nNote: Real-time data provided by Serper API Engine.`;

        return NextResponse.json({ 
            text: formattedText,
            results: results
        });

    } catch (error: any) {
        console.error("[WEB SEARCH PLUGIN ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
