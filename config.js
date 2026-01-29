// API Configuration for Playlist Psychologist
// Using Gemini 2.5 Flash (latest stable model) + Google Sheets for ratings storage

const CONFIG = {
    // Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyDImJ0mPiE4l4HtS0PPMOLTbZsX6kSwPLw',
    GEMINI_MODEL: 'gemini-2.5-flash', // Latest stable: 1M token context, 65K output, thinking capability
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    
    // Google Sheets Configuration (for storing user ratings)
    SHEETS_API_KEY: 'AIzaSyBAuhSSzBIxdFZbyWAWpmURQyD2MZC_Ptw',
    SHEET_ID: '1HBA-4GzSj_6No8H8UeQ947fmiGAvczlByCaudCSj7yU',
    SHEET_NAME: 'Sheet1', // Default sheet name
    
    // Cloudflare Worker for Spotify data
    WORKER_URL: 'https://spotify-scraper.i-nidhivaid.workers.dev',
    
    // App Metadata
    APP_VERSION: '1.0.0',
    REPO_URL: 'https://github.com/nishandi/playlist-psychologist'
};

// Make config available globally
window.CONFIG = CONFIG;
