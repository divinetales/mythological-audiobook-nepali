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

function performSearch() {
    const rawSearchTerm = searchInput.value.trim().toLowerCase();
    if (!rawSearchTerm) return;

    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Analyzing your request and searching sacred texts...</p>';

    // --- SMART QUERY ANALYZER ---
    
    // 1. Detect if the user explicitly wants music
    const wantsMusic = /bhajan|song|geet|aarti|dhun/i.test(rawSearchTerm);
    
    // 2. Detect if the user is looking for a specific chapter/episode
    // This looks for words like "chapter", "adhyaya", "part", or any numbers
    const wantsSpecificChapter = /chapter|adhyaya|part|episode|\d+/i.test(rawSearchTerm);

    // Build the base strict term
    let strictSearchTerm = rawSearchTerm + ' Nepali (katha OR puran OR pravachan OR dharmik)';

    // 3. Exclude music and short clips (status/tiktok) UNLESS they asked for music
    if (!wantsMusic) {
        strictSearchTerm += ' -bhajan -song -geet -aarti -status -short -tiktok -reels -promo';
    }

    // 4. Determine Sorting Order
    // If they want a specific chapter, use 'relevance' to find that exact number.
    // If they want a general story, use 'viewCount' to get the most popular creators.
    const sortOrder = wantsSpecificChapter ? 'relevance' : 'viewCount';

    // Build the final API URL
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&videoEmbeddable=true&relevanceLanguage=ne&order=${sortOrder}&q=${encodeURIComponent(strictSearchTerm)}&type=video&key=${YOUTUBE_API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; 

            if (data.error || !data.items || data.items.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No exact matches found. Try checking the Search Guide for tips!</p>';
                return;
            }

            // Build the Custom HTML
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const channelTitle = item.snippet.channelTitle; // Grabbing the creator's name!
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
            data.items.forEach(item => {
                const videoId = item.id.videoId;
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
