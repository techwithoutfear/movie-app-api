const apiKey = "YOUR_API_KEY_HERE";  

const moviesDiv = document.getElementById("movies");
const sectionTitle = document.getElementById("sectionTitle");
const messageDiv = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const themeBtn = document.getElementById("themeBtn");

let currentMovies = [];
let activeIframe = null;

// LOAD
window.onload = showHome;

// HOME
async function showHome() {
  sectionTitle.innerText = "🔥 Trending Movies";
  messageDiv.innerText = "";

  const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`);
  const data = await res.json();

  currentMovies = data.results;
  renderMovies();
}

// SEARCH
async function searchMovie() {
  const query = searchInput.value.trim();

  if (!query) {
    messageDiv.innerText = "⚠️ Type a movie name!";
    moviesDiv.innerHTML = "";
    sectionTitle.innerText = "";
    return;
  }

  sectionTitle.innerText = `🔍 ${query}`;
  messageDiv.innerText = "";

  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`);
  const data = await res.json();

  if (data.results.length === 0) {
    messageDiv.innerText = "😢 No movies found!";
    moviesDiv.innerHTML = "";
    return;
  }

  currentMovies = data.results;
  renderMovies();
}

// ✅ FIXED CLEAR INPUT (NO HOME LOAD)
searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    messageDiv.innerText = "🎬 Start typing to search amazing movies...";
    moviesDiv.innerHTML = "";
    sectionTitle.innerText = "";
  }
});

// FAVORITES
function getFavorites() {
  return JSON.parse(localStorage.getItem("fav")) || [];
}

function toggleFavorite(movie) {
  let fav = getFavorites();
  const index = fav.findIndex(m => m.id === movie.id);

  if (index > -1) fav.splice(index, 1);
  else fav.push(movie);

  localStorage.setItem("fav", JSON.stringify(fav));
  renderMovies();
}

function showFavorites() {
  sectionTitle.innerText = "❤️ Favorites";

  const fav = getFavorites();

  if (fav.length === 0) {
    messageDiv.innerText = "💔 No favorites yet!";
    moviesDiv.innerHTML = "";
    return;
  }

  messageDiv.innerText = "";
  renderMovies(fav);
}

// SUGGESTIONS
function showSuggestions() {
  sectionTitle.innerText = "🧠 Smart Suggestions";

  const sorted = [...currentMovies]
    .filter(m => m.vote_average > 6)
    .sort((a, b) => b.popularity - a.popularity);

  renderMovies(sorted.slice(0, 10));
}

// 🎬 TRAILER FETCH (SMART)
async function getTrailer(movie) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=videos`);
  const data = await res.json();

  const video =
    data.videos.results.find(v => v.type === "Trailer") ||
    data.videos.results.find(v => v.type === "Teaser") ||
    data.videos.results.find(v => v.type === "Clip") ||
    data.videos.results[0];

  return video ? video.key : null;
}

// 🎬 MODAL
async function openMovieDetails(movie) {
  const modal = document.getElementById("movieModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <h2>${movie.title}</h2>
    <p>⭐ ${movie.vote_average}</p>
    <p>${movie.overview || "No description available."}</p>
  `;

  modal.style.display = "block";
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("movieModal").style.display = "none";
};

// 🎬 RENDER
async function renderMovies(movies = currentMovies) {
  moviesDiv.innerHTML = "";
  const fav = getFavorites();

  for (let movie of movies) {
    const trailer = await getTrailer(movie);
    const isFav = fav.some(m => m.id === movie.id);

    const div = document.createElement("div");
    div.className = "movie";

    div.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}">
      
      ${trailer ? `<iframe class="trailer"></iframe>` : ""}

      <div class="overlay">
        <h4>${movie.title}</h4>

        ${
          !trailer
            ? `<button class="yt-btn">▶ Trailer</button>`
            : ""
        }

        <span class="heart ${isFav ? "fav" : "not-fav"}">
          ${isFav ? "💖" : "🤍"}
        </span>
      </div>
    `;

    const iframe = div.querySelector(".trailer");

    // 🎬 HOVER PLAY
    div.addEventListener("mouseenter", () => {
      if (!iframe || !trailer) return;

      if (activeIframe && activeIframe !== iframe) {
        activeIframe.src = "";
      }

      iframe.style.display = "block";
      iframe.src = `https://www.youtube.com/embed/${trailer}?autoplay=1&mute=0`;
      activeIframe = iframe;
    });

    // 🔇 STOP
    div.addEventListener("mouseleave", () => {
      if (iframe) {
        iframe.src = "";
        iframe.style.display = "none";
      }
    });

    // ❤️ FAVORITE
    div.querySelector(".heart").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(movie);
    });

    // ▶️ YOUTUBE FALLBACK BUTTON
    const ytBtn = div.querySelector(".yt-btn");
    if (ytBtn) {
      ytBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const query = movie.title + " trailer";
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
      });
    }

    // 🎬 MODAL
    div.addEventListener("click", () => {
      openMovieDetails(movie);
    });

    moviesDiv.appendChild(div);
  }
}

// 🌗 THEME
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
};
