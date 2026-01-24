// Import Transformers.js from CDN
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Global state
let generator = null;
let modelLoaded = false;
// Cloudflare Worker URL
const WORKER_URL = 'https://spotify-scraper.i-nidhivaid.workers.dev';
const ratings = {
    mirror: null,
    novelty: null,
    actionability: null,
    feedback: ''
};

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const inputScreen = document.getElementById('input-screen');
const analyzingScreen = document.getElementById('analyzing-screen');
const resultsScreen = document.getElementById('results-screen');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressSubtext = document.getElementById('progress-subtext');

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
    });
});

// Trivia functionality
const triviaOptions = document.querySelectorAll('.trivia-option');
const triviaFeedback = document.querySelector('.trivia-feedback');

triviaOptions.forEach(option => {
    option.addEventListener('click', function() {
        const isCorrect = this.getAttribute('data-correct') === 'true';
        
        triviaOptions.forEach(opt => opt.style.pointerEvents = 'none');
        
        if (isCorrect) {
            this.classList.add('correct');
            triviaFeedback.innerHTML = '✅ <strong>Correct!</strong> About 50% of people experience frisson. It\'s linked to openness to experience and emotional sensitivity.';
        } else {
            this.classList.add('incorrect');
            document.querySelector('[data-correct="true"]').classList.add('correct');
            triviaFeedback.innerHTML = '❌ <strong>Not quite.</strong> The answer is 50%. Frisson is more common than you might think!';
        }
        
        triviaFeedback.style.display = 'block';
    });
});

// Load AI Model
async function loadModel() {
    try {
        progressText.textContent = 'Loading AI model... 0%';
        progressSubtext.textContent = 'Downloading Phi-2 (2.7B parameters)...';
        
        // Simulate progress for better UX (actual download happens in background)
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            simulatedProgress += Math.random() * 2;
            if (simulatedProgress >= 95) {
                simulatedProgress = 95;
            }
            progressBar.style.width = simulatedProgress + '%';
            progressText.textContent = `Loading AI model... ${Math.floor(simulatedProgress)}%`;
        }, 200);

        // Load the model (this is the actual heavy lifting)
        // Note: For demo purposes, we're using a smaller compatible model
        // Full Phi-2 integration would require ONNX conversion
        generator = await pipeline(
            'text-generation',
            'Xenova/phi-2',
            {
                quantized: true,
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        progressSubtext.textContent = `Downloading: ${percent}% (${Math.round(progress.loaded / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB)`;
                    } else if (progress.status === 'loading') {
                        progressSubtext.textContent = 'Loading model into memory...';
                    }
                }
            }
        );

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = 'Model loaded! Ready to analyze...';
        progressSubtext.textContent = '✅ Phi-2 loaded successfully';
        
        modelLoaded = true;
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            inputScreen.style.display = 'block';
        }, 1000);
        
    } catch (error) {
        console.error('Error loading model:', error);
        progressText.textContent = '⚠️ Error loading model';
        progressSubtext.textContent = 'Falling back to demo mode...';
        
        // Fallback: Use demo mode with pre-generated responses
        setTimeout(() => {
            modelLoaded = false; // Will trigger demo mode
            loadingScreen.style.display = 'none';
            inputScreen.style.display = 'block';
        }, 2000);
    }
}

