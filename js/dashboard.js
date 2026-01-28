// Dashboard Logic - Fetches and displays user ratings

async function loadUserRatings() {
    const container = document.getElementById('user-ratings-container');
    
    try {
        // Fetch ratings from Google Sheets
        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${window.CONFIG.SHEET_ID}/values/${window.CONFIG.SHEET_NAME}?key=${window.CONFIG.SHEETS_API_KEY}`;
        
        console.log('📊 Fetching user ratings...');
        
        const response = await fetch(sheetUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ratings: ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.values || [];
        
        // Skip header row
        const ratings = rows.slice(1);
        
        if (ratings.length === 0) {
            container.innerHTML = `
                <div class="no-ratings">
                    <p>📊 No user ratings yet!</p>
                    <p class="no-ratings-sub">Be the first to <a href="index.html">try the analysis</a> and rate it.</p>
                </div>
            `;
            return;
        }
        
        // Calculate aggregate stats
        const stats = calculateStats(ratings);
        
        // Display stats
        container.innerHTML = `
            <div class="user-stats-grid">
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.totalRatings}</div>
                    <div class="user-stat-label">Total Ratings</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgMirror}%</div>
                    <div class="user-stat-label">Avg Mirror Accuracy</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgNovelty}%</div>
                    <div class="user-stat-label">Avg Novelty</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgActionability}%</div>
                    <div class="user-stat-label">Avg Actionability</div>
                </div>
            </div>
            
            <div class="recent-ratings">
                <h3>Recent Feedback</h3>
                ${displayRecentRatings(ratings.slice(0, 5))}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Failed to load ratings:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>⚠️ Could not load user ratings</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
    }
}

function calculateStats(ratings) {
    const totalRatings = ratings.length;
    
    let sumMirror = 0;
    let sumNovelty = 0;
    let sumActionability = 0;
    
    ratings.forEach(row => {
        const mirror = parseInt(row[1]) || 0; // Column B
        const novelty = parseInt(row[2]) || 0; // Column C
        const actionability = parseInt(row[3]) || 0; // Column D
        
        // Convert to percentages
        sumMirror += (mirror / 3) * 100;
        sumNovelty += (novelty / 2) * 100;
        sumActionability += (actionability / 2) * 100;
    });
    
    return {
        totalRatings,
        avgMirror: Math.round(sumMirror / totalRatings),
        avgNovelty: Math.round(sumNovelty / totalRatings),
        avgActionability: Math.round(sumActionability / totalRatings)
    };
}

function displayRecentRatings(recentRatings) {
    if (recentRatings.length === 0) {
        return '<p class="no-feedback">No feedback yet</p>';
    }
    
    return recentRatings
        .filter(row => row[5] && row[5].trim()) // Has feedback (Column F)
        .map(row => {
            const timestamp = row[0];
            const feedback = row[5];
            const date = new Date(timestamp);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return `
                <div class="feedback-item">
                    <div class="feedback-date">${dateStr}</div>
                    <div class="feedback-text">"${feedback}"</div>
                </div>
            `;
        })
        .join('') || '<p class="no-feedback">No written feedback yet</p>';
}

// Load ratings when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserRatings);
} else {
    loadUserRatings();
}
