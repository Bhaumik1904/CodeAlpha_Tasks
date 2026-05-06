/**
 * Gallery — script.js
 * Apple-style premium image gallery
 * Features: filtering, lightbox, dark mode, favorites, load more,
 *           keyboard nav, skeleton loading, fullscreen, download, view toggle
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. DATA — Image catalogue
   ═══════════════════════════════════════════════════════════ */
const IMAGES = [
  {
    id: 1,
    src: 'images/nature_mountains.png',
    title: 'Mountain Peaks',
    description: 'Snow-capped peaks bathed in golden-hour light.',
    category: 'nature',
  },
  {
    id: 2,
    src: 'images/nature_forest.png',
    title: 'Forest Canopy',
    description: 'Sunbeams piercing through a dense tropical rainforest.',
    category: 'nature',
  },
  {
    id: 3,
    src: 'images/nature_ocean.png',
    title: 'Ocean Serenity',
    description: 'Long-exposure waves on a pristine sandy shore.',
    category: 'nature',
  },
  {
    id: 4,
    src: 'images/tech_workspace.png',
    title: 'Clean Workspace',
    description: 'Minimalist MacBook setup with soft ambient lighting.',
    category: 'tech',
  },
  {
    id: 5,
    src: 'images/tech_circuit.png',
    title: 'Circuit Neon',
    description: 'Abstract futuristic circuit board with neon blue light.',
    category: 'tech',
  },
  {
    id: 6,
    src: 'images/tech_phone.png',
    title: 'Sleek Device',
    description: 'Product-style smartphone photography on dark reflective surface.',
    category: 'tech',
  },
  {
    id: 7,
    src: 'images/minimal_coffee.png',
    title: 'Morning Ritual',
    description: 'White ceramic cup on marble — a quiet moment.',
    category: 'minimal',
  },
  {
    id: 8,
    src: 'images/minimal_flower.png',
    title: 'Botanical Study',
    description: 'Dried flower on white — Japanese negative space.',
    category: 'minimal',
  },
  {
    id: 9,
    src: 'images/minimal_geometric.png',
    title: 'Pastel Forms',
    description: 'Geometric soft shapes with a Scandinavian feel.',
    category: 'minimal',
  },
  {
    id: 10,
    src: 'images/urban_night.png',
    title: 'Night City',
    description: 'Cinematic skyline with rain-soaked bokeh reflections.',
    category: 'urban',
  },
  {
    id: 11,
    src: 'images/urban_alley.png',
    title: 'Foggy Alley',
    description: 'Warm lantern glow on a cobblestone European street.',
    category: 'urban',
  },
  {
    id: 12,
    src: 'images/urban_aerial.png',
    title: 'Aerial Mosaic',
    description: 'Drone view of colourful city rooftops in geometric patterns.',
    category: 'urban',
  },
];

/* ═══════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════ */
const state = {
  currentFilter: 'all',      // active category filter
  showingFavorites: false,   // favorites-only mode
  favorites: new Set(),      // Set of image IDs
  lightboxIndex: -1,         // currently open image index (in filteredList)
  filteredList: [],          // currently visible image objects
  visibleCount: 8,           // how many cards are rendered (Load More)
  isDark: false,             // dark mode flag
  isFullscreen: false,       // fullscreen flag
  preloadCache: {},          // { src: HTMLImageElement } preloaded images
};

/* ═══════════════════════════════════════════════════════════
   3. DOM REFERENCES
   ═══════════════════════════════════════════════════════════ */
