import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { code, filename = 'main.py' } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        // Create temporary directory in project root
        const tmpDir = path.join(process.cwd(), 'tmp-scripts');
        await fs.mkdir(tmpDir, { recursive: true });

        const scriptPath = path.join(tmpDir, filename);
        await fs.writeFile(scriptPath, code);

        try {
            // Execution with 5s timeout
            const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, { timeout: 5000 });
            return NextResponse.json({ output: stdout, error: stderr });
        } catch (e: any) {
            return NextResponse.json({ 
                output: e.stdout || '', 
                error: e.stderr || e.message 
            }, { status: 200 }); // Return result even if it's an error
        } finally {
            // Optional: clean up file after run
             await fs.unlink(scriptPath).catch(() => {});
        }

    } catch (error: any) {
        console.error('Python Runner Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
