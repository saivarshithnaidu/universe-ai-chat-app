import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { role, location, experience } = await req.json();

        if (!role) {
            return NextResponse.json({ error: "Role is required" }, { status: 400 });
        }

        // Build JSearch Query
        const searchQuery = `${role} ${location || ''} ${experience ? experience + ' years experience' : ''}`.trim();
        
        console.log(`[JOB SEARCH API] Querying JSearch for: "${searchQuery}"`);

        const RAPID_KEY = process.env.RAPID_API_KEY || "fb3e3715bfmsh443685600d89269p165319jsn4401802954a1"; // Fallback or placeholder
        const RAPID_HOST = "jsearch.p.rapidapi.com";

        const response = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1&page=1`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPID_KEY,
                'X-RapidAPI-Host': RAPID_HOST
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`JSearch API Error: ${err}`);
        }

        const data = await response.json();
        const rawJobs = data.data || [];

        // Return top 5 jobs: title, company, location, apply link
        const filteredJobs = rawJobs.slice(0, 5).map((job: any) => ({
            title: job.job_title,
            company: job.employer_name,
            location: `${job.job_city || ''} ${job.job_country || ''}`.trim() || job.job_location || "Remote",
            apply_link: job.job_apply_link,
            posted_at: job.job_posted_at_datetime_utc,
            type: job.job_employment_type
        }));

        // Format as a text block for the current ResponseRenderer (since it likes strings)
        // Or we can return structured JSON and update the frontend.
        // The requirements say "Display jobs clearly", so I'll return a formatted string that fits the current UI logic.
        
        if (filteredJobs.length === 0) {
            return NextResponse.json({ text: `I couldn't find any current ${role} openings in ${location || 'that location'}. Try adjusting your search!` });
        }

        let formattedText = `HEADING: RECOMMENDED ${role.toUpperCase()} OPENINGS\n\n`;
        filteredJobs.forEach((job: any, index: number) => {
            formattedText += `Step ${index + 1}: ${job.title} at ${job.company}\n`;
            formattedText += `- Location: ${job.location}\n`;
            if (job.type) formattedText += `- Type: ${job.type}\n`;
            formattedText += `- Apply: [Click Here to Apply](${job.apply_link})\n\n`;
        });

        formattedText += `SEPARATOR\nNote: These are real-time listings from JSearch API.`;

        return NextResponse.json({ 
            text: formattedText,
            jobs: filteredJobs // Keep raw data just in case
        });

    } catch (error: any) {
        console.error("[JOB SEARCH PLUGIN ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
