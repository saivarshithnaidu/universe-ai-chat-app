const fs = require('fs');
const path = '.env';

try {
    const buffer = fs.readFileSync(path);
    console.log("File size:", buffer.length);
    console.log("First 20 bytes:", buffer.slice(0, 20).toString('hex'));

    const content = fs.readFileSync(path, 'utf8');
    console.log("Content start:", content.substring(0, 200).replace(/\n/g, '\\n'));

    // Check for common keys
    const keys = ['DATABASE_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];
    const found = keys.filter(k => content.includes(k));
    console.log("Found keys:", found);

} catch (err) {
    console.error("Error reading .env:", err);
}
