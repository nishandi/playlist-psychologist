// Dashboard - Load ratings from Google Sheets

async function loadUserRatings() {
    const container = document.getElementById('user-ratings-container');
    
    try {
        // Use public read URL (sheet must be set to "Anyone with link can view")
        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${window.CONFIG.SHEET_ID}/values/Sheet1?key=AIzaSyBAuhSSzBIxdFZbyWAWpmURQyD2MZC_Ptw`;
        
        console.log('📊 Fetching ratings from sheet...');
        
        const response = await fetch(sheetUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sheet fetch error:', errorText);
            throw new Error(`Failed to load ratings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Sheet data received:', data);
        
        const rows = (data.values || []).slice(1); // Skip header row
        
        if (rows.length === 0) {
            container.innerHTML = `
                <div class="no-ratings">
                    <p>📊 No user ratings yet!</p>
                    <p class="no-ratings-sub">Be the first to <a href="index.html">try the analysis</a> and rate it.</p>
                </div>
            `;
            return;
        }
        
        console.log(`Found ${rows.length} ratings`);
        
        const stats = calculateStats(rows);
        
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
                    <div class="user-stat-label">Avg Insight Novelty</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgActionability}%</div>
                    <div class="user-stat-label">Avg Actionability</div>
                </div>
            </div>
            
            <div class="recent-ratings">
                <h3>Recent Feedback (${rows.length} total)</h3>
                ${displayRecentRatings(rows.slice(0, 10))}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Failed to load ratings:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>⚠️ Could not load user ratings</p>
                <p class="error-detail">${error.message}</p>
                <p style="margin-top: 12px; font-size: 0.9em;">Check browser console (F12) for details.</p>
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
        // Mirror: 0-3 scale, Novelty: 0-2 scale, Actionability: 0-2 scale
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
    const withFeedback = recentRatings.filter(row => row[5] && row[5].trim());
    
    if (withFeedback.length === 0) {
        return '<p class="no-feedback">No written feedback yet. Ratings are being collected!</p>';
    }
    
    return withFeedback
        .map(row => {
            const timestamp = row[0];
            const feedback = row[5];
            const mirror = row[1];
            const novelty = row[2];
            const actionability = row[3];
            
            const date = new Date(timestamp);
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="feedback-item">
                    <div class="feedback-meta">
                        <span class="feedback-date">${dateStr}</span>
                        <span class="feedback-scores">
                            🪞 ${mirror}/3 | 💡 ${novelty}/2 | ✨ ${actionability}/2
                        </span>
                    </div>
                    <div class="feedback-text">"${feedback}"</div>
                </div>
            `;
        })
        .join('');
}

// Load ratings when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserRatings);
} else {
    loadUserRatings();
}

console.log('📊 Dashboard script loaded');
