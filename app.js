// Grab the elements from your existing HTML
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results-container');

// IMPORTANT: You will need to replace this with your own free YouTube API Key
const YOUTUBE_API_KEY = AIzaSyA1i3GaH-HhO5Bqd50e2-Mfp4KCpubH4GA; 

function performSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Please enter a Katha or story to search.</p>';
        return;
    }

    // Show a loading message
    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Searching the YouTube library...</p>';

    // The official YouTube Data API URL
    // We are asking for 10 video results matching the search term
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(searchTerm)}&type=video&key=${YOUTUBE_API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; // Clear loading text

            // Check if YouTube returned an error (usually a missing/invalid API key)
            if (data.error) {
                console.error('YouTube API Error:', data.error.message);
                resultsContainer.innerHTML = `<p style="text-align:center; color: #ef4444;">API Error: ${data.error.message}</p>`;
                return;
            }

            // If no videos are found
            if (!data.items || data.items.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No stories found for that search.</p>';
                return;
            }

            // Loop through the results and build the cards
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const description = item.snippet.description.substring(0, 150) + '...';
                
                const div = document.createElement('div');
                div.className = 'episode-card'; // Reusing your dark-mode CSS class
                
                // Embed the official YouTube player instead of the MP3 player
                div.innerHTML = `
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <iframe 
                        width="100%" 
                        height="250" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="YouTube video player" 
                        style="border: none; border-radius: 12px; margin-top: 15px;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                resultsContainer.appendChild(div);
            });
        })
        .catch(error => {
            resultsContainer.innerHTML = '<p style="text-align:center; color: #ef4444;">Failed to connect to YouTube. Please try again.</p>';
            console.error('Fetch Error:', error);
        });
}

// Trigger search on button click
searchBtn.addEventListener('click', performSearch);

// Trigger search on "Enter" key press
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});