const $ = (id) => document.getElementById(id);
const DOM = {
  body:           document.body,
  grid:           $('gallery-grid'),
  resultsCount:   $('results-count'),
  emptyState:     $('empty-state'),
  loadMoreWrap:   $('load-more-wrap'),
  loadMoreBtn:    $('load-more-btn'),
  filterBtns:     document.querySelectorAll('.filter-btn'),
  themeToggle:    $('theme-toggle'),
  favBtn:         $('show-favorites-btn'),
  backToAll:      $('back-to-all'),
  viewGrid:       $('view-grid'),
  viewMasonry:    $('view-masonry'),
  // Lightbox
  lightbox:       $('lightbox'),
  lbBackdrop:     $('lightbox-backdrop'),
  lbImage:        $('lb-image'),
  lbSkeleton:     $('lb-skeleton'),
  lbTitle:        $('lb-title'),
  lbDesc:         $('lb-desc'),
  lbCategory:     $('lb-category'),
  lbClose:        $('lb-close'),
  lbPrev:         $('lb-prev'),
  lbNext:         $('lb-next'),
  lbCounter:      $('lb-counter'),
  lbFavBtn:       $('lb-fav-btn'),
  lbDownloadBtn:  $('lb-download-btn'),
  lbFullscreenBtn:$('lb-fullscreen-btn'),
};

/* ═══════════════════════════════════════════════════════════
   4. UTILITY HELPERS
   ═══════════════════════════════════════════════════════════ */

/** Capitalise first letter */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Preload an image, returns a Promise */
function preloadImage(src) {
  if (state.preloadCache[src]) return Promise.resolve(state.preloadCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      state.preloadCache[src] = img;
      resolve(img);
    };
    img.src = src;
  });
}

/** Save favorites to localStorage */
function persistFavorites() {
  localStorage.setItem('gallery_favorites', JSON.stringify([...state.favorites]));
}

/** Load favorites from localStorage */
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('gallery_favorites') || '[]');
    state.favorites = new Set(saved);
  } catch (_) {
    state.favorites = new Set();
  }
}

/** Load dark mode preference */
function loadTheme() {
  const saved = localStorage.getItem('gallery_theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyTheme(true);
  }
}

function applyTheme(dark) {
  state.isDark = dark;
  DOM.body.classList.toggle('dark-mode', dark);
  localStorage.setItem('gallery_theme', dark ? 'dark' : 'light');
}

/* ═══════════════════════════════════════════════════════════
   5. BUILD FILTERED LIST
   ═══════════════════════════════════════════════════════════ */
function buildFilteredList() {
  let list = IMAGES;

  // Category filter
  if (state.currentFilter !== 'all') {
    list = list.filter((img) => img.category === state.currentFilter);
  }

  // Favorites filter
  if (state.showingFavorites) {
    list = list.filter((img) => state.favorites.has(img.id));
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter((img) =>
      img.title.toLowerCase().includes(q) ||
      img.description.toLowerCase().includes(q) ||
      img.category.toLowerCase().includes(q)
    );
  }

  state.filteredList = list;
}

/* ═══════════════════════════════════════════════════════════
   6. RENDER GRID
   ═══════════════════════════════════════════════════════════ */
function renderGrid(resetVisible = false) {
  buildFilteredList();

  if (resetVisible) state.visibleCount = 8;

  const toShow = state.filteredList.slice(0, state.visibleCount);
  const total  = state.filteredList.length;

  // Update results count
  DOM.resultsCount.textContent = `${total} photo${total !== 1 ? 's' : ''}`;

  // Show/hide empty state
  if (total === 0) {
    DOM.grid.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
    DOM.loadMoreWrap.classList.add('hidden');
    return;
  }

  DOM.emptyState.classList.add('hidden');

  // Show/hide "Load More"
  DOM.loadMoreWrap.classList.toggle('hidden', toShow.length >= total);

  // Build card HTML
  DOM.grid.innerHTML = toShow.map((img) => buildCardHTML(img)).join('');

  // Animate cards in (staggered)
  const cards = DOM.grid.querySelectorAll('.gallery-card');
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('card-visible');
    }, i * 50);
  });

  // Attach card events
  attachCardEvents();

  // Lazy-load images
  initLazyLoad();
}

