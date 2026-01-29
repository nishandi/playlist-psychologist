// Playlist Psychologist - Secure version with backend Worker

if (!window.CONFIG) {
    console.error('Config not loaded!');
}

const state = {
    currentAnalysis: null,
    ratings: { mirror: null, novelty: null, actionability: null, feedback: '' }
};

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

function init() {
    console.log('🎵 Playlist Psychologist initializing...');
    setTimeout(() => showScreen('input'), 1500);
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('analyze-playlist-btn').addEventListener('click', handlePlaylistAnalysis);
    document.getElementById('analyze-manual-btn').addEventListener('click', handleManualAnalysis);
    document.getElementById('load-example').addEventListener('click', (e) => {
        e.preventDefault();
        elements.manualInput.value = "I mostly listen to indie folk like Bon Iver, Fleet Foxes, and Sufjan Stevens. I also love atmospheric electronic music like Tycho, Bonobo, and Jon Hopkins. I prefer music with emotional depth and interesting production.";
        elements.manualInput.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', handleRatingClick);
    });
    
    document.getElementById('submit-rating-btn').addEventListener('click', handleRatingSubmit);
    document.getElementById('try-another-btn').addEventListener('click', handleTryAnother);
}

function showScreen(screenName) {
    Object.keys(screens).forEach(key => screens[key].style.display = 'none');
    if (screens[screenName]) {
        screens[screenName].style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function extractPlaylistId(url) {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function handlePlaylistAnalysis() {
    const url = elements.playlistUrl.value.trim();
    if (!url) {
        alert('Please paste a Spotify playlist URL');
        return;
    }
    
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
        alert('Invalid Spotify playlist URL');
        return;
    }
    
    showScreen('analyzing');
    elements.analyzingStatus.textContent = 'Fetching playlist data...';
    
    try {
        const playlistData = await fetchPlaylistData(playlistId);
        if (!playlistData.success) throw new Error(playlistData.error);
        
        elements.analyzingStatus.textContent = 'Analyzing your musical personality...';
        const musicDescription = formatPlaylistForAI(playlistData);
        const analysis = await analyzeWithWorker(musicDescription);
        
        state.currentAnalysis = analysis;
        displayResults(analysis);
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`Analysis failed: ${error.message}\n\nPlease try Option 2 (manual description) or check console.`);
        showScreen('input');
    }
}

async function handleManualAnalysis() {
    const description = elements.manualInput.value.trim();
    if (!description) {
        alert('Please describe your music taste');
        return;
    }
    
    showScreen('analyzing');
    elements.analyzingStatus.textContent = 'Analyzing your musical personality...';
    
    try {
        const analysis = await analyzeWithWorker(description);
        state.currentAnalysis = analysis;
        displayResults(analysis);
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`Analysis failed: ${error.message}`);
        showScreen('input');
    }
}

async function fetchPlaylistData(playlistId) {
    const response = await fetch(`${window.CONFIG.WORKER_URL}/playlist/${playlistId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
}

function formatPlaylistForAI(playlistData) {
    let formatted = `# Spotify Playlist Analysis\n\n`;
    formatted += `**Playlist:** ${playlistData.name}\n`;
    formatted += `**Total tracks:** ${playlistData.trackCount}\n\n`;
    
    if (playlistData.artists?.length > 0) {
        formatted += `**Top Artists:** ${playlistData.artists.slice(0, 20).join(', ')}\n\n`;
    }
    
    if (playlistData.tracks?.length > 0) {
        formatted += `**Sample Tracks:** ${playlistData.tracks.slice(0, 25).join(', ')}\n\n`;
    }
    
    return formatted;
}

async function analyzeWithWorker(musicDescription) {
    console.log('🤖 Calling secure Worker backend...');
    
    const response = await fetch(`${window.CONFIG.WORKER_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicDescription })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.analysis;
}

function displayResults(analysis) {
    elements.mirrorContent.textContent = analysis.mirror;
    elements.patternContent.textContent = analysis.pattern;
    elements.actionsContent.innerHTML = analysis.actions.replace(/\n/g, '<br>');
    
    state.ratings = { mirror: null, novelty: null, actionability: null, feedback: '' };
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    elements.feedbackText.value = '';
    
    showScreen('results');
}

function handleRatingClick(e) {
    const btn = e.currentTarget;
    const dimension = btn.dataset.dimension;
    const value = parseInt(btn.dataset.value);
    
    btn.parentElement.querySelectorAll('.rating-btn').forEach(sib => sib.classList.remove('selected'));
    btn.classList.add('selected');
    state.ratings[dimension] = value;
}

async function handleRatingSubmit() {
    if (state.ratings.mirror === null || state.ratings.novelty === null || state.ratings.actionability === null) {
        alert('Please rate all three dimensions');
        return;
    }
    
    state.ratings.feedback = elements.feedbackText.value.trim();
    const average = ((state.ratings.mirror / 3) * 100 + (state.ratings.novelty / 2) * 100 + (state.ratings.actionability / 2) * 100) / 3;
    
    try {
        await fetch(`${window.CONFIG.WORKER_URL}/save-rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rating: {
                    timestamp: new Date().toISOString(),
                    mirror: state.ratings.mirror,
                    novelty: state.ratings.novelty,
                    actionability: state.ratings.actionability,
                    average: Math.round(average),
                    feedback: state.ratings.feedback
                }
            })
        });
        
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
        
        alert('Thank you! 🎉\n\nYour rating has been saved.');
    } catch (error) {
        console.error('❌ Rating save failed:', error);
        alert('Rating could not be saved: ' + error.message);
    }
}

function handleTryAnother() {
    elements.playlistUrl.value = '';
    elements.manualInput.value = '';
    state.currentAnalysis = null;
    showScreen('input');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
