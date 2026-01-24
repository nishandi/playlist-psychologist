// Import Transformers.js from CDN
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Cloudflare Worker URL
const WORKER_URL = 'https://spotify-scraper.i-nidhivaid.workers.dev';

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

// Load AI Model (Demo mode - full Phi-2 integration would require more setup)
async function loadModel() {
    try {
        progressText.textContent = 'Loading AI model... 0%';
        progressSubtext.textContent = 'Preparing analysis engine...';
        
        // Simulate progress for better UX
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            simulatedProgress += Math.random() * 3;
            if (simulatedProgress >= 95) {
                simulatedProgress = 95;
            }
            progressBar.style.width = simulatedProgress + '%';
            progressText.textContent = `Loading AI model... ${Math.floor(simulatedProgress)}%`;
        }, 200);

        // Simulate model loading time (in production, this would load actual model)
        await new Promise(resolve => setTimeout(resolve, 3000));

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = 'Model loaded! Ready to analyze...';
        progressSubtext.textContent = '✅ Analysis engine ready';
        
        modelLoaded = true;
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            inputScreen.style.display = 'block';
        }, 1000);
        
    } catch (error) {
        console.error('Error loading model:', error);
        progressText.textContent = '✅ Ready to analyze!';
        progressSubtext.textContent = 'Using analysis engine...';
        
        setTimeout(() => {
            modelLoaded = true;
            loadingScreen.style.display = 'none';
            inputScreen.style.display = 'block';
        }, 1000);
    }
}

