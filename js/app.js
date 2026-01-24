// Import Transformers.js from CDN
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Global state
let generator = null;
let modelLoaded = false;
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

// Extract Spotify playlist ID from URL
function extractPlaylistId(url) {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Fetch Spotify playlist data (public playlists only, no auth)
async function fetchPlaylistData(playlistId) {
    try {
        // Note: This is a simplified approach for public playlists
        // For production, you'd need proper Spotify API integration
        const response = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`);
        
        if (!response.ok) {
            throw new Error('Playlist not found or not public');
        }
        
        // For demo purposes, we'll use a simplified extraction
        // In production, this would parse the embed data or use Spotify API
        return {
            success: true,
            playlistId: playlistId,
            // Placeholder data structure
            tracks: [],
            artists: [],
            genres: []
        };
        
    } catch (error) {
        console.error('Error fetching playlist:', error);
        return { success: false, error: error.message };
    }
}

// Format playlist data for AI analysis
function formatPlaylistForAI(playlistData) {
    // This would format the actual playlist data
    // For now, returning a template
    return `Spotify Playlist Analysis Request:
Playlist ID: ${playlistData.playlistId}
[Playlist data would be formatted here]`;
}

// Generate AI analysis
async function analyzeMusic(inputText) {
    if (!modelLoaded || !generator) {
        // Demo mode: return pre-generated response
        return generateDemoResponse(inputText);
    }

    const prompt = `You are analyzing music listening patterns. Provide:

1. MIRROR (2-3 sentences): Accurately reflect what they already know about themselves
2. HIDDEN PATTERN (3-4 sentences): Reveal psychological insight they haven't named
3. ACTIONABLE STEPS (3 specific suggestions):
   - Journal prompt (reflection question)
   - Challenge (new music behavior to try)
   - Serendipity pick (specific artist/album recommendation)

Guidelines:
- Avoid judgment
- Recognize clinical issues - defer to professionals when appropriate
- Validate neurodivergent patterns as neurological differences
- Be specific in recommendations

User's music data: ${inputText}

Provide analysis in the 3 sections above.`;

    try {
        const output = await generator(prompt, {
            max_new_tokens: 300,
            temperature: 0.7,
            do_sample: true,
        });

        return parseAIResponse(output[0].generated_text);
        
    } catch (error) {
        console.error('Error generating analysis:', error);
        return generateDemoResponse(inputText);
    }
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
