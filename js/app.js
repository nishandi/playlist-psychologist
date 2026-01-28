// Playlist Psychologist - Main Application
// Uses Gemini API for analysis + Google Sheets for ratings storage

// Wait for config to load
if (!window.CONFIG) {
    console.error('Config not loaded!');
}

// Global state
const state = {
    currentAnalysis: null,
    ratings: {
        mirror: null,
        novelty: null,
        actionability: null,
        feedback: ''
    }
};

// DOM elements
const screens = {
    loading: document.getElementById('loading-screen'),
    input: document.getElementById('input-screen'),
    analyzing: document.getElementById('analyzing-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    playlistUrl: document.getElementById('playlist-url'),
    manualInput: document.getElementById('manual-input'),
    analyzingStatus: document.getElementById('analyzing-status'),
    mirrorContent: document.getElementById('mirror-content'),
    patternContent: document.getElementById('pattern-content'),
    actionsContent: document.getElementById('actions-content'),
    feedbackText: document.getElementById('feedback-text')
};

// Initialize app
function init() {
    console.log('🎵 Playlist Psychologist initializing...');
    
    // Simulate brief loading
    setTimeout(() => {
        showScreen('input');
    }, 1500);
    
    // Setup event listeners
    setupEventListeners();
}

// Setup all event listeners
function setupEventListeners() {
    // Analyze playlist button
    document.getElementById('analyze-playlist-btn').addEventListener('click', handlePlaylistAnalysis);
    
    // Analyze manual description button
    document.getElementById('analyze-manual-btn').addEventListener('click', handleManualAnalysis);
    
    // Load example
    document.getElementById('load-example').addEventListener('click', (e) => {
        e.preventDefault();
        elements.manualInput.value = "I mostly listen to indie folk like Bon Iver, Fleet Foxes, and Sufjan Stevens. I also love atmospheric electronic music like Tycho, Bonobo, and Jon Hopkins. I prefer music with emotional depth and interesting production. I often listen while working or during long walks.";
        elements.manualInput.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', handleRatingClick);
    });
    
    // Submit rating
    document.getElementById('submit-rating-btn').addEventListener('click', handleRatingSubmit);
    
    // Try another
    document.getElementById('try-another-btn').addEventListener('click', handleTryAnother);
}

// Show specific screen
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].style.display = 'none';
    });
    
    if (screens[screenName]) {
        screens[screenName].style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Extract Spotify playlist ID from URL
function extractPlaylistId(url) {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Handle playlist analysis
async function handlePlaylistAnalysis() {
    const url = elements.playlistUrl.value.trim();
    
    if (!url) {
        alert('Please paste a Spotify playlist URL');
        return;
    }
    
    const playlistId = extractPlaylistId(url);
    
    if (!playlistId) {
        alert('Invalid Spotify playlist URL. Please paste a link like:\nhttps://open.spotify.com/playlist/...');
        return;
    }
    
    console.log('📋 Analyzing playlist:', playlistId);
    
    showScreen('analyzing');
    elements.analyzingStatus.textContent = 'Fetching playlist data from Spotify...';
    
    try {
        // Fetch playlist data from Cloudflare Worker
        const playlistData = await fetchPlaylistData(playlistId);
        
        if (!playlistData.success) {
            throw new Error(playlistData.error || 'Failed to fetch playlist');
        }
        
        console.log('✅ Playlist data received:', playlistData);
        
        elements.analyzingStatus.textContent = 'Analyzing your musical personality...';
        
        // Format data for AI
        const musicDescription = formatPlaylistForAI(playlistData);
        
        // Analyze with Gemini
        const analysis = await analyzeWithGemini(musicDescription);
        
        // Store and display results
        state.currentAnalysis = analysis;
        displayResults(analysis);
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        alert(`Analysis failed: ${error.message}\n\nPlease try:\n1. Make sure the playlist is public\n2. Try Option 2 (describe your taste manually)\n3. Check browser console for details`);
        showScreen('input');
    }
}

// Handle manual description analysis
async function handleManualAnalysis() {
    const description = elements.manualInput.value.trim();
    
    if (!description) {
        alert('Please describe your music taste');
        return;
    }
    
    console.log('✍️ Analyzing manual description');
    
    showScreen('analyzing');
    elements.analyzingStatus.textContent = 'Analyzing your musical personality...';
    
    try {
        const analysis = await analyzeWithGemini(description);
        state.currentAnalysis = analysis;
        displayResults(analysis);
    } catch (error) {
        console.error('❌ Analysis error:', error);
        alert(`Analysis failed: ${error.message}\n\nPlease try again or check your internet connection.`);
        showScreen('input');
    }
}

// Fetch playlist data from Cloudflare Worker
async function fetchPlaylistData(playlistId) {
    const workerUrl = `${window.CONFIG.WORKER_URL}/playlist/${playlistId}`;
    
    console.log('🌐 Fetching from worker:', workerUrl);
    
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
}

// Format playlist data for AI analysis
function formatPlaylistForAI(playlistData) {
    let formatted = `# Spotify Playlist Analysis\n\n`;
    formatted += `**Playlist:** ${playlistData.name}\n`;
    formatted += `**Total tracks:** ${playlistData.trackCount || 'Unknown'}\n\n`;
    
    if (playlistData.artists && playlistData.artists.length > 0) {
        formatted += `**Top Artists:** ${playlistData.artists.slice(0, 20).join(', ')}\n\n`;
    }
    
    if (playlistData.tracks && playlistData.tracks.length > 0) {
        formatted += `**Sample Tracks:** ${playlistData.tracks.slice(0, 25).join(', ')}\n\n`;
    }
    
    return formatted;
}

// Analyze with Gemini API
async function analyzeWithGemini(musicDescription) {
    const prompt = `You are analyzing music listening patterns to reveal personality insights. Provide your analysis in this exact format:

MIRROR (2-3 sentences):
[Accurately reflect what they already know about their music taste - the obvious patterns]

HIDDEN PATTERN (3-4 sentences):
[Reveal a psychological insight they haven't named - the "aha moment". Use concepts like "emotional regulation", "identity construction", "nostalgia anchoring", etc. Be specific and insightful.]

ACTIONABLE STEPS (3 specific suggestions):
- Journal: [A reflection question to explore their pattern]
- Challenge: [A specific music listening behavior to try]
- Serendipity: [Specific artist/album recommendations with reasoning]

Guidelines:
- Avoid judgment or "guilty pleasure" language
- Be specific with artist recommendations (name actual artists)
- If you detect signs of clinical issues (depression, OCD, etc.), acknowledge sensitively and suggest professional help
- Validate neurodivergent patterns as differences, not problems
- Make actionable steps concrete and doable

User's music data:
${musicDescription}

Provide your analysis now in the exact format above.`;

    const apiUrl = `${window.CONFIG.GEMINI_ENDPOINT}/${window.CONFIG.GEMINI_MODEL}:generateContent?key=${window.CONFIG.GEMINI_API_KEY}`;
    
    console.log('🤖 Calling Gemini API...');
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1024,
                topP: 0.95,
                topK: 40
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', errorData);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Gemini response received');
    
    // Extract text from response
    const text = data.candidates[0].content.parts[0].text;
    
    // Parse the structured response
    return parseGeminiResponse(text);
}

// Parse Gemini response into structured format
function parseGeminiResponse(text) {
    const sections = {
        mirror: '',
        pattern: '',
        actions: ''
    };
    
    // Extract MIRROR section
    const mirrorMatch = text.match(/MIRROR[:\s]+(.*?)(?=HIDDEN PATTERN|$)/is);
    if (mirrorMatch) {
        sections.mirror = mirrorMatch[1].trim();
    }
    
    // Extract HIDDEN PATTERN section
    const patternMatch = text.match(/HIDDEN PATTERN[:\s]+(.*?)(?=ACTIONABLE STEPS|$)/is);
    if (patternMatch) {
        sections.pattern = patternMatch[1].trim();
    }
    
    // Extract ACTIONABLE STEPS section
    const actionsMatch = text.match(/ACTIONABLE STEPS[:\s]+(.*?)$/is);
    if (actionsMatch) {
        sections.actions = actionsMatch[1].trim();
    }
    
    // Fallback if parsing fails
    if (!sections.mirror && !sections.pattern) {
        // Just split the text into rough thirds
        const lines = text.split('\n').filter(l => l.trim());
        const third = Math.floor(lines.length / 3);
        sections.mirror = lines.slice(0, third).join(' ');
        sections.pattern = lines.slice(third, third * 2).join(' ');
        sections.actions = lines.slice(third * 2).join('\n');
    }
    
    return sections;
}

// Display results
function displayResults(analysis) {
    elements.mirrorContent.textContent = analysis.mirror;
    elements.patternContent.textContent = analysis.pattern;
    elements.actionsContent.innerHTML = analysis.actions.replace(/\n/g, '<br>');
    
    // Reset ratings
    state.ratings = { mirror: null, novelty: null, actionability: null, feedback: '' };
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    elements.feedbackText.value = '';
    
    showScreen('results');
}

// Handle rating button click
function handleRatingClick(e) {
    const btn = e.currentTarget;
    const dimension = btn.dataset.dimension;
    const value = parseInt(btn.dataset.value);
    
    // Remove selected from siblings
    const siblings = btn.parentElement.querySelectorAll('.rating-btn');
    siblings.forEach(sib => sib.classList.remove('selected'));
    
    // Mark this as selected
    btn.classList.add('selected');
    
    // Store rating
    state.ratings[dimension] = value;
    
    console.log('Rating updated:', dimension, value);
}

// Handle rating submission
async function handleRatingSubmit() {
    // Validate all ratings provided
    if (state.ratings.mirror === null || state.ratings.novelty === null || state.ratings.actionability === null) {
        alert('Please rate all three dimensions before submitting.');
        return;
    }
    
    // Get feedback
    state.ratings.feedback = elements.feedbackText.value.trim();
    
    console.log('📊 Submitting rating:', state.ratings);
    
    // Calculate average
    const average = ((state.ratings.mirror / 3) * 100 + (state.ratings.novelty / 2) * 100 + (state.ratings.actionability / 2) * 100) / 3;
    
    try {
        // Save to Google Sheets
        await saveRatingToSheets({
            timestamp: new Date().toISOString(),
            mirror: state.ratings.mirror,
            novelty: state.ratings.novelty,
            actionability: state.ratings.actionability,
            average: Math.round(average),
            feedback: state.ratings.feedback
        });
        
        // Show success
        const submitBtn = document.getElementById('submit-rating-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '✅ Rating Submitted!';
        submitBtn.style.background = '#28a745';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 3000);
        
        alert('Thank you! 🎉\n\nYour rating has been recorded and will appear on the evaluation dashboard.');
        
    } catch (error) {
        console.error('❌ Failed to save rating:', error);
        alert('Rating could not be saved to the cloud, but it has been stored locally.\n\nError: ' + error.message);
    }
}

// Save rating to Google Sheets
async function saveRatingToSheets(rating) {
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${window.CONFIG.SHEET_ID}/values/${window.CONFIG.SHEET_NAME}:append?valueInputOption=USER_ENTERED&key=${window.CONFIG.SHEETS_API_KEY}`;
    
    const values = [[
        rating.timestamp,
        rating.mirror,
        rating.novelty,
        rating.actionability,
        rating.average,
        rating.feedback
    ]];
    
    console.log('💾 Saving to Google Sheets:', sheetUrl);
    
    const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: values
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sheets API error:', errorData);
        throw new Error(errorData.error?.message || `Failed to save: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Rating saved to sheet:', data);
    
    return data;
}

// Handle try another playlist
function handleTryAnother() {
    elements.playlistUrl.value = '';
    elements.manualInput.value = '';
    state.currentAnalysis = null;
    showScreen('input');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('🎵 Playlist Psychologist loaded');
