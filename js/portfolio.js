/**
 * Portfolio Module - MK Katalog
 * Manages the portfolio/projects screen: project cards, category filtering,
 * search, advanced filters, and project detail galleries with touch swipe support.
 */
const Portfolio = {
  projects: [],
  filteredProjects: [],
  currentFilter: 'all',
  currentProject: null,
  galleryIndex: 0,
  searchQuery: '',
  filterColor: '',
  filterStoneType: '',
  filterProcessing: '',

  /**
   * Initialize the portfolio with project data.
   * @param {Array} projects - Array of project objects
   */
  init(projects) {
    this.projects = projects;
    this.filteredProjects = [...projects];
    this.setupFilters();
    this.setupSearch();
    this.setupAdvancedFilters();
    this.render();
  },

  /**
   * Bind click handlers to category filter buttons.
   */
  setupFilters() {
    const buttons = document.querySelectorAll('#portfolio-screen .category-tab');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.currentFilter = btn.dataset.category;
        this.applyAllFilters();
      });
    });
  },

  /**
   * Bind search input handler.
   */
  setupSearch() {
    const input = document.getElementById('project-search');
    if (!input) return;

    input.addEventListener('input', () => {
      this.searchQuery = input.value.trim().toLowerCase();
      this.applyAllFilters();
    });
  },

  /**
   * Bind advanced filter dropdown handlers.
   */
  setupAdvancedFilters() {
    const colorSelect = document.getElementById('filter-color');
    const stoneTypeSelect = document.getElementById('filter-stone-type');
    const processingSelect = document.getElementById('filter-processing');

    if (colorSelect) {
      colorSelect.addEventListener('change', () => {
        this.filterColor = colorSelect.value;
        colorSelect.classList.toggle('active-filter', !!this.filterColor);
        this.applyAllFilters();
      });
    }
    if (stoneTypeSelect) {
      stoneTypeSelect.addEventListener('change', () => {
        this.filterStoneType = stoneTypeSelect.value;
        stoneTypeSelect.classList.toggle('active-filter', !!this.filterStoneType);
        this.applyAllFilters();
      });
    }
    if (processingSelect) {
      processingSelect.addEventListener('change', () => {
        this.filterProcessing = processingSelect.value;
        processingSelect.classList.toggle('active-filter', !!this.filterProcessing);
        this.applyAllFilters();
      });
    }
  },

  /**
   * Apply category filter, search query, and advanced filters together.
   */
  applyAllFilters() {
    let results = [...this.projects];

    // Category filter
    if (this.currentFilter !== 'all') {
      results = results.filter(p => p.category === this.currentFilter);
    }

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery;
      results = results.filter(p => {
        return (p.title && p.title.toLowerCase().includes(q)) ||
               (p.stoneName && p.stoneName.toLowerCase().includes(q)) ||
               (p.color && p.color.toLowerCase().includes(q)) ||
               (p.stoneType && p.stoneType.toLowerCase().includes(q)) ||
               (p.processing && p.processing.toLowerCase().includes(q)) ||
               (p.description && p.description.toLowerCase().includes(q));
      });
    }

    // Color filter
    if (this.filterColor) {
      results = results.filter(p => p.color === this.filterColor);
    }

    // Stone type filter
    if (this.filterStoneType) {
      results = results.filter(p => p.stoneType === this.filterStoneType);
    }

    // Processing filter
    if (this.filterProcessing) {
      results = results.filter(p => p.processing === this.filterProcessing);
    }

    this.filteredProjects = results;
    this.render();
  },

  /**
   * Render the project grid with filtered projects.
   */
  render() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    if (this.filteredProjects.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Nema projekata koji odgovaraju pretrazi</p></div>';
      return;
    }

    grid.innerHTML = this.filteredProjects.map(project => `
      <div class="project-card" onclick="Portfolio.showDetail('${project.id}')">
        <div class="project-card-image">
          <img src="${project.images[0]}" alt="${project.title}" loading="lazy">
          <div class="project-card-overlay">
            <h3 class="project-card-title">${project.title}</h3>
            <p class="project-card-stone">${project.stoneName}</p>
            <span class="project-card-category">${this.getCategoryLabel(project.category)}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Trigger staggered entrance animation
    if (typeof Animations !== 'undefined') {
      Animations.staggerCards(grid, '.project-card');
    }
  },

  /**
   * Map a category key to its human-readable label.
   * @param {string} category
   * @returns {string}
   */
  getCategoryLabel(category) {
    const labels = {
      'spomenici': 'Spomenici',
      'kuhinje': 'Kuhinje',
      'klupice': 'Klupice',
      'enterijeri': 'Enterijeri',
      'fasade': 'Fasade',
      'stepenista': 'Stepeništa',
      'ostalo': 'Ostalo'
    };
    return labels[category] || category;
  },

  /**
   * Open the detail overlay for a specific project.
   * @param {string} projectId
   */
  showDetail(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    this.currentProject = project;
    this.galleryIndex = 0;

    const detail = document.getElementById('project-detail');
    if (!detail) return;

    const whatsappText = encodeURIComponent(
      'Po\u0161tovani, zanima me projekt poput "' + project.title + '". Molim vas za vi\u0161e informacija. Hvala!'
    );

    detail.innerHTML = `
      <button class="detail-close" onclick="Portfolio.hideDetail()" aria-label="Zatvori">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="detail-scroll-content">
      <div class="detail-gallery" id="project-gallery">
        <div class="gallery-track" style="transform: translateX(0%)">
          ${project.images.map((img, i) => `
            <div class="gallery-slide">
              <img src="${img}" alt="${project.title} - slika ${i + 1}">
            </div>
          `).join('')}
        </div>
        <div class="gallery-dots">
          ${project.images.map((_, i) => `
            <span class="gallery-dot ${i === 0 ? 'active' : ''}" onclick="Portfolio.goToSlide(${i})"></span>
          `).join('')}
        </div>
        ${project.images.length > 1 ? `
          <button class="gallery-prev" onclick="Portfolio.prevSlide()" aria-label="Prethodna">\u2039</button>
          <button class="gallery-next" onclick="Portfolio.nextSlide()" aria-label="Sljede\u0107a">\u203A</button>
        ` : ''}
      </div>

      <div class="detail-content">
        <h2 class="detail-name">${project.title}</h2>
        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">Kamen</span>
            <span class="info-value clickable" onclick="Portfolio.hideDetail(); setTimeout(function() { navigateTo('catalog'); setTimeout(function() { StoneDetail.show('${project.stone}'); }, 300); }, 400);">${project.stoneName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Obrada</span>
            <span class="info-value">${project.processing}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Kategorija</span>
            <span class="info-value">${this.getCategoryLabel(project.category)}</span>
          </div>
        </div>
        <div class="detail-description">
          <p>${project.description}</p>
        </div>
        <div class="detail-actions">
          <a class="btn-whatsapp" href="https://wa.me/387603114305?text=${whatsappText}" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.549 4.122 1.511 5.859L.061 23.79l6.089-1.407A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.53-5.445-1.455l-.39-.231-3.614.835.869-3.52-.253-.402A9.72 9.72 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
            Po\u0161aljite upit
          </a>
        </div>
      </div>
      </div>
    `;

    detail.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Set up touch swipe for gallery
    this.setupGallerySwipe();

    // GSAP entrance animation
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(detail, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power2.out' });
    }
  },

  /**
   * Close the project detail overlay with animation.
   */
  hideDetail() {
    const detail = document.getElementById('project-detail');
    if (!detail) return;

    if (typeof gsap !== 'undefined') {
      gsap.to(detail, {
        y: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: function () {
          detail.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    } else {
      detail.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.currentProject = null;
  },

  /**
   * Set up touch swipe gestures on the gallery for mobile navigation.
   */
  setupGallerySwipe() {
    const gallery = document.getElementById('project-gallery');
    if (!gallery) return;

    let startX = 0;

    gallery.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });

    gallery.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    }, { passive: true });
  },

  /**
   * Advance to the next gallery slide.
   */
  nextSlide() {
    if (!this.currentProject) return;
    const max = this.currentProject.images.length - 1;
    this.goToSlide(Math.min(this.galleryIndex + 1, max));
  },

  /**
   * Go back to the previous gallery slide.
   */
  prevSlide() {
    this.goToSlide(Math.max(this.galleryIndex - 1, 0));
  },

  /**
   * Jump to a specific gallery slide by index.
   * @param {number} index
   */
  goToSlide(index) {
    this.galleryIndex = index;
    const track = document.querySelector('#project-gallery .gallery-track');
    if (track) {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
    }
    // Update dots
    document.querySelectorAll('#project-gallery .gallery-dot').forEach(function (dot, i) {
      dot.classList.toggle('active', i === index);
    });
  },

  /**
   * Called when the portfolio screen becomes visible.
   */
  onShow() {
    if (typeof Animations !== 'undefined') {
      Animations.sectionEntrance('portfolio-screen');
    }
  }
};

window.Portfolio = Portfolio;