/* ─── Build single card HTML ─────────────────────────────── */
function buildCardHTML(img) {
  const favClass = state.favorites.has(img.id) ? 'favorited' : '';
  const favFill  = state.favorites.has(img.id) ? 'style="fill:currentColor"' : '';
  return `
    <article class="gallery-card" role="listitem"
             data-id="${img.id}" tabindex="0"
             aria-label="${img.title}">
      <div class="card-img-wrap" data-img-wrap>
        <img
          class="card-img"
          data-src="${img.src}"
          src=""
          alt="${img.title}"
          loading="lazy"
        />
        <!-- Hover overlay -->
        <div class="card-overlay">
          <span class="overlay-title">${img.title}</span>
          <div class="overlay-actions">
            <button class="overlay-icon-btn card-open-lb" title="View" aria-label="Open ${img.title} in viewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="overlay-icon-btn card-fav-overlay ${favClass}" title="Favourite" aria-label="Favourite ${img.title}" aria-pressed="${state.favorites.has(img.id)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ${favFill}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <footer class="card-footer">
        <div class="card-meta">
          <p class="card-title">${img.title}</p>
          <p class="card-category">${cap(img.category)}</p>
        </div>
        <button class="card-fav-btn ${favClass}"
                title="Favourite" aria-label="Favourite ${img.title}" aria-pressed="${state.favorites.has(img.id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ${favFill}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </footer>
    </article>
  `;
}

/* ═══════════════════════════════════════════════════════════
   7. LAZY LOAD
   ═══════════════════════════════════════════════════════════ */
function initLazyLoad() {
  const images = DOM.grid.querySelectorAll('.card-img[data-src]');
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all immediately
    images.forEach(loadCardImage);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadCardImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '100px' });

  images.forEach((img) => observer.observe(img));
}

function loadCardImage(imgEl) {
  const src = imgEl.dataset.src;
  if (!src) return;
  imgEl.src = src;
  imgEl.onload = () => {
    imgEl.classList.add('img-loaded');
    imgEl.closest('[data-img-wrap]').classList.add('loaded');
  };
  imgEl.onerror = () => {
    imgEl.closest('[data-img-wrap]').classList.add('loaded'); // remove shimmer even on error
  };
}

/* ═══════════════════════════════════════════════════════════
   8. CARD EVENTS
   ═══════════════════════════════════════════════════════════ */
function attachCardEvents() {
  DOM.grid.querySelectorAll('.gallery-card').forEach((card) => {
    const id = Number(card.dataset.id);

    // Click on card or "View" overlay → open lightbox
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-fav-btn') || e.target.closest('.card-fav-overlay')) return;
      openLightbox(id);
    });

    // Keyboard: Enter / Space
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(id);
      }
    });

    // Footer fav button
    const favBtn = card.querySelector('.card-fav-btn');
    if (favBtn) favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(id); });

    // Overlay fav button
    const overlayFav = card.querySelector('.card-fav-overlay');
    if (overlayFav) overlayFav.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(id); });
  });
}

/* ═══════════════════════════════════════════════════════════
   9. FAVORITES LOGIC
   ═══════════════════════════════════════════════════════════ */
function toggleFav(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  persistFavorites();
  updateFavHeader();

  // If in favorites mode, re-render (may remove card)
  if (state.showingFavorites) {
    renderGrid(true);
    return;
  }

  // Otherwise just update the card UI in-place
  const card = DOM.grid.querySelector(`.gallery-card[data-id="${id}"]`);
  if (card) {
    const isFav = state.favorites.has(id);
    [card.querySelector('.card-fav-btn'), card.querySelector('.card-fav-overlay')].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('favorited', isFav);
      btn.setAttribute('aria-pressed', String(isFav));
      const path = btn.querySelector('svg path');
      if (path) path.style.fill = isFav ? 'currentColor' : 'none';
    });
  }

  // Update lightbox fav button if open
  if (state.lightboxIndex !== -1 && state.filteredList[state.lightboxIndex]?.id === id) {
    syncLightboxFav();
  }
}

function updateFavHeader() {
  const hasFavs = state.favorites.size > 0;
  DOM.favBtn.classList.toggle('active-fav', state.showingFavorites);
}

