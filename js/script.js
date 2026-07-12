/* Jetflix — vanilla JS app */
(function () {
  "use strict";

  const cache = new Map();
  const state = {
    heroItems: [],
    heroIndex: 0,
    heroTimer: null,
    myList: JSON.parse(localStorage.getItem("jetflix_mylist") || "[]"),
    lastFocusedCard: null,
    previewTimer: null,
  };

  const FALLBACK_POSTER = (title) =>
    `data:image/svg+xml;utf8,` +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'><rect width='300' height='450' fill='#1a1a1a'/><text x='50%' y='50%' fill='#666' font-family='sans-serif' font-size='16' text-anchor='middle'>${title}</text></svg>`,
    );

  // --- OMDb fetch ---
  async function fetchMovie(title) {
    if (cache.has(title)) return cache.get(title);
    const url = `${OMDB_BASE_URL}?t=${encodeURIComponent(title)}&plot=short&apikey=${OMDB_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.Response === "False") throw new Error(data.Error || "Not found");
      cache.set(title, data);
      return data;
    } catch (e) {
      const fallback = {
        Title: title,
        Poster: "N/A",
        Year: "—",
        Genre: "Drama",
        Runtime: "—",
        imdbRating: "—",
        Plot: "Details unavailable right now.",
        Actors: "—",
        Language: "—",
        Released: "—",
        _fallback: true,
      };
      return fallback;
    }
  }

  async function searchMovies(query) {
    const url = `${OMDB_BASE_URL}?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.Search || [];
  }

  // --- Utilities ---
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function posterOf(m) {
    return m.Poster && m.Poster !== "N/A"
      ? m.Poster
      : FALLBACK_POSTER(m.Title || "Poster");
  }

  function saveList() {
    localStorage.setItem("jetflix_mylist", JSON.stringify(state.myList));
    $("#listCount").textContent = state.myList.length;
  }

  function inList(title) {
    return state.myList.some((x) => x.Title === title);
  }

  function toggleList(movie) {
    if (inList(movie.Title)) {
      state.myList = state.myList.filter((x) => x.Title !== movie.Title);
    } else {
      state.myList.push({
        Title: movie.Title,
        Poster: movie.Poster,
        Year: movie.Year,
        imdbRating: movie.imdbRating,
      });
    }
    saveList();
  }

  // --- Ripple ---
  function attachRipple(btn) {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      const s = Math.max(r.width, r.height);
      const el = document.createElement("span");
      el.className = "ripple";
      el.style.width = el.style.height = s + "px";
      el.style.left = e.clientX - r.left - s / 2 + "px";
      el.style.top = e.clientY - r.top - s / 2 + "px";
      btn.appendChild(el);
      setTimeout(() => el.remove(), 600);
    });
  }

  // --- Navbar ---
  const navbar = $("#navbar");
  const progress = $("#scrollProgress");
  const backTop = $("#backTop");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (window.scrollY / h) * 100 + "%";
    backTop.classList.toggle("show", window.scrollY > 500);
    // parallax
    const bg = $("#heroBg");
    if (bg)
      bg.style.transform = `translateY(${window.scrollY * 0.3}px) scale(1.05)`;
  });
  backTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  attachRipple(backTop);

  $("#mobileMenu").addEventListener("click", () =>
    $("#navLinks").classList.toggle("open"),
  );

  // --- Hero ---
  async function initHero() {
    const picks = [
      "Leo",
      "Manjummel Boys",
      "Interstellar",
      "Vikram",
      "Oppenheimer",
      "Premalu",
    ];
    const results = await Promise.all(picks.map(fetchMovie));
    state.heroItems = results.filter((m) => !m._fallback);
    if (!state.heroItems.length) state.heroItems = results;
    renderHero();
    renderDots();
    startHeroRotation();
  }

  function renderHero() {
    const m = state.heroItems[state.heroIndex];
    if (!m) return;
    const bg = $("#heroBg");
    const c = $("#heroContent");
    bg.style.opacity = 0;
    setTimeout(() => {
      bg.style.backgroundImage = `url("${posterOf(m)}")`;
      bg.style.opacity = 1;
    }, 300);
    c.innerHTML = `
      <h1>${m.Title}</h1>
      <div class="hero-meta">
        <span class="rating">★ ${m.imdbRating || "—"}</span>
        <span>${m.Year || ""}</span>
        <span class="pill">${m.Runtime || ""}</span>
        <span class="pill">${m.Language || ""}</span>
        <span>${m.Genre || ""}</span>
      </div>
      <p>${m.Plot || ""}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-play>▶ Play</button>
        <button class="btn btn-secondary" data-info>ⓘ More Info</button>
      </div>`;
    c.style.animation = "none";
    void c.offsetWidth;
    c.style.animation = "";
    c.querySelector("[data-info]").addEventListener("click", () =>
      openModal(m),
    );
    c.querySelector("[data-play]").addEventListener("click", () =>
      openModal(m),
    );
    c.querySelectorAll(".btn").forEach(attachRipple);
    updateDots();
  }

  function renderDots() {
    const d = $("#heroDots");
    d.innerHTML = state.heroItems
      .map(
        (_, i) => `<button data-i="${i}" aria-label="Slide ${i + 1}"></button>`,
      )
      .join("");
    d.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        state.heroIndex = +b.dataset.i;
        renderHero();
        startHeroRotation();
      }),
    );
  }
  function updateDots() {
    $$("#heroDots button").forEach((b, i) =>
      b.classList.toggle("active", i === state.heroIndex),
    );
  }
  function startHeroRotation() {
    clearInterval(state.heroTimer);
    state.heroTimer = setInterval(() => {
      state.heroIndex = (state.heroIndex + 1) % state.heroItems.length;
      renderHero();
    }, 8000);
  }

  // --- Rows ---
  function makeSkeletonRow(title) {
    const el = document.createElement("section");
    el.className = "row";
    el.innerHTML = `<div class="row-header"><h2>${title}</h2></div>
      <div class="row-scroll">${Array(8).fill('<div class="skeleton skeleton-card"></div>').join("")}</div>`;
    return el;
  }

  function makeCard(movie) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", movie.Title);
    card.innerHTML = `
      <img loading="lazy" alt="${movie.Title} poster" src="${posterOf(movie)}"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'no-poster',textContent:'${movie.Title.replace(/'/g, "")}'}))"/>
      <div class="card-info">
        <h3>${movie.Title}</h3>
        <small>★ ${movie.imdbRating || "—"} · ${movie.Year || ""}</small>
      </div>`;
    card.addEventListener("click", () => openModal(movie));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openModal(movie);
    });
    // preview hover
    card.addEventListener("mouseenter", () => {
      clearTimeout(state.previewTimer);
      state.previewTimer = setTimeout(() => showPreview(card, movie), 900);
    });
    card.addEventListener("mouseleave", () => {
      clearTimeout(state.previewTimer);
      hidePreview();
    });
    return card;
  }

  function makeContinueCard(movie, pct, remaining) {
    const card = makeCard(movie);
    card.classList.add("continue-card");
    const wrap = document.createElement("div");
    wrap.className = "progress-wrap";
    wrap.innerHTML = `<div class="progress"><i style="width:${pct}%"></i></div><small>${remaining} left</small>`;
    card.appendChild(wrap);
    return card;
  }

  async function renderRow(rowMeta) {
    const rowEl = makeSkeletonRow(rowMeta.title);
    $("#rows").appendChild(rowEl);
    const titles = [...MOVIE_COLLECTIONS[rowMeta.key]];
    if (rowMeta.reverse) titles.reverse();
    try {
      const movies = await Promise.all(titles.map(fetchMovie));
      const scroll = rowEl.querySelector(".row-scroll");
      scroll.innerHTML = "";
      movies.forEach((m) => scroll.appendChild(makeCard(m)));
    } catch (e) {
      rowEl.querySelector(".row-scroll").innerHTML =
        `<div class="row-error">Couldn't load this row. <button data-retry>Retry</button></div>`;
      rowEl.querySelector("[data-retry]").addEventListener("click", () => {
        rowEl.remove();
        renderRow(rowMeta);
      });
    }
    observeReveal(rowEl);
  }

  async function renderContinueWatching() {
    const rowEl = makeSkeletonRow("Continue Watching");
    $("#rows").appendChild(rowEl);
    const picks = ["Vikram", "Manjummel Boys", "Inception", "Leo"];
    const movies = await Promise.all(picks.map(fetchMovie));
    const scroll = rowEl.querySelector(".row-scroll");
    scroll.innerHTML = "";
    const progs = [
      { p: 34, r: "58 min" },
      { p: 71, r: "22 min" },
      { p: 12, r: "2h 10m" },
      { p: 88, r: "10 min" },
    ];
    movies.forEach((m, i) =>
      scroll.appendChild(makeContinueCard(m, progs[i].p, progs[i].r)),
    );
    observeReveal(rowEl);
  }

  async function renderMyListRow() {
    if (!state.myList.length) return;
    const rowEl = makeSkeletonRow("My List");
    $("#rows").prepend(rowEl);
    const scroll = rowEl.querySelector(".row-scroll");
    scroll.innerHTML = "";
    state.myList.forEach((m) => scroll.appendChild(makeCard(m)));
    observeReveal(rowEl);
  }

  // --- Reveal on scroll ---
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  function observeReveal(el) {
    io.observe(el);
  }

  // --- Preview hover card ---
  let previewEl;
  function showPreview(card, movie) {
    hidePreview();
    previewEl = document.createElement("div");
    previewEl.className = "preview-card";
    previewEl.innerHTML = `
      <img src="${posterOf(movie)}" alt=""/>
      <div class="preview-body">
        <h4>${movie.Title}</h4>
        <div class="preview-meta">
          <span class="rating">★ ${movie.imdbRating || "—"}</span>
          <span>${movie.Year || ""}</span>
          <span>${(movie.Genre || "").split(",")[0]}</span>
        </div>
        <button class="btn btn-accent" style="width:100%">▶ Quick Play</button>
      </div>`;
    document.body.appendChild(previewEl);
    const r = card.getBoundingClientRect();
    const pw = 320;
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(10, Math.min(window.innerWidth - pw - 10, left));
    let top = r.top - 20;
    if (top + 320 > window.innerHeight) top = r.bottom - 320;
    if (top < 80) top = 80;
    previewEl.style.left = left + "px";
    previewEl.style.top = top + "px";
    requestAnimationFrame(() => previewEl.classList.add("show"));
    previewEl
      .querySelector("button")
      .addEventListener("click", () => openModal(movie));
    previewEl.addEventListener("mouseleave", hidePreview);
  }
  function hidePreview() {
    if (previewEl) {
      previewEl.remove();
      previewEl = null;
    }
  }

  // --- Modal ---
  async function openModal(movie) {
    const full =
      movie._fallback || !movie.Actors ? await fetchMovie(movie.Title) : movie;
    const m = full;
    const c = $("#modalContent");
    c.innerHTML = `
      <button class="modal-close" aria-label="Close">✕</button>
      <div class="modal-hero"><img src="${posterOf(m)}" alt=""/></div>
      <div class="modal-body">
        <h2>${m.Title}</h2>
        <div class="modal-meta">
          <span class="rating">★ ${m.imdbRating || "—"}</span>
          <span>${m.Year || ""}</span>
          <span class="pill">${m.Runtime || "—"}</span>
          <span class="pill">${m.Rated || "NR"}</span>
          <span>${m.Language || ""}</span>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary">▶ Play</button>
          <button class="btn btn-secondary" data-add>${inList(m.Title) ? "✓ In My List" : "+ My List"}</button>
        </div>
        <p class="modal-plot">${m.Plot || ""}</p>
        <dl class="modal-info-grid">
          <div><dt>Genre</dt><dd>${m.Genre || "—"}</dd></div>
          <div><dt>Cast</dt><dd>${m.Actors || "—"}</dd></div>
          <div><dt>Released</dt><dd>${m.Released || "—"}</dd></div>
          <div><dt>Director</dt><dd>${m.Director || "—"}</dd></div>
        </dl>
      </div>`;
    c.querySelectorAll(".btn").forEach(attachRipple);
    c.querySelector(".modal-close").addEventListener("click", closeModal);
    c.querySelector("[data-add]").addEventListener("click", (e) => {
      toggleList(m);
      e.target.textContent = inList(m.Title) ? "✓ In My List" : "+ My List";
    });
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  // --- Search ---
  const searchOverlay = $("#searchOverlay");
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");
  function openSearch() {
    searchOverlay.classList.add("open");
    setTimeout(() => searchInput.focus(), 100);
  }
  function closeSearch() {
    searchOverlay.classList.remove("open");
    searchInput.value = "";
    searchResults.innerHTML = "";
  }
  $("#searchToggle").addEventListener("click", openSearch);
  $("#searchClose").addEventListener("click", closeSearch);

  let searchDebounce;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const q = searchInput.value.trim();
    if (!q) {
      searchResults.innerHTML = "";
      return;
    }
    searchResults.innerHTML = Array(8)
      .fill('<div class="skeleton skeleton-card"></div>')
      .join("");
    searchDebounce = setTimeout(async () => {
      try {
        const results = await searchMovies(q);
        if (!results.length) {
          searchResults.innerHTML = `<p style="grid-column:1/-1;color:var(--muted)">No results for "${q}"</p>`;
          return;
        }
        searchResults.innerHTML = "";
        results.slice(0, 18).forEach((r) => {
          const movie = {
            Title: r.Title,
            Poster: r.Poster,
            Year: r.Year,
            imdbRating: "—",
          };
          searchResults.appendChild(makeCard(movie));
        });
      } catch (e) {
        searchResults.innerHTML = `<p style="grid-column:1/-1;color:var(--muted)">Search failed. <button style="color:var(--primary)" onclick="this.parentElement.previousElementSibling">Try again</button></p>`;
      }
    }, 300);
  });

  // --- Keyboard ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeSearch();
      hidePreview();
    }
    if (e.key === "/" && !searchOverlay.classList.contains("open")) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const active = document.activeElement;
      if (active && active.classList.contains("card")) {
        const dir =
          e.key === "ArrowRight"
            ? "nextElementSibling"
            : "previousElementSibling";
        const next = active[dir];
        if (next && next.classList.contains("card")) {
          next.focus();
          e.preventDefault();
        }
      }
    }
  });

  // --- My List link ---
  $("#myListLink").addEventListener("click", (e) => {
    e.preventDefault();
    if (!state.myList.length) {
      alert("Your list is empty. Add movies from the modal.");
      return;
    }
    document
      .querySelector(".row .row-header h2")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // --- Init ---
  async function init() {
    saveList();
    initHero();
    await renderContinueWatching();
    for (const row of ROWS) {
      await renderRow(row);
    }
    renderMyListRow();
  }
  init();
})();
