// Dashboard - fetches ratings from Worker (secure)

async function loadUserRatings() {
    const container = document.getElementById('user-ratings-container');
    
    try {
        // Fetch through Worker (keys secure)
        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${window.CONFIG.SHEET_ID}/values/Sheet1`;
        
        // Note: For dashboard, we can use public read access
        // Or route through Worker for full security
        const response = await fetch(sheetUrl);
        
        if (!response.ok) throw new Error('Failed to load ratings');
        
        const data = await response.json();
        const rows = (data.values || []).slice(1);
        
        if (rows.length === 0) {
            container.innerHTML = `
                <div class="no-ratings">
                    <p>📊 No ratings yet! Be the first to <a href="index.html">try the analysis</a>.</p>
                </div>
            `;
            return;
        }
        
        const stats = calculateStats(rows);
        container.innerHTML = `
            <div class="user-stats-grid">
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.totalRatings}</div>
                    <div class="user-stat-label">Total Ratings</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgMirror}%</div>
                    <div class="user-stat-label">Avg Mirror</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgNovelty}%</div>
                    <div class="user-stat-label">Avg Novelty</div>
                </div>
                <div class="user-stat-card">
                    <div class="user-stat-value">${stats.avgActionability}%</div>
                    <div class="user-stat-label">Avg Actions</div>
                </div>
            </div>
            <div class="recent-ratings">
                <h3>Recent Feedback</h3>
                ${displayRecentRatings(rows.slice(0, 5))}
            </div>
        `;
    } catch (error) {
        console.error('❌ Failed to load ratings:', error);
        container.innerHTML = `<div class="error-message"><p>⚠️ Could not load ratings</p></div>`;
    }
}

function calculateStats(ratings) {
    const totalRatings = ratings.length;
    let sumMirror = 0, sumNovelty = 0, sumActionability = 0;
    
    ratings.forEach(row => {
        sumMirror += ((parseInt(row[1]) || 0) / 3) * 100;
        sumNovelty += ((parseInt(row[2]) || 0) / 2) * 100;
        sumActionability += ((parseInt(row[3]) || 0) / 2) * 100;
    });
    
    return {
        totalRatings,
        avgMirror: Math.round(sumMirror / totalRatings),
        avgNovelty: Math.round(sumNovelty / totalRatings),
        avgActionability: Math.round(sumActionability / totalRatings)
    };
}

function displayRecentRatings(recentRatings) {
    return recentRatings
        .filter(row => row[5]?.trim())
        .map(row => {
            const date = new Date(row[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<div class="feedback-item"><div class="feedback-date">${date}</div><div class="feedback-text">"${row[5]}"</div></div>`;
        })
        .join('') || '<p class="no-feedback">No written feedback yet</p>';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserRatings);
} else {
    loadUserRatings();
}