/* ═══════════════════════════════════════════════════════════
   10. LIGHTBOX
   ═══════════════════════════════════════════════════════════ */
function openLightbox(id) {
  const idx = state.filteredList.findIndex((img) => img.id === id);
  if (idx === -1) return;
  state.lightboxIndex = idx;
  showLightboxImage(idx);
  DOM.lightbox.classList.add('lb-open');
  DOM.lightbox.setAttribute('aria-hidden', 'false');
  DOM.body.style.overflow = 'hidden';
  DOM.lbClose.focus();

  // Preload neighbours
  preloadNeighbours(idx);
}

function closeLightbox() {
  DOM.lightbox.classList.remove('lb-open');
  DOM.lightbox.setAttribute('aria-hidden', 'true');
  DOM.body.style.overflow = '';
  // Reset image state
  DOM.lbImage.classList.remove('lb-img-ready');
  state.lightboxIndex = -1;

  // Exit fullscreen if active
  if (state.isFullscreen) exitFullscreen();
}

function showLightboxImage(idx) {
  const img = state.filteredList[idx];
  if (!img) return;

  // Reset image readiness
  DOM.lbImage.classList.remove('lb-img-ready');
  DOM.lbSkeleton.classList.remove('hidden');

  // Set metadata
  DOM.lbTitle.textContent    = img.title;
  DOM.lbDesc.textContent     = img.description;
  DOM.lbCategory.textContent = cap(img.category);
  DOM.lbDownloadBtn.href     = img.src;
  DOM.lbDownloadBtn.setAttribute('download', img.title.replace(/\s+/g, '_') + '.png');

  // Nav buttons
  DOM.lbPrev.disabled = idx === 0;
  DOM.lbNext.disabled = idx === state.filteredList.length - 1;

  // Counter
  DOM.lbCounter.textContent = `${idx + 1} / ${state.filteredList.length}`;

  // Sync fav
  syncLightboxFav();

  // Load image
  const preloaded = state.preloadCache[img.src];
  if (preloaded && preloaded.complete && preloaded.naturalWidth) {
    DOM.lbImage.src = img.src;
    DOM.lbImage.alt = img.title;
    requestAnimationFrame(() => {
      DOM.lbImage.classList.add('lb-img-ready');
      DOM.lbSkeleton.classList.add('hidden');
    });
  } else {
    DOM.lbImage.src = '';
    DOM.lbImage.alt = img.title;
    const tempImg = new Image();
    tempImg.onload = () => {
      state.preloadCache[img.src] = tempImg;
      DOM.lbImage.src = img.src;
      requestAnimationFrame(() => {
        DOM.lbImage.classList.add('lb-img-ready');
        DOM.lbSkeleton.classList.add('hidden');
      });
    };
    tempImg.onerror = () => {
      DOM.lbImage.src = img.src; // try anyway
      DOM.lbSkeleton.classList.add('hidden');
    };
    tempImg.src = img.src;
  }
}

function navigateLightbox(direction) {
  const next = state.lightboxIndex + direction;
  if (next < 0 || next >= state.filteredList.length) return;
  state.lightboxIndex = next;
  showLightboxImage(next);
  preloadNeighbours(next);
}

function preloadNeighbours(idx) {
  const list = state.filteredList;
  [-1, 1].forEach((offset) => {
    const n = list[idx + offset];
    if (n) preloadImage(n.src);
  });
}

function syncLightboxFav() {
  const img = state.filteredList[state.lightboxIndex];
  if (!img) return;
  const isFav = state.favorites.has(img.id);
  DOM.lbFavBtn.classList.toggle('lb-favorited', isFav);
  DOM.lbFavBtn.setAttribute('aria-pressed', String(isFav));
}

/* ── Fullscreen ──────────────────────────────────────────── */
function enterFullscreen() {
  const el = DOM.lightbox;
  (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)?.call(el);
  state.isFullscreen = true;
  DOM.lbFullscreenBtn.classList.add('lb-is-fullscreen');
}

