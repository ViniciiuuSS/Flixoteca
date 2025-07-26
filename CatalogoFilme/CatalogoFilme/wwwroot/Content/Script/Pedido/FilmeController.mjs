import { Filme } from "./FilmeDao.mjs";

const filmeDao = new Filme();

window._init = async () => {
    filmeDao.progress();
    const apiKey = '8bf5b7a08b045cedf975646ad90ca17e';
    const baseImageUrl = 'https://image.tmdb.org/t/p/w300';
    const maxMovies = 20;
    const backendUrl = 'https://localhost:7094/Filme/';
    const placeHolderImg = '/Img/not-foudImg-white.png';

    let originalMovies = [];
    let isLoading = false, isFilter = false;
    let debounceTimer;

    async function fetchRandomMovies(forceRefresh = false) {
        NProgress.start();
        try {
            let cachedMovies = [];
            if (!forceRefresh) {
                const cacheResponse = await fetch(`${backendUrl}`);
                if (cacheResponse.ok) {
                    cachedMovies = await cacheResponse.json();
                } else {
                    console.warn(`fetchRandomMovies: Cache fetch failed with status ${cacheResponse.status}`);
                }
            }

            if (!apiKey.trim()) {
                if (cachedMovies.length === 0) {
                    document.getElementById('movies').innerHTML = '';
                    return;
                }
                const moviesToDisplay = shuffleArray([...cachedMovies]).slice(0, maxMovies);
                originalMovies = moviesToDisplay;
                displayMovies(moviesToDisplay);
                if (typeof configuraAmbiente === 'function') {
                    configuraAmbiente();
                }
                return;
            }

            const cachedIds = new Set(cachedMovies.map(movie => movie.id));
            const newMovies = new Set();
            const maxPages = 10;
            const usedPages = new Set();

            while (newMovies.size < maxMovies && usedPages.size < maxPages) {
                const randomPage = Math.floor(Math.random() * 500) + 1;
                if (usedPages.has(randomPage)) continue;
                usedPages.add(randomPage);

                const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&page=${randomPage}&sort_by=popularity.desc`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erro na requisição TMDb: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();

                for (const movie of data.results) {
                    if (!cachedIds.has(movie.id) && newMovies.size < maxMovies) {
                        newMovies.add({
                            id: movie.id,
                            title: movie.title,
                            release_date: movie.release_date,
                            overview: movie.overview,
                            poster_path: movie.poster_path,
                            vote_average: movie.vote_average,
                            vote_count: movie.vote_count
                        });
                        cachedIds.add(movie.id);
                    }
                    if (newMovies.size >= maxMovies) break;
                }
            }

            const newMoviesArray = Array.from(newMovies);
            if (newMoviesArray.length > 0) {
                await fetch(`${backendUrl}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMoviesArray)
                });
            }

            const allMovies = [...cachedMovies, ...newMoviesArray];
            const moviesToDisplay = shuffleArray([...allMovies]).slice(0, maxMovies);
            originalMovies = moviesToDisplay;
            displayMovies(moviesToDisplay);
            if (typeof configuraAmbiente === 'function') {
                configuraAmbiente();
            }
        } catch (err) {
            console.error('fetchRandomMovies: Error:', err.message);
            document.getElementById('movies').innerHTML = '';
        } finally {
            NProgress.done();
        }
    }

    async function loadMoreMovies() {
        if (isLoading || isFilter) {
            return;
        }
        isLoading = true;
        NProgress.start();
        try {
            const cacheResponse = await fetch(`${backendUrl}`);
            const cachedMovies = cacheResponse.ok ? await cacheResponse.json() : [];
            const cachedIds = new Set(cachedMovies.map(movie => movie.id));
            const currentIds = new Set(
                Array.from(document.querySelectorAll('.cardFilme'))
                    .map(card => {
                        const id = parseInt(card.dataset.id);
                        if (isNaN(id)) {
                            console.warn(`loadMoreMovies: Invalid dataset.id on card: ${card.outerHTML}`);
                            return null;
                        }
                        return id;
                    })
                    .filter(id => id !== null)
            );

            if (!apiKey.trim()) {
                const availableMovies = cachedMovies.filter(m => !currentIds.has(m.id));
                if (availableMovies.length === 0) {
                    return;
                }
                const moviesToDisplay = shuffleArray([...availableMovies]).slice(0, maxMovies);
                appendMovies(moviesToDisplay);
                return;
            }

            const newMovies = new Set();
            const maxPages = 10;
            const usedPages = new Set();

            while (newMovies.size < maxMovies && usedPages.size < maxPages) {
                const randomPage = Math.floor(Math.random() * 500) + 1;
                if (usedPages.has(randomPage)) continue;
                usedPages.add(randomPage);

                const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&page=${randomPage}&sort_by=popularity.desc`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erro na requisição TMDb: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();

                for (const movie of data.results) {
                    if (!cachedIds.has(movie.id) && !currentIds.has(movie.id) && newMovies.size < maxMovies) {
                        newMovies.add({
                            id: movie.id,
                            title: movie.title,
                            release_date: movie.release_date,
                            overview: movie.overview,
                            poster_path: movie.poster_path,
                            vote_average: movie.vote_average,
                            vote_count: movie.vote_count
                        });
                        currentIds.add(movie.id);
                    }
                    if (newMovies.size >= maxMovies) break;
                }
            }

            const newMoviesArray = Array.from(newMovies);
            if (newMoviesArray.length > 0) {
                await fetch(`${backendUrl}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMoviesArray)
                });
                appendMovies(newMoviesArray);
            }
        } catch (err) {
            console.error('loadMoreMovies: Error:', err.message);
        } finally {
            NProgress.done();
            isLoading = false;
        }
    }

    function appendMovies(movies) {
        const moviesDiv = document.getElementById('movies');
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'cardFilme bg-white p-4 rounded shadow hover:shadow-lg';
            movieCard.dataset.id = movie.id;
            const img = document.createElement('img');
            img.src = movie.poster_path ? baseImageUrl + movie.poster_path : placeHolderImg;
            img.alt = movie.title;
            img.loading = 'lazy';
            img.className = '';
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            img.addEventListener('error', () => {
                img.src = placeHolderImg;
                img.classList.add('loaded');
            });
            movieCard.appendChild(img);

            if (movie.vote_average) {
                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'flex items-center mt-2';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('w-4', 'h-4', 'text-yellow-300', 'me-1');
                svg.setAttribute('aria-hidden', 'true');
                svg.setAttribute('fill', 'currentColor');
                svg.setAttribute('viewBox', '0 0 22 20');
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z');
                svg.appendChild(path);
                ratingDiv.appendChild(svg);
                const ratingP = document.createElement('p');
                ratingP.className = 'ms-2 text-sm font-bold text-gray-600';
                ratingP.textContent = parseInt(movie.vote_average).toFixed(2);
                ratingDiv.appendChild(ratingP);
                const separator = document.createElement('span');
                separator.className = 'w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400';
                ratingDiv.appendChild(separator);
                const reviewsLink = document.createElement('h3');
                reviewsLink.className = 'text-sm font-medium text-gray-600';
                reviewsLink.textContent = movie.vote_count + ' reviews';
                ratingDiv.appendChild(reviewsLink);
                movieCard.appendChild(ratingDiv);
            }

            const h3 = document.createElement('h3');
            h3.className = 'titleFilme text-lg font-semibold mt-2';
            h3.textContent = movie.title;
            movieCard.appendChild(h3);

            const pDate = document.createElement('p');
            pDate.className = 'text-sm text-gray-600';
            pDate.textContent = `Lan\u00E7amento: ${formatDate(movie.release_date)}`;
            movieCard.appendChild(pDate);

            const pOverview = document.createElement('p');
            pOverview.className = 'text-sm';
            pOverview.textContent = movie.overview ? movie.overview.substring(0, 100) + '...' : 'Sinopse n\u00E3o dispon\u00EDvel.';
            movieCard.appendChild(pOverview);

            moviesDiv.appendChild(movieCard);
        });
    }

    function displayMovies(movies) {
        const moviesDiv = document.getElementById('movies');
        if (movies.length === 0) {
            return;
        }
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'cardFilme bg-white p-4 rounded shadow hover:shadow-lg';
            movieCard.dataset.id = movie.id;
            const img = document.createElement('img');
            img.src = movie.poster_path ? baseImageUrl + movie.poster_path : placeHolderImg;
            img.alt = movie.title;
            img.loading = 'lazy';
            img.className = '';
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            img.addEventListener('error', () => {
                console.warn(`displayMovies: Image error for ${movie.title}: ${img.src}`);
                img.src = placeHolderImg;
                img.classList.add('loaded');
            });
            movieCard.appendChild(img);

            if (movie.vote_average) {
                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'flex items-center mt-2';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('w-4', 'h-4', 'text-yellow-300', 'me-1');
                svg.setAttribute('aria-hidden', 'true');
                svg.setAttribute('fill', 'currentColor');
                svg.setAttribute('viewBox', '0 0 22 20');
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z');
                svg.appendChild(path);
                ratingDiv.appendChild(svg);
                const ratingP = document.createElement('p');
                ratingP.className = 'ms-2 text-sm font-bold text-gray-600';
                ratingP.textContent = parseInt(movie.vote_average).toFixed(2);
                ratingDiv.appendChild(ratingP);
                const separator = document.createElement('span');
                separator.className = 'w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400';
                ratingDiv.appendChild(separator);
                const reviewsLink = document.createElement('h3');
                reviewsLink.className = 'text-sm font-medium text-gray-600';
                reviewsLink.textContent = movie.vote_count + ' reviews';
                ratingDiv.appendChild(reviewsLink);
                movieCard.appendChild(ratingDiv);
            }

            const h3 = document.createElement('h3');
            h3.className = 'titleFilme text-lg font-semibold mt-2';
            h3.textContent = movie.title;
            movieCard.appendChild(h3);

            const pDate = document.createElement('p');
            pDate.className = 'text-sm text-gray-600';
            pDate.textContent = `Lan\u00E7amento: ${formatDate(movie.release_date)}`;
            movieCard.appendChild(pDate);

            const pOverview = document.createElement('p');
            pOverview.className = 'text-sm';
            pOverview.textContent = movie.overview ? movie.overview.substring(0, 100) + '...' : 'Sinopse n\u00E3o dispon\u00EDvel.';
            movieCard.appendChild(pOverview);

            moviesDiv.appendChild(movieCard);
        });
    }

    async function configurarPesquisa() {
        const input = document.getElementById('Filtro');
        if (!input) return;

        let debounceTimer;

        input.addEventListener('input', async function () {
            clearTimeout(debounceTimer);
            const filter = input.value.trim().toLowerCase();

            debounceTimer = setTimeout(async () => {
                const moviesDiv = document.getElementById('movies');
                if (!filter) {
                    isFilter = false;
                    displayMovies(originalMovies);
                    return;
                }

                if (filter.length < 4) {
                    return;
                }
                isFilter = true;
                filmeDao.progress();
                try {
                    const cards = document.querySelectorAll('.cardFilme');
                    let found = false;
                    cards.forEach(card => {
                        const title = card.querySelector('.titleFilme').textContent.toLowerCase();
                        const shouldShow = title.includes(filter);
                        card.style.display = shouldShow ? '' : 'none';
                        if (shouldShow) found = true;
                    });

                    if (found) return;

                    const cacheResponse = await fetch(`${backendUrl}search?query=${encodeURIComponent(filter)}`);
                    if (cacheResponse.ok) {
                        const cacheMovies = await cacheResponse.json();
                        if (cacheMovies.length > 0) {
                            const moviesToDisplay = shuffleArray([...cacheMovies]).slice(0, maxMovies);
                            displayMovies(moviesToDisplay);
                            return;
                        }
                    }

                    if (!apiKey.trim()) {
                        moviesDiv.innerHTML = '';
                        return;
                    }

                    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(filter)}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Erro na requisição TMDb: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();

                    const newMovies = data.results.map(movie => ({
                        id: movie.id,
                        title: movie.title,
                        release_date: movie.release_date,
                        overview: movie.overview,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        vote_count: movie.vote_count
                    }));

                    if (newMovies.length > 0) {
                        await fetch(`${backendUrl}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newMovies)
                        });
                        const moviesToDisplay = shuffleArray([...newMovies]).slice(0, maxMovies);
                        displayMovies(moviesToDisplay);
                    } else {
                        moviesDiv.innerHTML = '';
                    }
                } catch (err) {
                    console.error('configurarPesquisa: Error:', err.message);
                    moviesDiv.innerHTML = '';
                } finally {
                    NProgress.done();
                }
            }, 300);
        });

        document.addEventListener('keydown', function (event) {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                elFoco(input);
            }
        });
    }

    function configuraAmbiente() {
        const refreshCacheButton = document.getElementById('refreshCache');
        if (refreshCacheButton) {
            refreshCacheButton.addEventListener('click', () => fetchRandomMovies(true));
        } else {
            console.warn('configuraAmbiente: refreshCache button not found');
        }
        configurarPesquisa();
        window.addEventListener('scroll', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const scrollPosition = window.innerHeight + window.scrollY;
                const threshold = document.body.offsetHeight - 400;
                if (scrollPosition >= threshold && !isLoading && !isFilter) {
                    loadMoreMovies();
                }
            }, 100);
        });
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/D';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function elFoco(elemento) {
        if (!elemento) return;
        elemento.focus();
        const offset = elemento.getBoundingClientRect().top + window.scrollY;
        const alturaTela = window.innerHeight;
        window.scrollTo({
            top: offset - alturaTela / 2 + elemento.offsetHeight / 2,
            behavior: "smooth"
        });
    }

    fetchRandomMovies(false);
}

_init();