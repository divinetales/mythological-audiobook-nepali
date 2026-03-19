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

// We will store our hidden audio engines here
const audioPlayers = {}; 

function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Searching sacred texts...</p>';

    // The Invisible Fence: Strict Content Restrictor
    const strictSearchTerm = searchTerm + ' Nepali katha OR puran OR dharmik OR mahabharat OR swasthani';
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&videoEmbeddable=true&relevanceLanguage=ne&q=${encodeURIComponent(strictSearchTerm)}&type=video&key=${YOUTUBE_API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; 

            if (data.error || !data.items || data.items.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No matching Nepali mythological stories found. Try another search.</p>';
                return;
            }

            // Build the Custom HTML for each result
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const description = item.snippet.description.substring(0, 130) + '...';
                
                const div = document.createElement('div');
                div.className = 'episode-card'; 
                
                div.innerHTML = `
                    <h3>${title}</h3>
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

            // Attach the YouTube API to our hidden divs
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                audioPlayers[videoId] = new YT.Player(`yt-${videoId}`, {
                    height: '0', 
                    width: '0',
                    videoId: videoId,
                    playerVars: { 
                        'autoplay': 0, 
                        'controls': 0 
                    }
                });

                // Update the timer and slider every second
                setInterval(() => updateTime(videoId), 1000);
            });
        })
        .catch(error => console.error('Fetch Error:', error));
}

// --- Custom Player Controls ---

// Play / Pause Function with Solo Play Rule
window.togglePlay = function(videoId) {
    const player = audioPlayers[videoId];
    const btn = document.getElementById(`play-btn-${videoId}`);
    
    // Pause all other players
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
    
    // Play or Pause the clicked track
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

// Fast Forward (Playback Speed)
window.changeSpeed = function(videoId, btnElement) {
    const player = audioPlayers[videoId];
    if (player && typeof player.getPlaybackRate === 'function') {
        let currentRate = player.getPlaybackRate();
        let newRate = currentRate === 1 ? 1.5 : (currentRate === 1.5 ? 2 : 1);
        player.setPlaybackRate(newRate);
        btnElement.innerText = newRate + "x Speed";
    }
};

// NEW: Seek Function (When user drags the slider)
window.seekAudio = function(videoId, percentage) {
    const player = audioPlayers[videoId];
    if (player && typeof player.getDuration === 'function') {
        const duration = player.getDuration();
        const seekToTime = (percentage / 100) * duration;
        player.seekTo(seekToTime, true);
    }
};

// UPGRADED: Update Timer and Slider Position
window.updateTime = function(videoId) {
    const player = audioPlayers[videoId];
    
    if (player && typeof player.getCurrentTime === 'function' && typeof player.getDuration === 'function') {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (duration > 0) {
            // Helper function to format seconds into M:SS
            const formatTime = (time) => {
                const mins = Math.floor(time / 60);
                const secs = Math.floor(time % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Update the text timer (e.g., "1:30 / 45:00")
            document.getElementById(`time-${videoId}`).innerText = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            
            // Move the slider handle (but only if the user isn't currently dragging it)
            const seekBar = document.getElementById(`seek-${videoId}`);
            if (document.activeElement !== seekBar) {
                seekBar.value = (currentTime / duration) * 100;
            }
        }
    }
};

// Event Listeners for the Search Bar
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