function exitFullscreen() {
  (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen)?.call(document);
  state.isFullscreen = false;
  DOM.lbFullscreenBtn.classList.remove('lb-is-fullscreen');
}

/* ═══════════════════════════════════════════════════════════
   11. EVENT LISTENERS
   ═══════════════════════════════════════════════════════════ */

/* ── Filter buttons ──────────────────────────────────────── */
DOM.filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (filter === state.currentFilter && !state.showingFavorites) return;
    state.currentFilter = filter;
    state.showingFavorites = false;
    DOM.favBtn.classList.remove('active-fav');
    DOM.filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
    renderGrid(true);
  });
});

/* ── Show Favorites ──────────────────────────────────────── */
DOM.favBtn.addEventListener('click', () => {
  state.showingFavorites = !state.showingFavorites;
  DOM.favBtn.classList.toggle('active-fav', state.showingFavorites);
  DOM.favBtn.setAttribute('aria-pressed', String(state.showingFavorites));
  if (state.showingFavorites) {
    state.currentFilter = 'all';
    DOM.filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
  }
  renderGrid(true);
});

/* ── Back to All ─────────────────────────────────────────── */
DOM.backToAll.addEventListener('click', () => {
  state.showingFavorites = false;
  state.currentFilter = 'all';
  DOM.favBtn.classList.remove('active-fav');
  DOM.filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
  renderGrid(true);
});

/* ── Load More ───────────────────────────────────────────── */
DOM.loadMoreBtn.addEventListener('click', () => {
  state.visibleCount += 4;
  renderGrid(false);
});

/* ── Theme toggle ────────────────────────────────────────── */
DOM.themeToggle.addEventListener('click', () => applyTheme(!state.isDark));

/* ── View toggle (grid / masonry) ───────────────────────── */
DOM.viewGrid.addEventListener('click', () => {
  DOM.grid.classList.remove('masonry-view');
  DOM.viewGrid.classList.add('active');
  DOM.viewMasonry.classList.remove('active');
  DOM.viewGrid.setAttribute('aria-pressed', 'true');
  DOM.viewMasonry.setAttribute('aria-pressed', 'false');
});
DOM.viewMasonry.addEventListener('click', () => {
  DOM.grid.classList.add('masonry-view');
  DOM.viewMasonry.classList.add('active');
  DOM.viewGrid.classList.remove('active');
  DOM.viewMasonry.setAttribute('aria-pressed', 'true');
  DOM.viewGrid.setAttribute('aria-pressed', 'false');
});

/* ── Search ──────────────────────────────────────────────── */
const searchInput = $('search-input');
const searchClear = $('search-clear');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  searchClear.classList.toggle('hidden', !query);
  state.searchQuery = query;
  renderGrid(true);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  state.searchQuery = '';
  renderGrid(true);
  searchInput.focus();
});

/* ── Shuffle ─────────────────────────────────────────────── */
$('shuffle-btn').addEventListener('click', () => {
  state.filteredList = state.filteredList.sort(() => Math.random() - 0.5);
  DOM.grid.innerHTML = state.filteredList.slice(0, state.visibleCount).map(buildCardHTML).join('');
  const cards = DOM.grid.querySelectorAll('.gallery-card');
  cards.forEach((card, i) => setTimeout(() => card.classList.add('card-visible'), i * 50));
  attachCardEvents();
  initLazyLoad();
  showToast('Gallery shuffled ✦');
});