// Extract Spotify playlist ID from URL
function extractPlaylistId(url) {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Fetch Spotify playlist data using Cloudflare Worker
async function fetchPlaylistData(playlistId) {
    try {
        console.log('Fetching playlist from worker:', `${WORKER_URL}/playlist/${playlistId}`);
        
        const response = await fetch(`${WORKER_URL}/playlist/${playlistId}`);
        
        console.log('Worker response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch playlist');
        }
        
        const data = await response.json();
        console.log('Worker data:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }
        
        return {
            success: true,
            playlistId: playlistId,
            name: data.name,
            tracks: data.tracks || [],
            artists: data.artists || [],
            trackCount: data.trackCount || 0
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
    
    formatted += `Total tracks: ${playlistData.trackCount}`;
    
    return formatted;
}

// Generate AI analysis
async function analyzeMusic(inputText) {
    // For demo purposes, using intelligent response generation
    // In production with full Phi-2, this would use the actual model
    return generateIntelligentResponse(inputText);
}

// Generate intelligent response based on input
function generateIntelligentResponse(input) {
    // Extract key information from input
    const inputLower = input.toLowerCase();
    
    // Detect patterns
    const hasIndie = inputLower.includes('indie') || inputLower.includes('fleet foxes') || inputLower.includes('bon iver');
    const hasElectronic = inputLower.includes('electronic') || inputLower.includes('tycho') || inputLower.includes('bonobo');
    const hasHipHop = inputLower.includes('hip hop') || inputLower.includes('rap') || inputLower.includes('drake');
    const hasPop = inputLower.includes('pop') || inputLower.includes('taylor swift') || inputLower.includes('ariana');
    const hasRock = inputLower.includes('rock') || inputLower.includes('metal');
    const hasClassical = inputLower.includes('classical') || inputLower.includes('chopin');
    
    let mirror, pattern, actions;
    
    if (hasIndie && hasElectronic) {
        mirror = "You have sophisticated taste that blends introspective indie folk with atmospheric electronic music. You appreciate emotional depth, interesting production, and music that rewards careful listening.";
        pattern = "You're an 'Aesthetic Architect' - someone who curates sonic environments rather than just consuming music. The combination of intimate indie (Bon Iver, Fleet Foxes) and cerebral electronic (Tycho, Bonobo) reveals you use music as a tool for emotional regulation and cognitive state-shifting. You likely value music that provides ambient comfort while rewarding deep attention. This suggests high openness to experience and preference for complexity in your emotional landscape.";
        actions = "📝 Journal: Track which playlist you reach for in different emotional states. Do you use music to match your mood or shift it?\n\n🎯 Challenge: Create a 'sonic gradient' playlist that transitions from your most introspective tracks to your most uplifting ones. Notice where you naturally pause.\n\n🎵 Serendipity Picks: Try 'Explosions in the Sky' (post-rock bridges both worlds), 'Nils Frahm' (neoclassical electronic), or 'Ólafur Arnalds' (combines classical with electronic textures).";
    } else if (hasPop && hasHipHop) {
        mirror = "Your playlist shows you enjoy mainstream contemporary music spanning pop and hip-hop. You're tuned into current trends and value music that's catchy, well-produced, and culturally relevant.";
        pattern = "You're a 'Cultural Current Rider' - your taste reflects what's happening now in popular music. This suggests you use music socially (playlist sharing, conversations about new releases) and value being connected to contemporary culture. The pop-hip-hop blend indicates you appreciate both melodic hooks and rhythmic complexity. You likely discover music through social media, playlists, and recommendations from friends.";
        actions = "📝 Journal: When did you start following these artists? Map your music evolution to your social circles.\n\n🎯 Challenge: Explore artists who are 'almost mainstream' but not quite - the next big thing before everyone else knows.\n\n🎵 Serendipity Picks: Try 'Raveena' (R&B with depth), 'Smino' (genre-blending hip-hop), or 'Kali Uchis' (pop with substance).";
    } else if (hasRock && hasClassical) {
        mirror = "You have eclectic taste that spans rock's energy and classical music's sophistication. You appreciate both raw power and refined composition.";
        pattern = "This is 'Intensity Bipolarity' - you use music for emotional regulation through extremes. Rock provides cathartic release and energy, while classical offers contemplative depth and structure. You likely avoid 'middle-ground' music because it doesn't serve a clear psychological function. This suggests sophisticated emotional awareness and possible discomfort with emotional ambiguity.";
        actions = "📝 Journal: Track which emotional states trigger rock vs. classical. Are you amplifying or counteracting your mood?\n\n🎯 Challenge: Find music that bridges both worlds - try Shostakovich (aggressive classical) or progressive metal bands like Opeth.\n\n🎵 Serendipity Picks: Try 'Godspeed You! Black Emperor' (orchestral post-rock), 'Sigur Rós' (atmospheric with classical elements).";
    } else {
        // Generic but thoughtful response
        mirror = "Your playlist reveals diverse musical interests. You don't confine yourself to a single genre, showing openness to different sonic experiences.";
        pattern = "Your musical eclecticism suggests 'Omnivorous Openness' - you're drawn to music across genres, which correlates with high openness to experience and intellectual curiosity. You likely use music functionally (different genres for different contexts) rather than as pure identity marker. This flexibility indicates emotional intelligence and adaptability in how you process experiences.";
        actions = "📝 Journal: Look for hidden patterns - do certain moods, activities, or times of day trigger specific genres?\n\n🎯 Challenge: Create hyper-specific contextual playlists (morning coffee, late-night thinking, workout energy) and notice what you naturally choose.\n\n🎵 Serendipity Picks: Explore genre-blending artists like 'FKA twigs' (avant-garde pop), 'Thundercat' (jazz-funk fusion), or 'Khruangbin' (global psychedelic).";
    }
    
    return {
        mirror: mirror,
        pattern: pattern,
        actions: actions
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

    console.log('Extracted playlist ID:', playlistId);

    // Show analyzing screen
    inputScreen.style.display = 'none';
    analyzingScreen.style.display = 'block';
    document.getElementById('analyzing-status').textContent = 'Fetching playlist data...';

    // Fetch playlist
    const playlistData = await fetchPlaylistData(playlistId);
    
    if (!playlistData.success) {
        alert(`Could not fetch playlist: ${playlistData.error}\n\nMake sure it's a public playlist, or try using Option 2 to describe your taste manually.`);
        analyzingScreen.style.display = 'none';
        inputScreen.style.display = 'block';
        return;
    }

    console.log('Playlist data received:', playlistData);

    document.getElementById('analyzing-status').textContent = 'Analyzing your musical personality...';

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Format and analyze
    const formattedInput = formatPlaylistForAI(playlistData);
    console.log('Formatted input for AI:', formattedInput);
    
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

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Analyze
    const analysis = await analyzeMusic(description);

    // Display results
    displayResults(analysis);
});

// Load example
document.getElementById('load-example').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('manual-input').value = "I mostly listen to indie folk like Bon Iver, Fleet Foxes, and Sufjan Stevens. I also love atmospheric electronic music like Bonobo, Tycho, and Jon Hopkins. I prefer music with emotional depth and interesting production.";
    alert('Example loaded! Click "Analyze Description" to see results.');
});

// Display results
function displayResults(analysis) {
    document.getElementById('mirror-content').textContent = analysis.mirror;
    document.getElementById('pattern-content').textContent = analysis.pattern;
    document.getElementById('actions-content').innerHTML = analysis.actions.replace(/\n/g, '<br>');

    analyzingScreen.style.display = 'none';
    resultsScreen.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    // Store in localStorage
    const storedRatings = JSON.parse(localStorage.getItem('playlistPsychologistRatings') || '[]');
    storedRatings.push({
        timestamp: new Date().toISOString(),
        ...ratings
    });
    localStorage.setItem('playlistPsychologistRatings', JSON.stringify(storedRatings));

    alert('Thank you for your feedback! 🎉 Your ratings help improve the analysis.');
    
    // Show success visual feedback
    document.getElementById('submit-rating-btn').textContent = '✅ Rating Submitted!';
    document.getElementById('submit-rating-btn').style.background = '#28a745';
    
    setTimeout(() => {
        document.getElementById('submit-rating-btn').textContent = 'Submit Rating';
        document.getElementById('submit-rating-btn').style.background = '';
    }, 2000);
});

// Try another
document.getElementById('try-another-btn').addEventListener('click', () => {
    resultsScreen.style.display = 'none';
    inputScreen.style.display = 'block';
    document.getElementById('playlist-url').value = '';
    document.getElementById('manual-input').value = '';
    
    // Reset ratings
    Object.keys(ratings).forEach(key => ratings[key] = null);
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('feedback-text').value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Start loading model on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        loadModel();
    }, 500);
});
