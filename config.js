// Configuration - NO API keys stored here!
// Keys are securely stored in Cloudflare Worker secrets

const CONFIG = {
    // Cloudflare Worker endpoints (acts as secure backend)
    WORKER_URL: 'https://spotify-scraper.i-nidhivaid.workers.dev',
    
    // Google Sheets ID (not sensitive - just identifies the sheet)
    SHEET_ID: '1HBA-4GzSj_6No8H8UeQ947fmiGAvczlByCaudCSj7yU',
    
    // App metadata
    APP_VERSION: '1.0.0',
    REPO_URL: 'https://github.com/nishandi/playlist-psychologist'
};

window.CONFIG = CONFIG;
