/**
 * Catalog Module
 * Manages the stone catalog screen: rendering stone cards, filtering, and searching.
 */
const Catalog = {
  stones: [],
  processing: [],
  filteredStones: [],
  filters: {
    type: 'svi',
    color: 'sve',
    use: 'sve',
    search: ''
  },

  colorMap: {
    'bijeli':    '#f5f5f5',
    'crni':      '#1a1a1a',
    'sivi':      '#808080',
    'smeđi':     '#8B4513',
    'crveni':    '#cc3333',
    'šareni':    'linear-gradient(135deg, #cc3333, #d4c637, #2d8a4e, #3366aa)',
    'zeleni':    '#2d8a4e',
    'plavi':     '#3366aa',
    'ružičasti': '#d4899a',
    'bež':       '#d4b896',
    'žuti':      '#d4c637',
    'zlatni':    '#D4AF37'
  },

  _debounceTimer: null,

  /**
   * Initialize the catalog with stone and processing data.
   */
  init(stones, processing) {
    this.stones = stones;
    this.processing = processing;
    this.filteredStones = [...stones];
    this.setupFilters();
    this.setupSearch();
    this.render();
  },

  /**
   * Set up filter button click handlers for type, color, and use filter groups.
   */
  setupFilters() {
    const catalogScreen = document.getElementById('catalog-screen');
    if (!catalogScreen) return;

    // Map internal filter keys to HTML data-filter attribute values and their data-value for "all"
    const filterConfig = {
      type:  { attr: 'type',  allValue: 'all', defaultFilter: 'svi' },
      color: { attr: 'color', allValue: 'all', defaultFilter: 'sve' },
      use:   { attr: 'usage', allValue: 'all', defaultFilter: 'sve' }
    };

    Object.entries(filterConfig).forEach(([group, config]) => {
      const buttons = catalogScreen.querySelectorAll(`[data-filter="${config.attr}"] .filter-chip`);

      buttons.forEach(button => {
        // Add color dot indicators to color filter buttons
        if (group === 'color') {
          const colorValue = button.getAttribute('data-value');
          if (colorValue !== config.allValue && this.colorMap[colorValue]) {
            const dot = document.createElement('span');
            dot.classList.add('filter-color-dot');
            const cssColor = this.colorMap[colorValue];
            if (cssColor.startsWith('linear-gradient')) {
              dot.style.background = cssColor;
            } else {
              dot.style.backgroundColor = cssColor;
            }
            button.prepend(dot);
          }
        }

        button.addEventListener('click', () => {
          const value = button.getAttribute('data-value');

          // Map "all" to internal default
          this.filters[group] = (value === config.allValue) ? config.defaultFilter : value;

          // Update active class within the group
          buttons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');

          // Update active filter tags and apply filters
          this.updateActiveFilterTags();
          this.applyFilters();
        });
      });
    });
  },

  /**
   * Set up search input with 300ms debounce.
   */
  setupSearch() {
    const searchInput = document.getElementById('stone-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.filters.search = e.target.value.trim();
        this.applyFilters();
      }, 300);
    });
  },

  /**
   * Apply all active filters and re-render the grid.
   */
  applyFilters() {
    let result = [...this.stones];

    // Filter by type
    if (this.filters.type !== 'svi') {
      result = result.filter(stone => stone.type === this.filters.type);
    }

    // Filter by color (stone.colors is an array)
    if (this.filters.color !== 'sve') {
      result = result.filter(stone =>
        Array.isArray(stone.colors) && stone.colors.includes(this.filters.color)
      );
    }

    // Filter by use (stone.uses is an array)
    if (this.filters.use !== 'sve') {
      result = result.filter(stone =>
        Array.isArray(stone.uses) && stone.uses.includes(this.filters.use)
      );
    }

    // Filter by search (case-insensitive match on stone name)
    if (this.filters.search) {
      const query = this.filters.search.toLowerCase();
      result = result.filter(stone =>
        stone.name.toLowerCase().includes(query)
      );
    }

    this.filteredStones = result;
    this.render();
    this.updateActiveFilterTags();
    this.toggleEmptyState();
  },

  /**
   * Show or hide the empty state message based on filtered results.
   */
  toggleEmptyState() {
    const grid = document.getElementById('stone-grid');
    if (!grid) return;

    let emptyEl = document.getElementById('catalog-empty-state');

    if (this.filteredStones.length === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'catalog-empty-state';
        emptyEl.classList.add('empty-state');
        emptyEl.innerHTML = '<p>Nema rezultata za odabrane filtere</p>';
        grid.parentNode.insertBefore(emptyEl, grid.nextSibling);
      }
      emptyEl.style.display = '';
      grid.style.display = 'none';
    } else {
      if (emptyEl) {
        emptyEl.style.display = 'none';
      }
      grid.style.display = '';
    }
  },

  /**
   * Display removable tags for active (non-default) filters.
   */
  updateActiveFilterTags() {
    const container = document.getElementById('active-filters');
    if (!container) return;

    container.innerHTML = '';

    const filterDefaults = { type: 'svi', color: 'sve', use: 'sve' };

    Object.entries(filterDefaults).forEach(([group, defaultValue]) => {
      const currentValue = this.filters[group];
      if (currentValue !== defaultValue) {
        const tag = document.createElement('span');
        tag.classList.add('active-filter-tag');
        tag.innerHTML = `
          ${currentValue}
          <span class="remove" role="button" tabindex="0" aria-label="Ukloni filter ${currentValue}">&times;</span>
        `;

        tag.querySelector('.remove').addEventListener('click', () => {
          // Reset this filter to its default
          this.filters[group] = defaultValue;

          // Reset button active state in the filter group
          const attrMap = { type: 'type', color: 'color', use: 'usage' };
          const catalogScreen = document.getElementById('catalog-screen');
          if (catalogScreen) {
            const buttons = catalogScreen.querySelectorAll(`[data-filter="${attrMap[group]}"] .filter-chip`);
            buttons.forEach(btn => {
              btn.classList.toggle('active', btn.getAttribute('data-value') === 'all');
            });
          }

          this.applyFilters();
        });

        container.appendChild(tag);
      }
    });
  },

  /**
   * Render stone cards into the grid.
   */
  render() {
    const grid = document.getElementById('stone-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    this.filteredStones.forEach((stone, index) => {
      const card = document.createElement('div');
      card.classList.add('stone-card');
      card.setAttribute('data-stone-id', stone.id);
      card.style.opacity = '0';
      card.addEventListener('click', () => {
        if (typeof StoneDetail !== 'undefined' && StoneDetail.show) {
          StoneDetail.show(stone.id);
        }
      });

      // Build color dots HTML
      const colorDots = (stone.colors || []).map(color => {
        const cssColor = this.colorMap[color] || '#ccc';
        const isGradient = cssColor.startsWith('linear-gradient');
        const style = isGradient
          ? `background: ${cssColor};`
          : `background-color: ${cssColor};`;
        return `<span class="stone-color-dot" title="${color}" style="${style}"></span>`;
      }).join('');

      // Origin display
      const originFlag = (stone.origin && stone.origin.flag) ? stone.origin.flag : '';
      const originCountry = (stone.origin && stone.origin.country) ? stone.origin.country : '';

      card.innerHTML = `
        <div class="stone-card-image">
          <div class="skeleton-placeholder"></div>
          <img
            src="${stone.images && stone.images.thumbnail ? stone.images.thumbnail : ''}"
            alt="${stone.name}"
            loading="lazy"
          >
          <span class="stone-type-badge">${stone.type || ''}</span>
        </div>
        <div class="stone-card-body">
          <h3 class="stone-card-name">${stone.name}</h3>
          <p class="stone-card-origin">${originFlag} ${originCountry}</p>
          <div class="stone-card-colors">
            ${colorDots}
          </div>
        </div>
      `;

      // Handle image load: hide skeleton when loaded
      const img = card.querySelector('img');
      const skeleton = card.querySelector('.skeleton-placeholder');

      img.addEventListener('load', () => {
        if (skeleton) skeleton.style.display = 'none';
        img.style.opacity = '1';
      });

      img.addEventListener('error', () => {
        if (skeleton) skeleton.style.display = 'none';
      });

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    // Trigger staggered entrance animations
    this.animateCards();
  },

  /**
   * Animate card entrances with staggered fade/slide using GSAP if available,
   * otherwise fall back to CSS transitions.
   */
  animateCards() {
    const cards = document.querySelectorAll('#stone-grid .stone-card');
    if (!cards.length) return;

    // Use Animations module (GSAP) if available
    if (typeof Animations !== 'undefined' && Animations.staggerEntrance) {
      Animations.staggerEntrance(cards);
      return;
    }

    // GSAP direct usage fallback
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'transform'
        }
      );
      return;
    }

    // Pure CSS fallback
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 50);
    });
  },

  /**
   * Called when the catalog screen becomes visible.
   * Re-triggers entrance animations.
   */
  onShow() {
    this.animateCards();
  },

  /**
   * Find a stone by its ID.
   */
  getStoneById(id) {
    return this.stones.find(s => s.id === id);
  }
};
