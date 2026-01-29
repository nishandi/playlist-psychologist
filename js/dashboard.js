// Dashboard - fetches ratings using public sheet access

async function loadUserRatings() {
    const container = document.getElementById('user-ratings-container');
    
    try {
        // Use Google Sheets public JSON endpoint (no API key needed)
        const sheetId = '1HBA-4GzSj_6No8H8UeQ947fmiGAvczlByCaudCSj7yU';
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Sheet1`;
        
        console.log('📊 Fetching user ratings from:', sheetUrl);
        
        const response = await fetch(sheetUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Google returns JSONP, need to extract JSON
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        if (!jsonMatch) {
            throw new Error('Could not parse Google Sheets response');
        }
        
        const data = JSON.parse(jsonMatch[1]);
        
        if (!data.table || !data.table.rows) {
            throw new Error('No data in sheet');
        }
        
        const rows = data.table.rows;
        
        // Skip header row if it exists (check if first row looks like header)
        let dataRows = rows;
        if (rows.length > 0 && rows[0].c) {
            const firstRow = rows[0].c.map(cell => cell?.v || '');
            // If first row contains "Timestamp", "Mirror", etc, skip it
            if (firstRow.some(val => ['timestamp', 'mirror', 'novelty'].includes(String(val).toLowerCase()))) {
                dataRows = rows.slice(1);
            }
        }
        
        if (dataRows.length === 0) {
            container.innerHTML = `
                <div class="no-ratings">
                    <p>📊 No user ratings yet!</p>
                    <p class="no-ratings-sub">Be the first to <a href="index.html">try the analysis</a> and rate it.</p>
                </div>
            `;
            return;
        }
        
        // Convert Google Sheets format to simple arrays
        const ratings = dataRows.map(row => {
            return row.c ? row.c.map(cell => cell?.v || '') : [];
        });
        
        console.log('✅ Loaded ratings:', ratings.length);
        
        // Calculate stats
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
                <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                    <strong>Troubleshooting:</strong><br>
                    1. Make sure the Google Sheet is shared as "Anyone with the link can view"<br>
                    2. Check browser console (F12) for details<br>
                    3. Sheet ID: 1HBA-4GzSj_6No8H8UeQ947fmiGAvczlByCaudCSj7yU
                </p>
            </div>
        `;
    }
}

function calculateStats(ratings) {
    if (!ratings || ratings.length === 0) {
        return { totalRatings: 0, avgMirror: 0, avgNovelty: 0, avgActionability: 0 };
    }
    
    const totalRatings = ratings.length;
    let sumMirror = 0;
    let sumNovelty = 0;
    let sumActionability = 0;
    
    ratings.forEach(row => {
        // Columns: [timestamp, mirror, novelty, actionability, average, feedback]
        const mirror = parseFloat(row[1]) || 0;
        const novelty = parseFloat(row[2]) || 0;
        const actionability = parseFloat(row[3]) || 0;
        
        // Convert to percentages
        sumMirror += (mirror / 3) * 100;
        sumNovelty += (novelty / 2) * 100;
        sumActionability += (actionability / 2) * 100;
    });
    
    return {
        totalRatings,
        avgMirror: Math.round(sumMirror / totalRatings) || 0,
        avgNovelty: Math.round(sumNovelty / totalRatings) || 0,
        avgActionability: Math.round(sumActionability / totalRatings) || 0
    };
}

function displayRecentRatings(recentRatings) {
    if (!recentRatings || recentRatings.length === 0) {
        return '<p class="no-feedback">No feedback yet</p>';
    }
    
    const feedbackItems = recentRatings
        .filter(row => row[5] && String(row[5]).trim()) // Has feedback (column 5)
        .map(row => {
            const timestamp = row[0];
            const feedback = row[5];
            
            let dateStr = 'Recent';
            try {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            } catch (e) {
                console.log('Could not parse date:', timestamp);
            }
            
            return `
                <div class="feedback-item">
                    <div class="feedback-date">${dateStr}</div>
                    <div class="feedback-text">"${feedback}"</div>
                </div>
            `;
        })
        .join('');
    
    return feedbackItems || '<p class="no-feedback">No written feedback yet</p>';
}

// Load ratings when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserRatings);
} else {
    loadUserRatings();
}

console.log('📊 Dashboard script loaded');
