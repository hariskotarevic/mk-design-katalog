/**
 * ThreeViewer - 3D Stone Slab Viewer Module
 *
 * Renders an interactive 3D stone slab using Three.js (r128).
 * Users can rotate the slab via mouse/touch drag and zoom via scroll/pinch.
 * Stone textures are loaded from catalog image data and mapped onto a rectangular slab geometry.
 *
 * Dependencies:
 *   - THREE (global, loaded from CDN - r128)
 *   - Catalog (global, provides getStoneById)
 */

const ThreeViewer = {
  scene: null,
  camera: null,
  renderer: null,
  slab: null,
  isActive: false,
  animationId: null,

  // Mouse/touch rotation state
  isDragging: false,
  previousMousePosition: { x: 0, y: 0 },
  rotationSpeed: { x: 0, y: 0 },

  // Pinch zoom state
  initialPinchDistance: 0,
  currentZoom: 5,

  /**
   * Show the 3D viewer overlay for a given stone.
   * Initializes the scene on first call, then loads the stone texture.
   * @param {string} stoneId - ID of the stone from the catalog
   */
  show(stoneId) {
    const stone = Catalog.getStoneById(stoneId);
    if (!stone) return;

    const viewer = document.getElementById('three-viewer');
    if (!viewer) return;

    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Escape key to close
    this._escHandler = (e) => { if (e.key === 'Escape') this.hide(); };
    document.addEventListener('keydown', this._escHandler);

    // Show loading indicator
    const loading = viewer.querySelector('.viewer-loading');
    if (loading) loading.style.display = 'flex';

    // Initialize Three.js scene on first use
    if (!this.scene) {
      this.initScene();
    }

    // Load stone texture and create/update the slab mesh
    this.loadStone(stone);

    this.isActive = true;
    this.animate();
  },

  /**
   * Initialize the Three.js scene, camera, renderer, lights, and ground plane.
   * Called once on first show().
   */
  initScene() {
    const container = document.getElementById('three-canvas');
    if (!container) {
      console.error('ThreeViewer: #three-canvas container not found');
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A1A);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // --- Lighting ---

    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-3, 4, -3);
    this.scene.add(fillLight);

    // Subtle gold rim light for a premium feel
    const rimLight = new THREE.PointLight(0xD4AF37, 0.3, 20);
    rimLight.position.set(0, -2, 4);
    this.scene.add(rimLight);

    // --- Ground plane (subtle, dark) ---
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Bind interaction controls
    this.setupControls();

    // Keep renderer in sync with window size
    this._onResizeBound = () => this.onResize();
    window.addEventListener('resize', this._onResizeBound);
  },

  /**
   * Load a stone texture and create (or replace) the slab mesh.
   * @param {Object} stone - Stone data object with images.texture3d
   */
  loadStone(stone) {
    const loader = new THREE.TextureLoader();
    const textureUrl = stone.images.texture3d;

    loader.load(
      textureUrl,
      (texture) => {
        // Dispose previous slab resources
        if (this.slab) {
          this.scene.remove(this.slab);
          if (this.slab.geometry) this.slab.geometry.dispose();
          if (this.slab.material) {
            if (this.slab.material.map) this.slab.material.map.dispose();
            this.slab.material.dispose();
          }
        }

        // Stone slab proportions: ~30x20x3cm normalized to ~3x2x0.3
        const geometry = new THREE.BoxGeometry(3, 0.3, 2);

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.3,   // Polished stone look
          metalness: 0.05,
          envMapIntensity: 0.5
        });

        this.slab = new THREE.Mesh(geometry, material);
        this.slab.castShadow = true;
        this.slab.position.y = 0;
        this.scene.add(this.slab);

        // Set a slight initial tilt so the top face is visible
        this.slab.rotation.set(0.3, 0, 0);

        // Reset camera zoom
        this.currentZoom = 5;
        this.camera.position.set(0, 2, this.currentZoom);
        this.camera.lookAt(0, 0, 0);

        // Hide loading indicator
        const loading = document.querySelector('#three-viewer .viewer-loading');
        if (loading) loading.style.display = 'none';
      },
      undefined,
      (error) => {
        console.error('ThreeViewer: Error loading texture:', error);
        const loading = document.querySelector('#three-viewer .viewer-loading');
        if (loading) {
          loading.innerHTML = '<p>Greška pri učitavanju teksture</p>';
        }
      }
    );
  },

  /**
   * Attach mouse, wheel, and touch event listeners to the renderer canvas
   * for rotation and zoom controls.
   */
  setupControls() {
    const canvas = this.renderer.domElement;

    // --- Mouse controls ---

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.slab) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.slab.rotation.y += deltaX * 0.01;
      this.slab.rotation.x += deltaY * 0.01;

      // Clamp vertical rotation to avoid flipping
      this.slab.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.slab.rotation.x));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    // --- Mouse wheel zoom ---

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.currentZoom += e.deltaY * 0.01;
      this.currentZoom = Math.max(2.5, Math.min(10, this.currentZoom));
      this.camera.position.z = this.currentZoom;
    }, { passive: false });

    // --- Touch controls ---

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        // Begin pinch zoom
        this.isDragging = false;
        this.initialPinchDistance = this.getPinchDistance(e.touches);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && this.isDragging && this.slab) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.slab.rotation.y += deltaX * 0.01;
        this.slab.rotation.x += deltaY * 0.01;
        this.slab.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.slab.rotation.x));

        this.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        const currentDistance = this.getPinchDistance(e.touches);
        const delta = this.initialPinchDistance - currentDistance;

        this.currentZoom += delta * 0.02;
        this.currentZoom = Math.max(2.5, Math.min(10, this.currentZoom));
        this.camera.position.z = this.currentZoom;

        this.initialPinchDistance = currentDistance;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  },

  /**
   * Calculate the distance between two touch points (for pinch zoom).
   * @param {TouchList} touches
   * @returns {number}
   */
  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Main render loop. Adds gentle auto-rotation when the user is not dragging.
   */
  animate() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    // Gentle auto-rotation when idle
    if (!this.isDragging && this.slab) {
      this.slab.rotation.y += 0.003;
    }

    this.renderer.render(this.scene, this.camera);
  },

  /**
   * Handle window resize to keep the renderer and camera in sync.
   */
  onResize() {
    if (!this.camera || !this.renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  },

  /**
   * Hide the viewer overlay and stop the render loop.
   * Does not dispose GPU resources (scene stays warm for re-use).
   */
  hide() {
    this.isActive = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const viewer = document.getElementById('three-viewer');
    if (viewer) {
      viewer.classList.remove('active');
    }

    // Remove Escape listener
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }

    // Keep body scroll locked since the stone detail panel is still open behind
    document.body.style.overflow = 'hidden';
  },

  /**
   * Fully dispose all Three.js resources and remove the canvas from the DOM.
   * Call this when the viewer is no longer needed at all.
   */
  dispose() {
    this.hide();

    // Dispose slab resources
    if (this.slab) {
      if (this.slab.geometry) this.slab.geometry.dispose();
      if (this.slab.material) {
        if (this.slab.material.map) this.slab.material.map.dispose();
        this.slab.material.dispose();
      }
    }

    // Dispose renderer and remove canvas element
    if (this.renderer) {
      this.renderer.dispose();
      const container = document.getElementById('three-canvas');
      if (container && this.renderer.domElement.parentNode === container) {
        container.removeChild(this.renderer.domElement);
      }
    }

    // Remove resize listener
    if (this._onResizeBound) {
      window.removeEventListener('resize', this._onResizeBound);
      this._onResizeBound = null;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.slab = null;
  }
};

window.ThreeViewer = ThreeViewer;
