// Simulate loading progress
let progress = 0;
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const loadingScreen = document.getElementById('loading-screen');
const analysisScreen = document.getElementById('analysis-screen');
const deviceWarning = document.getElementById('device-warning');

// Detect slow device (simplified check)
function isSlowDevice() {
    return navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
}

// Show device warning if needed
if (isSlowDevice()) {
    deviceWarning.style.display = 'block';
}

// Simulate model loading (in real implementation, this would be actual TinyLlama loading)
function simulateLoading() {
    const interval = setInterval(() => {
        progress += Math.random() * 3;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(showAnalysisScreen, 500);
        }
        
        progressBar.style.width = progress + '%';
        progressText.textContent = `Loading AI model... ${Math.floor(progress)}%`;
    }, 200);
}

// Show analysis screen after loading
function showAnalysisScreen() {
    loadingScreen.style.display = 'none';
    analysisScreen.style.display = 'block';
}

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Remove active class from all
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked
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
        
        // Disable all options
        triviaOptions.forEach(opt => opt.style.pointerEvents = 'none');
        
        // Show result
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

// Start loading simulation on page load
window.addEventListener('load', () => {
    setTimeout(simulateLoading, 500);
});

// Placeholder analyze function (will be replaced with real AI later)
document.getElementById('analyze-button').addEventListener('click', () => {
    const input = document.getElementById('playlist-input').value;
    const results = document.getElementById('results');
    const output = document.getElementById('analysis-output');
    
    if (input.trim()) {
        output.innerHTML = `
            <div style="padding: 20px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
                <p><strong>🎯 MIRROR (What you know):</strong><br>
                You have eclectic taste spanning multiple genres and eras.</p>
                
                <p style="margin-top: 15px;"><strong>💡 HIDDEN PATTERN (Aha moment):</strong><br>
                Your playlist reveals an "Emotional Archaeologist" pattern - you use music to excavate and process specific memories tied to life transitions.</p>
                
                <p style="margin-top: 15px;"><strong>✨ ACTIONABLE STEPS:</strong><br>
                • Journal: What life chapter does each playlist represent?<br>
                • Challenge: Listen to a genre you avoided during a difficult period<br>
                • Serendipity pick: Try "Explosions in the Sky" - instrumental post-rock for emotional processing</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 10px;">
                <p><strong>📊 Rate this analysis:</strong></p>
                <div style="margin-top: 15px;">
                    <p>Mirror accuracy: <span style="font-size: 1.5em;">😍😊😐😞</span></p>
                    <p>Insight novelty: <span style="font-size: 1.5em;">💡🤔😑</span></p>
                    <p>Actionability: <span style="font-size: 1.5em;">✅🤷❌</span></p>
                </div>
            </div>
        `;
        results.style.display = 'block';
    } else {
        alert('Please paste some music data first!');
    }
});
