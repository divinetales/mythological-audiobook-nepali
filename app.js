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

    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Searching the library...</p>';

    // The Magic Fix: Added "&videoEmbeddable=true" so we never get blocked videos!
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&videoEmbeddable=true&q=${encodeURIComponent(searchTerm)}&type=video&key=${YOUTUBE_API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; 

            if (data.error || !data.items || data.items.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No valid stories found. Try another search.</p>';
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
                        <span id="time-${videoId}" class="time-display">0:00</span>
                    </div>

                    <div id="yt-${videoId}" class="hidden-yt"></div>
                `;
                resultsContainer.appendChild(div);
            });

            // After writing the HTML, attach the YouTube API to our hidden divs
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                audioPlayers[videoId] = new YT.Player(`yt-${videoId}`, {
                    height: '0', 
                    width: '0',
                    videoId: videoId,
                    playerVars: { 'autoplay': 0, 'controls': 0 }
                });

                // Update the timer every second
                setInterval(() => updateTime(videoId), 1000);
            });
        })
        .catch(error => console.error('Fetch Error:', error));
}

// --- Custom Player Controls ---

// Play / Pause Function
window.togglePlay = function(videoId) {
    const player = audioPlayers[videoId];
    const btn = document.getElementById(`play-btn-${videoId}`);
    
    // Check if the player is currently playing (State 1)
    if (player.getPlayerState() === 1) {
        player.pauseVideo();
        btn.innerText = "▶ Play";
        btn.style.backgroundColor = "#3b82f6"; // Blue
    } else {
        player.playVideo();
        btn.innerText = "⏸ Pause";
        btn.style.backgroundColor = "#10b981"; // Green when playing
    }
};

// Fast Forward (Playback Speed) Function
window.changeSpeed = function(videoId, btnElement) {
    const player = audioPlayers[videoId];
    let currentRate = player.getPlaybackRate();
    
    // Cycle through speeds: 1x -> 1.5x -> 2x -> 1x
    let newRate = currentRate === 1 ? 1.5 : (currentRate === 1.5 ? 2 : 1);
    
    player.setPlaybackRate(newRate);
    btnElement.innerText = newRate + "x Speed";
};

// Update the Timer Function
window.updateTime = function(videoId) {
    const player = audioPlayers[videoId];
    // Make sure the player is loaded before trying to get the time
    if (player && typeof player.getCurrentTime === 'function') {
        const time = Math.floor(player.getCurrentTime());
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        // Formats seconds to always have two digits (e.g., 5:09 instead of 5:9)
        document.getElementById(`time-${videoId}`).innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// Event Listeners for the Search Bar
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
