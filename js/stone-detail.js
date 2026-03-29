/**
 * MK Katalog - Stone Detail View
 * Full-screen detail panel for viewing a single stone's complete information.
 * Slides up from the bottom with GSAP animation. Supports gallery swipe on mobile.
 */

const StoneDetail = {
  currentStone: null,
  galleryIndex: 0,
  touchStartX: 0,
  touchStartY: 0,
  swipeThreshold: 50,

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Show the detail panel for a given stone.
   * @param {string} stoneId - The stone ID to look up via Catalog.getStoneById
   */
  show(stoneId) {
    const stone = Catalog.getStoneById(stoneId);
    if (!stone) {
      console.warn(`StoneDetail: stone "${stoneId}" not found.`);
      return;
    }

    this.currentStone = stone;
    this.galleryIndex = 0;
    this.populateDetail(stone);
    this.showPanel();
  },

  /**
   * Build the detail panel HTML and inject it into #stone-detail.
   * @param {Object} stone - The stone data object
   */
  populateDetail(stone) {
    const detail = document.getElementById('stone-detail');
    if (!detail) return;

    const processingMethods = Catalog.processing || [];

    // Build gallery images
    const galleryImages = (stone.images.gallery || [stone.images.thumbnail])
      .map((src, i) => `<img class="gallery-image${i === 0 ? ' active' : ''}" src="${src}" alt="${stone.name} - slika ${i + 1}" loading="lazy">`)
      .join('');

    const galleryCount = (stone.images.gallery || [stone.images.thumbnail]).length;

    // Build gallery dots
    const galleryDots = galleryCount > 1
      ? Array.from({ length: galleryCount }, (_, i) =>
          `<span class="gallery-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
        ).join('')
      : '';

    // Capitalize stone type
    const typeLabel = stone.type.charAt(0).toUpperCase() + stone.type.slice(1);

    // Origin full string
    const originFull = `${stone.origin.flag} ${stone.origin.country}${stone.origin.region ? ', ' + stone.origin.region : ''}`;

    // Colors joined
    const colorsText = stone.colors
      .map(c => c.charAt(0).toUpperCase() + c.slice(1))
      .join(', ');

    // Thicknesses joined
    const thicknessText = stone.thicknesses.join(', ');

    // Hardness percentage
    const hardnessPercent = (stone.hardness / 10) * 100;

    // Use tags as pills (capitalize first letter)
    const useTags = stone.uses
      .map(u => `<span class="use-tag">${u.charAt(0).toUpperCase() + u.slice(1)}</span>`)
      .join('');

    // Processing cards
    const processingCards = (stone.processing || [])
      .map(methodId => {
        const method = processingMethods.find(p => p.id === methodId);
        if (!method) return '';
        return `
          <div class="processing-card">
            <span class="processing-icon">${method.icon}</span>
            <h4 class="processing-name">${method.name}</h4>
            <p class="processing-desc">${method.description}</p>
          </div>
        `;
      })
      .join('');

    // WhatsApp message
    const waMessage = encodeURIComponent(
      'Po\u0161tovani, zanima me kamen ' + stone.name + '. Molim vas za vi\u0161e informacija i cijenu. Hvala!'
    );

    detail.innerHTML = `
      <div class="detail-header">
        <button class="detail-close" onclick="StoneDetail.hide()" aria-label="Zatvori">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="detail-gallery">
        <div class="gallery-images">
          ${galleryImages}
        </div>
        ${galleryDots ? `<div class="gallery-dots">${galleryDots}</div>` : ''}
      </div>

      <div class="detail-content">
        <h2 class="detail-name">${stone.name}</h2>
        <p class="detail-origin">${originFull}</p>

        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">Tip</span>
            <span class="info-value">${typeLabel}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Porijeklo</span>
            <span class="info-value">${stone.origin.country}${stone.origin.region ? ', ' + stone.origin.region : ''}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Boje</span>
            <span class="info-value">${colorsText}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dostupne debljine</span>
            <span class="info-value">${thicknessText}</span>
          </div>
        </div>

        <div class="detail-hardness">
          <span class="info-label">Tvrdo\u0107a (Mohs skala)</span>
          <div class="hardness-bar">
            <div class="hardness-fill" style="width: ${hardnessPercent}%"></div>
            <span class="hardness-value">${stone.hardness}/10</span>
          </div>
        </div>

        <div class="detail-uses">
          <span class="info-label">Namjena</span>
          <div class="uses-tags">
            ${useTags}
          </div>
        </div>

        <div class="detail-description">
          <p>${stone.description}</p>
        </div>

        <div class="detail-processing">
          <h3>Vrste obrade</h3>
          <div class="processing-grid">
            ${processingCards}
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn-3d" onclick="ThreeViewer.show('${stone.id}')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            Pogledaj u 3D
          </button>
          <a class="btn-whatsapp" href="https://wa.me/387603114305?text=${waMessage}" target="_blank" rel="noopener noreferrer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
            </svg>
            Po\u0161aljite upit za ovaj kamen
          </a>
        </div>
      </div>
    `;

    // Set up gallery interactions
    this.setupGallerySwipe();
    this.setupGalleryDots();
  },

  // ---------------------------------------------------------------------------
  // Gallery
  // ---------------------------------------------------------------------------

  /**
   * Attach touch event listeners to the gallery area for swipe navigation.
   */
  setupGallerySwipe() {
    const gallery = document.querySelector('#stone-detail .gallery-images');
    if (!gallery) return;

    gallery.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    gallery.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].screenX - this.touchStartX;
      const deltaY = e.changedTouches[0].screenY - this.touchStartY;

      // Only handle horizontal swipes (ignore vertical scroll gestures)
      if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          this.navigateGallery(1);  // swipe left  -> next
        } else {
          this.navigateGallery(-1); // swipe right -> prev
        }
      }
    }, { passive: true });
  },

  /**
   * Make gallery dots clickable for direct image navigation.
   */
  setupGalleryDots() {
    const dots = document.querySelectorAll('#stone-detail .gallery-dot');
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index, 10);
        if (!isNaN(index)) {
          this.goToGalleryImage(index);
        }
      });
    });
  },

  /**
   * Navigate gallery by direction (+1 = next, -1 = prev).
   * @param {number} direction - +1 or -1
   */
  navigateGallery(direction) {
    if (!this.currentStone) return;

    const images = this.currentStone.images.gallery || [this.currentStone.images.thumbnail];
    const total = images.length;
    if (total <= 1) return;

    let newIndex = this.galleryIndex + direction;
    if (newIndex < 0) newIndex = total - 1;
    if (newIndex >= total) newIndex = 0;

    this.goToGalleryImage(newIndex);
  },

  /**
   * Jump to a specific gallery image by index.
   * @param {number} index - Target image index
   */
  goToGalleryImage(index) {
    const galleryEl = document.querySelector('#stone-detail .gallery-images');
    if (!galleryEl) return;

    const imgs = galleryEl.querySelectorAll('.gallery-image');
    const dots = document.querySelectorAll('#stone-detail .gallery-dot');

    // Deactivate current
    imgs.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Activate target
    if (imgs[index]) {
      imgs[index].classList.add('active');
    }
    if (dots[index]) {
      dots[index].classList.add('active');
    }

    this.galleryIndex = index;

    // Smooth translate to show the correct image
    if (typeof gsap !== 'undefined') {
      gsap.to(galleryEl, {
        x: -(index * galleryEl.offsetWidth),
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      galleryEl.style.transform = `translateX(-${index * 100}%)`;
      galleryEl.style.transition = 'transform 0.3s ease';
    }
  },

  // ---------------------------------------------------------------------------
  // Panel Show / Hide
  // ---------------------------------------------------------------------------

  /**
   * Reveal the detail panel with a slide-up animation.
   */
  showPanel() {
    const detail = document.getElementById('stone-detail');
    if (!detail) return;

    detail.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(detail,
        { y: '100%' },
        { y: '0%', duration: 0.4, ease: 'power2.out' }
      );
    }

    // Set up swipe-down-to-close gesture on the header area
    this.setupSwipeToClose();
  },

  /**
   * Hide the detail panel with a slide-down animation.
   */
  hide() {
    const detail = document.getElementById('stone-detail');
    if (!detail) return;

    if (typeof gsap !== 'undefined') {
      gsap.to(detail, {
        y: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          detail.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    } else {
      detail.classList.remove('active');
      document.body.style.overflow = '';
    }

    this.currentStone = null;
  },

  // ---------------------------------------------------------------------------
  // Swipe-Down to Close
  // ---------------------------------------------------------------------------

  /**
   * Allow swiping down on the detail header to close the panel.
   */
  setupSwipeToClose() {
    const header = document.querySelector('#stone-detail .detail-header');
    if (!header) return;

    let startY = 0;

    header.addEventListener('touchstart', (e) => {
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    header.addEventListener('touchend', (e) => {
      const deltaY = e.changedTouches[0].screenY - startY;
      // Swipe down at least 80px to close
      if (deltaY > 80) {
        this.hide();
      }
    }, { passive: true });
  }
};

// Expose globally so inline onclick handlers and other modules can use it
window.StoneDetail = StoneDetail;