/* ── Density slider ──────────────────────────────────────── */
$('density-slider').addEventListener('input', (e) => {
  const val = e.target.value;
  DOM.grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${val}px, 1fr))`;
});

/* ── Upload button / file input ──────────────────────────── */
$('upload-btn').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', (e) => handleFiles(e.target.files));

/* ── Drag & Drop ─────────────────────────────────────────── */
(function initDragDrop() {
  const dropZone = $('drop-zone');
  let dragCounter = 0;

  document.addEventListener('dragenter', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      dropZone.classList.remove('hidden');
    }
  });
  document.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; dropZone.classList.add('hidden'); }
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.add('hidden');
    handleFiles(e.dataTransfer.files);
  });
})();

function handleFiles(files) {
  if (!files || !files.length) return;
  const uploadFilter = $('filter-upload');
  uploadFilter.style.display = '';

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const newImg = {
      id: Date.now() + Math.random(),
      src: url,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      description: `Uploaded image — ${file.name}`,
      category: 'upload',
    };
    IMAGES.push(newImg);
  });

  state.currentFilter = 'upload';
  DOM.filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'upload'));
  renderGrid(true);
  showToast(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
}

/* ── Lightbox controls ───────────────────────────────────── */
DOM.lbClose.addEventListener('click', closeLightbox);
DOM.lbBackdrop.addEventListener('click', closeLightbox);
DOM.lbPrev.addEventListener('click', () => navigateLightbox(-1));
DOM.lbNext.addEventListener('click', () => navigateLightbox(1));

DOM.lbFavBtn.addEventListener('click', () => {
  const img = state.filteredList[state.lightboxIndex];
  if (img) toggleFav(img.id);
});

DOM.lbFullscreenBtn.addEventListener('click', () => {
  if (state.isFullscreen) exitFullscreen();
  else enterFullscreen();
});

/* Share button */
$('lb-share-btn').addEventListener('click', async () => {
  const img = state.filteredList[state.lightboxIndex];
  if (!img) return;
  if (navigator.share) {
    try { await navigator.share({ title: img.title, text: img.description }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    showToast('Link copied to clipboard');
  }
});

/* Meta toggle */
$('lb-meta-toggle').addEventListener('click', () => {
  const panel = $('lb-meta-panel');
  const isHidden = panel.classList.toggle('hidden');
  const img = state.filteredList[state.lightboxIndex];
  if (!isHidden && img) {
    $('meta-grid').innerHTML = [
      { label: 'Title',    value: img.title },
      { label: 'Category', value: img.category },
      { label: 'Source',   value: img.src },
    ].map(({ label, value }) =>
      `<div class="meta-item"><span class="meta-label">${label}</span><span class="meta-value">${value}</span></div>`
    ).join('');
  }
});

/* Collect button → open collections modal */
$('lb-collect-btn').addEventListener('click', () => openModal('collections-modal'));

/* ── Collections Modal ───────────────────────────────────── */
$('collections-close').addEventListener('click', () => closeModal('collections-modal'));
$('create-album-btn').addEventListener('click', () => {
  const input = $('new-album-input');
  const name = input.value.trim();
  if (!name) return;
  showToast(`Album "${name}" created`);
  input.value = '';
  closeModal('collections-modal');
});

/* ── Shortcuts modal ─────────────────────────────────────── */
$('shortcuts-trigger-btn').addEventListener('click', () => openModal('shortcuts-modal'));
$('shortcuts-close').addEventListener('click', () => closeModal('shortcuts-modal'));

/* ── Modal backdrop ──────────────────────────────────────── */
$('modal-backdrop').addEventListener('click', () => {
  closeModal('collections-modal');
  closeModal('shortcuts-modal');
});

function openModal(id) {
  $(id).classList.remove('hidden');
  $('modal-backdrop').classList.remove('hidden');
}
function closeModal(id) {
  $(id).classList.add('hidden');
  const anyOpen = !$('collections-modal').classList.contains('hidden') ||
                  !$('shortcuts-modal').classList.contains('hidden');
  if (!anyOpen) $('modal-backdrop').classList.add('hidden');
}

/* ── Context Menu ────────────────────────────────────────── */
(function initContextMenu() {
  const menu = $('context-menu');
  let ctxId = null;

  DOM.grid.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.gallery-card');
    if (!card) return;
    e.preventDefault();
    ctxId = Number(card.dataset.id);
    menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    menu.style.top  = Math.min(e.clientY, window.innerHeight - 200) + 'px';
    menu.classList.remove('hidden');
  });

  document.addEventListener('click', () => menu.classList.add('hidden'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.classList.add('hidden'); });

  $('ctx-view').addEventListener('click', () => { if (ctxId !== null) openLightbox(ctxId); });
  $('ctx-fav').addEventListener('click', () => { if (ctxId !== null) toggleFav(ctxId); });
  $('ctx-download').addEventListener('click', () => {
    if (ctxId === null) return;
    const img = IMAGES.find((i) => i.id === ctxId);
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src; a.download = img.title + '.png'; a.click();
  });
  $('ctx-share').addEventListener('click', () => {
    if (ctxId !== null) showToast('Link copied!');
  });
  $('ctx-collect').addEventListener('click', () => {
    if (ctxId !== null) { openLightbox(ctxId); openModal('collections-modal'); }
  });
})();

/* ── Scroll to Top ───────────────────────────────────────── */
(function initScrollTop() {
  const btn = $('scroll-top-btn');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('hidden', window.scrollY < 300);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* Handle fullscreen exit via browser UI (Esc key in browser) */
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && state.isFullscreen) {
    state.isFullscreen = false;
    DOM.lbFullscreenBtn.classList.remove('lb-is-fullscreen');
  }
});

/* ── Keyboard navigation ─────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  // Global shortcuts (not in lightbox)
  if (!DOM.lightbox.classList.contains('lb-open')) {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === '?') openModal('shortcuts-modal');
    if ((e.key === 'S' || e.key === 's') && e.shiftKey) $('shuffle-btn').click();
    if (e.key === 'g' || e.key === 'G') applyTheme(!state.isDark);
    return;
  }
  // Lightbox shortcuts
  switch (e.key) {
    case 'Escape':     closeLightbox();       break;
    case 'ArrowLeft':  navigateLightbox(-1);  break;
    case 'ArrowRight': navigateLightbox(1);   break;
    case 'f': case 'F': {
      const img = state.filteredList[state.lightboxIndex];
      if (img) toggleFav(img.id);
      break;
    }
    case 'd': case 'D': DOM.lbDownloadBtn.click(); break;
    case 'z': case 'Z': $('zoom-in').click();  break;
    case 'x': case 'X': $('zoom-out').click(); break;
    case 'r': case 'R': $('zoom-reset').click(); break;
    case 'i': case 'I': $('lb-meta-toggle').click(); break;
  }
});

/* ── Zoom controls (basic scale transform) ───────────────── */
(function initZoom() {
  let zoom = 1;
  const setZoom = (val) => {
    zoom = Math.min(4, Math.max(1, val));
    DOM.lbImage.style.transform = `scale(${zoom})`;
    $('zoom-level').textContent = `${Math.round(zoom * 100)}%`;
  };
  $('zoom-in').addEventListener('click', () => setZoom(zoom + 0.25));
  $('zoom-out').addEventListener('click', () => setZoom(zoom - 0.25));
  $('zoom-reset').addEventListener('click', () => setZoom(1));

  // Reset zoom when changing images
  const origClose = closeLightbox;
})();

/* ── Touch / swipe support ───────────────────────────────── */
(function initSwipe() {
  let startX = 0;
  DOM.lightbox.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  DOM.lightbox.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      navigateLightbox(diff < 0 ? 1 : -1);
    }
  }, { passive: true });
})();

/* ── Smooth scroll header shrink ─────────────────────────── */
(function initScrollBehavior() {
  const header = $('site-header');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.style.boxShadow = y > 10 ? 'var(--shadow-sm)' : 'none';
  }, { passive: true });
})();

/* ── Toast helper ────────────────────────────────────────── */
function showToast(msg, duration = 2500) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('toast-show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('toast-show'), duration);
}

/* ═══════════════════════════════════════════════════════════
   12. INITIALISE
   ═══════════════════════════════════════════════════════════ */
(function init() {
  state.searchQuery = '';
  loadFavorites();
  loadTheme();
  updateFavHeader();
  renderGrid(true);
})();
