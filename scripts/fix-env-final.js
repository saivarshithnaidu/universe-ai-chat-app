const fs = require('fs');
const path = '.env';
const dbUrl = "postgresql://neondb_owner:npg_0fZPnFIr9ets@ep-icy-sunset-a1ypou1z-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

try {
    let content = fs.readFileSync(path, 'utf8');
    if (!content.includes('DATABASE_URL')) {
        console.log("Appending DATABASE_URL...");
        fs.appendFileSync(path, `\nDATABASE_URL="${dbUrl}"\n`);
    } else {
        console.log("DATABASE_URL already exists.");
        // Optional: Replace it if it's correct? 
        // For now, assume if it exists we might have fixed it or user did. 
        // But check-env said it wasn't there.
    }
    console.log("Fixed .env");
} catch (err) {
    console.error("Error fixing .env:", err);
}
