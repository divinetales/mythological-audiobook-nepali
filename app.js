// Grab the elements from the HTML
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results-container');

// Replace this URL with the actual RSS feed of the Nepali audiobook creator
const rssFeedUrl = 'https://audioboom.com/channels/4953619.rss'; 
const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;

function performSearch() {
    // Get what the user typed and make it lowercase for easy matching
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Show a loading message
    resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">Searching sacred texts...</p>';

    // Fetch the data from the RSS feed
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; // Clear the loading text
            
            // Filter the episodes based on the search term
            const filteredEpisodes = data.items.filter(episode => 
                episode.title.toLowerCase().includes(searchTerm) || 
                episode.description.toLowerCase().includes(searchTerm)
            );

            // If no results match
            if (filteredEpisodes.length === 0) {
                resultsContainer.innerHTML = '<p style="text-align:center; color: #94a3b8;">No kathas found for that search term.</p>';
                return;
            }

            // Loop through the matched episodes and create the HTML for each
            filteredEpisodes.forEach(episode => {
                const div = document.createElement('div');
                div.className = 'episode-card';
                
                // Clean HTML tags from the description for a cleaner look
                const cleanDescription = episode.description.replace(/<[^>]*>?/gm, '').substring(0, 150);

                div.innerHTML = `
                    <h3>${episode.title}</h3>
                    <p>${cleanDescription}...</p>
                    <audio controls class="audio-player">
                        <source src="${episode.enclosure.link}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                    <a href="${episode.enclosure.link}" target="_blank" download class="download-link">
                        ↓ Download MP3
                    </a>
                `;
                resultsContainer.appendChild(div);
            });
        })
        .catch(error => {
            resultsContainer.innerHTML = '<p style="text-align:center; color: #ef4444;">Error loading the audio feed. Please try again later.</p>';
            console.error('Error:', error);
        });
}

// Run the search when the button is clicked
searchBtn.addEventListener('click', performSearch);

// Also run the search if the user presses the "Enter" key inside the input box
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});
