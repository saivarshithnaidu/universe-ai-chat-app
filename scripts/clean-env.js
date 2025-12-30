const fs = require('fs');
const path = '.env';

try {
    const rawBuffer = fs.readFileSync(path);
    let content = rawBuffer.toString('utf8');

    // Check for UTF-16 (basic check)
    if (content.includes('\0')) {
        console.log("Detected null bytes, assuming UTF-16/UCS-2. rewriting...");
        content = rawBuffer.toString('utf16le'); // Try LE first
    }

    // Clean up content
    const lines = content.split(/\r?\n/);
    const cleanLines = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.includes('undefined')); // Remove accidental undefineds

    const newContent = cleanLines.join('\n');

    fs.writeFileSync(path, newContent, { encoding: 'utf8' });
    console.log("Cleaned .env file (UTF-8)");
    console.log("Keys found:", cleanLines.map(l => l.split('=')[0]));

} catch (err) {
    console.error("Error cleaning .env:", err);
}
