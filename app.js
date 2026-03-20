// 1. Load the YouTube IFrame API asynchronously
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. Setup Variables
const YOUTUBE_API_KEY = 'AIzaSyA1i3GaH-HhO5Bqd50e2-Mfp4KCpubH4GA'; // <-- PASTE YOUR KEY HERE
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results-container');
const audioPlayers = {}; 

// --- HELPER: Convert YouTube Time (PT1H5M30S) to Total Seconds ---
function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return (hours * 3600) + (minutes * 60) + seconds;
}

function performSearch() {
    const rawSearchTerm = searchInput.value.trim().toLowerCase();
    if (!rawSearchTerm) return;

    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Analyzing duration and finding the best long-format stories...</p>';

    // --- SMART QUERY (CLEANED UP) ---
    const wantsMusic = /bhajan|song|geet|aarti|dhun/i.test(rawSearchTerm);
    const wantsSpecificChapter = /chapter|adhyaya|part|episode|\d+/i.test(rawSearchTerm);

    // Keep the search clean so YouTube gives us the best matches
    let cleanSearchTerm = rawSearchTerm + ' Nepali (katha OR puran OR pravachan OR dharmik)';
    if (!wantsMusic) { cleanSearchTerm += ' -bhajan -song'; } // Only excluding music now

    const sortOrder = wantsSpecificChapter ? 'relevance' : 'viewCount';

    // STEP 1: Fetch 50 results (Max allowed)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&videoEmbeddable=true&relevanceLanguage=ne&order=${sortOrder}&q=${encodeURIComponent(cleanSearchTerm)}&type=video&key=${YOUTUBE_API_KEY}`;

    fetch(searchUrl)
        .then(response => response.json())
        .then(searchData => {
            if (searchData.error || !searchData.items || searchData.items.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No results found. Try adjusting your search.</p>';
                return;
            }

            // Extract the 50 Video IDs
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');

            // STEP 2: Ask YouTube for the exact lengths of these 50 videos
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

            return fetch(detailsUrl);
        })
        .then(response => response ? response.json() : null)
        .then(detailsData => {
            if (!detailsData || !detailsData.items) return;

            resultsContainer.innerHTML = ''; 

            // STEP 3: The Strict 5-Minute Filter
            // Only keep videos where the duration is >= 300 seconds (5 minutes)
            const longVideos = detailsData.items.filter(video => {
                const durationInSeconds = parseDuration(video.contentDetails.duration);
                return durationInSeconds >= 300; 
            });

            // Take the top 10 from the remaining long videos
            const finalVideos = longVideos.slice(0, 10);

            if (finalVideos.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Found matches, but none were longer than 5 minutes. Try another search.</p>';
                return;
            }

            // Build the Custom HTML
            finalVideos.forEach(item => {
                const videoId = item.id; // Note: In the /videos endpoint, the ID is direct
                const title = item.snippet.title;
                const channelTitle = item.snippet.channelTitle; 
                const description = item.snippet.description.substring(0, 130) + '...';
                
                const div = document.createElement('div');
                div.className = 'episode-card'; 
                
                div.innerHTML = `
                    <h3>${title}</h3>
                    <p style="color: #3b82f6; font-size: 0.85rem; margin-top: -10px; margin-bottom: 10px;">👤 By: ${channelTitle}</p>
                    <p>${description}</p>
                    
                    <div class="custom-audio-player">
                        <button onclick="togglePlay('${videoId}')" id="play-btn-${videoId}" class="audio-btn">▶ Play</button>
                        <button onclick="changeSpeed('${videoId}', this)" class="audio-btn speed-btn">1x Speed</button>
                        <span id="time-${videoId}" class="time-display">0:00 / 0:00</span>
                        <input type="range" id="seek-${videoId}" class="seek-bar" value="0" min="0" max="100" step="0.1" oninput="seekAudio('${videoId}', this.value)">
                    </div>

                    <div id="yt-${videoId}" class="hidden-yt"></div>
                `;
                resultsContainer.appendChild(div);
            });

            // Attach YouTube Engine
            finalVideos.forEach(item => {
                const videoId = item.id;
                audioPlayers[videoId] = new YT.Player(`yt-${videoId}`, {
                    height: '0', 
                    width: '0',
                    videoId: videoId,
                    playerVars: { 'autoplay': 0, 'controls': 0 }
                });
                setInterval(() => updateTime(videoId), 1000);
            });
        })
        .catch(error => console.error('Fetch Error:', error));
}

// --- Player Controls (Play, Speed, Seek, Time) ---
window.togglePlay = function(videoId) {
    const player = audioPlayers[videoId];
    const btn = document.getElementById(`play-btn-${videoId}`);
    
    // Solo Play: Pause others
    Object.keys(audioPlayers).forEach(id => {
        if (id !== videoId) {
            const otherPlayer = audioPlayers[id];
            const otherBtn = document.getElementById(`play-btn-${id}`);
            if (otherPlayer && typeof otherPlayer.getPlayerState === 'function') {
                const state = otherPlayer.getPlayerState();
                if (state === 1 || state === 3) {
                    otherPlayer.pauseVideo();
                    if (otherBtn) {
                        otherBtn.innerText = "▶ Play";
                        otherBtn.style.backgroundColor = "#3b82f6"; 
                    }
                }
            }
        }
    });
    
    // Play/Pause current
    if (player && typeof player.getPlayerState === 'function') {
        if (player.getPlayerState() === 1) {
            player.pauseVideo();
            btn.innerText = "▶ Play";
            btn.style.backgroundColor = "#3b82f6";
        } else {
            player.playVideo();
            btn.innerText = "⏸ Pause";
            btn.style.backgroundColor = "#10b981";
        }
    }
};

window.changeSpeed = function(videoId, btnElement) {
    const player = audioPlayers[videoId];
    if (player && typeof player.getPlaybackRate === 'function') {
        let currentRate = player.getPlaybackRate();
        let newRate = currentRate === 1 ? 1.5 : (currentRate === 1.5 ? 2 : 1);
        player.setPlaybackRate(newRate);
        btnElement.innerText = newRate + "x Speed";
    }
};

window.seekAudio = function(videoId, percentage) {
    const player = audioPlayers[videoId];
    if (player && typeof player.getDuration === 'function') {
        const duration = player.getDuration();
        const seekToTime = (percentage / 100) * duration;
        player.seekTo(seekToTime, true);
    }
};

window.updateTime = function(videoId) {
    const player = audioPlayers[videoId];
    if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0) {
            const formatTime = (time) => {
                const mins = Math.floor(time / 60);
                const secs = Math.floor(time % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            document.getElementById(`time-${videoId}`).innerText = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            const seekBar = document.getElementById(`seek-${videoId}`);
            if (document.activeElement !== seekBar) {
                seekBar.value = (currentTime / duration) * 100;
            }
        }
    }
};

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