// Fetch Spotify playlist data using Cloudflare Worker
async function fetchPlaylistData(playlistId, fullUrl) {
    try {
        // Call our Cloudflare Worker
        const response = await fetch(`${WORKER_URL}/playlist/${playlistId}`);
        
        if (!response.ok) {
            throw new Error('Could not fetch playlist data');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }
        
        return {
            success: true,
            playlistId: playlistId,
            name: data.name,
            tracks: data.tracks,
            artists: data.artists,
            trackCount: data.trackCount,
            fullUrl: fullUrl
        };
        
    } catch (error) {
        console.error('Error fetching playlist:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Format playlist data for AI analysis
function formatPlaylistForAI(playlistData) {
    let formatted = `Analyzing Spotify Playlist: "${playlistData.name}"\n\n`;
    
    if (playlistData.artists && playlistData.artists.length > 0) {
        formatted += `Top Artists: ${playlistData.artists.slice(0, 15).join(', ')}\n\n`;
    }
    
    if (playlistData.tracks && playlistData.tracks.length > 0) {
        formatted += `Sample Tracks: ${playlistData.tracks.slice(0, 20).join(', ')}\n\n`;
    }
    
    formatted += `Total tracks: ${playlistData.trackCount || 'Unknown'}`;
    
    return formatted;
}
// Parse AI response into structured format
function parseAIResponse(text) {
    // Simple parsing logic
    const sections = {
        mirror: '',
        pattern: '',
        actions: ''
    };

    // Try to extract sections (this is simplified)
    const mirrorMatch = text.match(/MIRROR[:\s]+(.*?)(?=HIDDEN PATTERN|PATTERN|$)/is);
    const patternMatch = text.match(/(?:HIDDEN PATTERN|PATTERN)[:\s]+(.*?)(?=ACTIONABLE|ACTIONS|$)/is);
    const actionsMatch = text.match(/(?:ACTIONABLE STEPS|ACTIONS)[:\s]+(.*?)$/is);

    if (mirrorMatch) sections.mirror = mirrorMatch[1].trim();
    if (patternMatch) sections.pattern = patternMatch[1].trim();
    if (actionsMatch) sections.actions = actionsMatch[1].trim();

    return sections;
}

// Demo mode: pre-generated response
function generateDemoResponse(input) {
    return {
        mirror: "Based on your playlist, you have eclectic taste spanning indie, electronic, and alternative genres. You gravitate toward artists with strong production value and emotional depth.",
        pattern: "You're an 'Aesthetic Architect' - you don't just listen to music, you curate sonic environments. Your playlist reveals someone who uses music as a tool for emotional regulation and cognitive state-shifting. The mix of introspective indie (Bon Iver, Fleet Foxes) and cerebral electronic (Bonobo, Tycho) suggests you value music that rewards deep listening while providing ambient comfort.",
        actions: "📝 Journal: Track which playlist you reach for in different emotional states. Do you use music to match your mood or shift it?\n\n🎯 Challenge: Create a 'sonic gradient' playlist that transitions from your most introspective tracks to your most uplifting ones. Notice where you naturally pause.\n\n🎵 Serendipity Pick: Try 'Explosions in the Sky' (post-rock) or 'Nils Frahm' (neoclassical electronic) - bridges your indie and electronic worlds with instrumental storytelling."
    };
}

// Analyze playlist button
document.getElementById('analyze-playlist-btn').addEventListener('click', async () => {
    const url = document.getElementById('playlist-url').value.trim();
    
    if (!url) {
        alert('Please paste a Spotify playlist URL');
        return;
    }

    const playlistId = extractPlaylistId(url);
    
    if (!playlistId) {
        alert('Invalid Spotify playlist URL. Please paste a link like: https://open.spotify.com/playlist/...');
        return;
    }

    // Show analyzing screen
    inputScreen.style.display = 'none';
    analyzingScreen.style.display = 'block';
    document.getElementById('analyzing-status').textContent = 'Fetching playlist data...';

    // Fetch playlist
    const playlistData = await fetchPlaylistData(playlistId);
    
    if (!playlistData.success) {
        alert('Could not fetch playlist. Make sure it\'s public and try again, or use Option 2 to describe your taste manually.');
        analyzingScreen.style.display = 'none';
        inputScreen.style.display = 'block';
        return;
    }

    document.getElementById('analyzing-status').textContent = 'Analyzing your musical personality...';

    // Format and analyze
    const formattedInput = formatPlaylistForAI(playlistData);
    const analysis = await analyzeMusic(formattedInput);

    // Display results
    displayResults(analysis);
});

// Analyze manual description button
document.getElementById('analyze-manual-btn').addEventListener('click', async () => {
    const description = document.getElementById('manual-input').value.trim();
    
    if (!description) {
        alert('Please describe your music taste');
        return;
    }

    // Show analyzing screen
    inputScreen.style.display = 'none';
    analyzingScreen.style.display = 'block';
    document.getElementById('analyzing-status').textContent = 'Analyzing your musical personality...';

    // Analyze
    const analysis = await analyzeMusic(description);

    // Display results
    displayResults(analysis);
});

// Load example
document.getElementById('load-example').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('manual-input').value = "I mostly listen to indie folk like Bon Iver, Fleet Foxes, and Sufjan Stevens. I also love atmospheric electronic music like Bonobo, Tycho, and Jon Hopkins. I prefer music with emotional depth and interesting production. I often listen while working or studying.";
    alert('Example loaded! Click "Analyze Description" to see the results.');
});

// Display results
function displayResults(analysis) {
    document.getElementById('mirror-content').textContent = analysis.mirror;
    document.getElementById('pattern-content').textContent = analysis.pattern;
    document.getElementById('actions-content').innerHTML = analysis.actions.replace(/\n/g, '<br>');

    analyzingScreen.style.display = 'none';
    resultsScreen.style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Rating buttons
document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const dimension = this.getAttribute('data-dimension');
        const value = parseInt(this.getAttribute('data-value'));
        
        // Remove active from siblings
        this.parentElement.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        
        // Mark as selected
        this.classList.add('selected');
        
        // Store rating
        ratings[dimension] = value;
    });
});

// Submit rating
document.getElementById('submit-rating-btn').addEventListener('click', () => {
    if (ratings.mirror === null || ratings.novelty === null || ratings.actionability === null) {
        alert('Please rate all three dimensions before submitting.');
        return;
    }

    ratings.feedback = document.getElementById('feedback-text').value;
    
    // Store in localStorage (demo purposes)
    const storedRatings = JSON.parse(localStorage.getItem('playlistPsychologistRatings') || '[]');
    storedRatings.push({
        timestamp: new Date().toISOString(),
        ...ratings
    });
    localStorage.setItem('playlistPsychologistRatings', JSON.stringify(storedRatings));

    alert('Thank you for your feedback! Your ratings help us improve.');
    
    // Reset for next analysis
    Object.keys(ratings).forEach(key => ratings[key] = null);
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('feedback-text').value = '';
});

// Try another
document.getElementById('try-another-btn').addEventListener('click', () => {
    resultsScreen.style.display = 'none';
    inputScreen.style.display = 'block';
    document.getElementById('playlist-url').value = '';
    document.getElementById('manual-input').value = '';
    window.scrollTo(0, 0);
});

// Start loading model on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        loadModel();
    }, 500);
});
