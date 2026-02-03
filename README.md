# 🎵 Playlist Psychologist

**An AI-powered music personality analyzer that reveals hidden patterns in your listening habits**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://nishandi.github.io/playlist-psychologist/)
[![Evaluation Dashboard](https://img.shields.io/badge/evaluation-dashboard-blue)](https://nishandi.github.io/playlist-psychologist/eval-dashboard.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🔗 **Live App:** https://nishandi.github.io/playlist-psychologist/  
> 📊 **Evaluation Dashboard:** https://nishandi.github.io/playlist-psychologist/eval-dashboard.html

---

## 🌟 What Makes This Special

This isn't just another music analyzer - it's a **comprehensive AI evaluation project** demonstrating:

- 💡 **3-Layer Analysis** - Mirror (what you know) → Hidden Pattern (aha moments) → Actionable Steps
- 📊 **Rigorous Evaluation** - 100-example dataset with multi-dimensional metrics
- 🎯 **Real User Feedback** - Live rating system with public dashboard
- 🔧 **Production-Ready** - Secure API key management, error handling, real-world deployment

---

## ✨ Features

### For Users:
- **Paste Spotify Playlist** → Get personality analysis in 30 seconds
- **Mirror Layer:** Validates what you already know (builds trust)
- **Hidden Pattern Layer:** Reveals psychological insights you didn't realize
- **Actionable Steps:** Journal prompts, listening challenges, serendipity recommendations
- **Rate the Analysis:** Multi-dimensional feedback (accuracy, novelty, usefulness)

### For Technical Reviewers:
- **100-Example Evaluation Dataset:** 50 synthetic + 50 real-world examples
- **Multi-Dimensional Metrics:** Mirror accuracy (100%), Insight novelty (97.5%), Actionability (95%)
- **Live Feedback Loop:** User ratings saved to Google Sheets, displayed on public dashboard
- **Edge Case Testing:** Handles neurodivergent patterns, clinical boundaries, cultural diversity

---

## 🏆 Evaluation Results

### Overall Performance (20-example expert evaluation):

| Metric | Score | What It Measures |
|--------|-------|------------------|
| 🪞 **Mirror Accuracy** | **100%** | AI correctly understood user behavior in all cases |
| 💡 **Insight Novelty** | **97.5%** | Revealed patterns users didn't self-identify |
| ✨ **Actionability** | **95%** | Provided specific, useful recommendations |

### Performance by Difficulty:

| Difficulty | Count | Mirror | Novelty | Actions | Notes |
|------------|-------|--------|---------|---------|-------|
| **Easy** | 3 | 100% | 83% | 100% | Strong baseline performance |
| **Medium** | 12 | 100% | 100% | 96% | Excellent on realistic complexity |
| **Hard** | 5 | 100% | 100% | 90% | Maintained quality on edge cases |

### Key Findings:

✅ **Strengths:**
- Perfect mirror accuracy builds user trust
- Exceptional insight novelty (creates real value)
- Appropriate clinical boundary recognition (OCD, dementia cases)
- No neurodivergent pathologizing (validated differences)
- Cultural and identity sensitivity

⚠️ **Areas for Enhancement:**
- Slightly lower actionability on ambiguous cases (appropriate caution)
- Minor verbosity in some pattern explanations

**[View Full Evaluation Dashboard →](https://nishandi.github.io/playlist-psychologist/eval-dashboard.html)**

---

## 🎯 How It Works

### User Flow:
Paste Spotify Playlist
↓
Cloudflare Worker scrapes track/artist data
↓
Gemini 2.5 Flash analyzes patterns
↓
3-Layer Response Generated
↓
User Rates Analysis
↓
Ratings Stored & Displayed on Dashboard

### Technical Architecture:
Browser (Public)
↓ No API keys exposed
Cloudflare Worker (Secure Backend)
↓ Keys stored as secrets
Gemini API + Google Sheets API

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript
- **AI Model:** Google Gemini 2.5 Flash (via API)
- **Backend:** Cloudflare Workers (serverless)
- **Data Storage:** Google Sheets (user ratings)
- **Hosting:** GitHub Pages (free, fast CDN)
- **Scraping:** Spotify embed page parser
- **Cost:** $0 (free tiers on all services)

---

## 🔒 Security & Privacy

### What We Did Right:

✅ **API Keys Secured:** Stored in Cloudflare Worker environment variables (never in public code)  
✅ **No Data Collection:** User playlists analyzed in real-time, not stored  
✅ **Public Ratings Only:** Only anonymous ratings saved (no personal data)  
✅ **Open Source:** All code is auditable on GitHub  
✅ **Rate Limited:** API keys restricted to prevent abuse  

### Privacy Guarantees:

- Your Spotify playlist data is never stored on any server
- Analysis happens in real-time through secure worker
- Only anonymous ratings (mirror score, novelty score, feedback text) are saved
- No tracking, no analytics, no cookies

---

## 📊 Evaluation Methodology

### Dataset Construction:

**100 Total Examples:**
- **50 Synthetic:** Controlled examples testing specific patterns (monoculture fandom, genre bipolarity, nostalgia patterns, etc.)
- **50 Real-World:** Scraped from Reddit (r/Music, r/LetsTalkMusic) and Twitter for authentic user language

### Scoring Dimensions:

1. **Mirror Accuracy (0-100%):**
   - Does AI correctly reflect what user already knows?
   - Tests: Basic comprehension, genre identification, obvious patterns

2. **Insight Novelty (0-2 points):**
   - 💡 Big Aha (2pts): Reveals completely new pattern
   - 🤔 Mild (1pt): Adds some nuance
   - 😑 Nothing new (0pts): Just mirrors back

3. **Actionability (0-2 points):**
   - ✅ Highly useful (2pts): Specific artists named, clear next steps
   - 🤷 Somewhat useful (1pt): Vague but directionally helpful
   - ❌ Not useful (0pts): Generic or irrelevant

### Edge Cases Tested:

- ✅ Neurodivergent patterns (ADHD, autism, synesthesia)
- ✅ Clinical boundaries (OCD, dementia, grief)
- ✅ Disability considerations (blind, deaf, musical anhedonia)
- ✅ Cultural diversity (diaspora, non-Western music, faith-based)
- ✅ Ambiguous situations (no clear "right" answer)

**[Read Full Methodology →](https://github.com/nishandi/playlist-psychologist/blob/main/evaluation_methodology.md)**

---

## 🚀 Quick Start

### Try It Live:

1. **Visit:** https://nishandi.github.io/playlist-psychologist/
2. **Option 1:** Paste a public Spotify playlist URL
3. **Option 2:** Describe your music taste manually
4. **Wait 15-30 seconds** for AI analysis
5. **Rate the results** to contribute to the evaluation dataset

### Run Locally:

```bash
# Clone the repository
git clone https://github.com/nishandi/playlist-psychologist.git

# Open in browser
cd playlist-psychologist
open index.html
