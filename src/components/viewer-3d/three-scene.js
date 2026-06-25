/**
 * Encapsulates the Three.js scene lifecycle for the 3D engraving preview.
 * Created and disposed by viewer-3d-modal.js.
 *
 * Fallback: if model.glbPath is null, a BoxGeometry placeholder is used
 * so the full pipeline can be tested before real GLB assets exist.
 */
export class ThreeScene {
  /**
   * @param {HTMLElement} container  - DOM element to mount the renderer into
   * @param {object}      model      - product model descriptor from model-registry.js
   * @param {string}      textureDataUrl - initial engraving texture (PNG data URL)
   */
  constructor(container, model, textureDataUrl, textureRegion = null) {
    this._container = container;
    this._model = model;
    this._textureDataUrl = textureDataUrl;
    this._textureRegion = textureRegion;
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._controls = null;
    this._engraveMesh = null;
    this._animFrameId = null;
    this._resizeObserver = null;
  }

  async load() {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

    const { width, height } = this._container.getBoundingClientRect();

    // Renderer
    this._THREE = THREE;
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(width || 800, height || 600);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._container.appendChild(this._renderer.domElement);

    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this._camera = new THREE.PerspectiveCamera(45, (width || 800) / (height || 600), 0.01, 100);
    this._camera.position.set(0, 0, 3);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this._scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 4, 3);
    this._scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-2, -1, 2);
    this._scene.add(fill);

    // Controls
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;

    if (this._model.glbPath) {
      await this._loadGlb(THREE);
    } else {
      this._buildPlaceholder(THREE);
    }

    // Apply initial texture
    this._applyTexture(this._textureDataUrl, this._textureRegion);

    // Animate
    const animate = () => {
      this._animFrameId = requestAnimationFrame(animate);
      this._controls.update();
      this._renderer.render(this._scene, this._camera);
    };
    animate();

    // Resize
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this._container);
  }

  async _loadGlb(THREE) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load(this._model.glbPath, resolve, undefined, reject);
    });
    this._scene.add(gltf.scene);

    // Find the engravable mesh by name
    gltf.scene.traverse(node => {
      if (node.isMesh && node.name === this._model.engraveMeshName) {
        this._engraveMesh = node;
      }
    });

    // Centre + fit the model in view
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    gltf.scene.position.sub(centre);
    this._camera.position.set(0, 0, size * 1.5);
    this._controls.maxDistance = size * 4;
  }

  _buildPlaceholder(THREE) {
    // Body of the box (base material)
    const bodyGeo = new THREE.BoxGeometry(2, 1.3, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this._scene.add(body);

    // Engrave face — a flat plane on the front of the box
    const faceGeo = new THREE.PlaneGeometry(1.6, 1.0);
    const faceMat = new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.2 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.name = this._model.engraveMeshName;
    face.position.set(0, 0, 0.21);
    this._scene.add(face);

    this._engraveMesh = face;
  }

  _applyTexture(dataUrl, textureRegion) {
    if (!this._engraveMesh || !dataUrl) return;
    const THREE = this._THREE;

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth  || 512;
      const h = img.naturalHeight || 512;

      // Color map: design as-is (dark marks tint the metal slightly darker)
      const colorTex = new THREE.Texture(img);
      colorTex.colorSpace = THREE.SRGBColorSpace;
      colorTex.needsUpdate = true;

      // Roughness map: design INVERTED so dark (engraved) areas → high roughness → matte.
      // With roughness=0.8 × inverted map:
      //   white unengraved background → inverted → black (0) → 0.8×0 = 0  (shiny metal) ✓
      //   dark engraved marks         → inverted → white (1) → 0.8×1 = 0.8 (matte)      ✓
      const roughCanvas = document.createElement('canvas');
      roughCanvas.width  = w;
      roughCanvas.height = h;
      const rCtx = roughCanvas.getContext('2d');
      rCtx.drawImage(img, 0, 0, w, h);
      rCtx.globalCompositeOperation = 'difference';
      rCtx.fillStyle = 'white';
      rCtx.fillRect(0, 0, w, h);
      const roughTex = new THREE.CanvasTexture(roughCanvas);
      roughTex.needsUpdate = true;

      // UV region transform: map only the guide's canvas region onto the mesh UV space.
      // textureRegion is { x, y, width, height } as 0–1 fractions of the canvas.
      // offset.y = 1 - y - height accounts for THREE.js flipY (UV V=0 is image bottom).
      const applyRegion = (tex) => {
        if (textureRegion) {
          const { x, y, width, height } = textureRegion;
          tex.repeat.set(width, height);
          tex.offset.set(x, 1 - y - height);
        }
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      };
      applyRegion(colorTex);
      applyRegion(roughTex);

      const mat = this._engraveMesh.material;
      if (mat.map)          { mat.map.dispose();          mat.map = null; }
      if (mat.roughnessMap) { mat.roughnessMap.dispose();  mat.roughnessMap = null; }
      if (mat.aoMap)        { mat.aoMap.dispose();         mat.aoMap = null; }

      mat.map          = colorTex;
      mat.roughnessMap = roughTex;
      mat.metalness    = 0.8;
      mat.roughness    = 0.8;
      mat.needsUpdate  = true;
    };
    img.src = dataUrl;
  }

  updateTexture(dataUrl, textureRegion) {
    this._textureDataUrl = dataUrl;
    this._textureRegion = textureRegion;
    this._applyTexture(dataUrl, textureRegion);
  }

  _onResize() {
    if (!this._renderer) return;
    const { width, height } = this._container.getBoundingClientRect();
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  }

  dispose() {
    cancelAnimationFrame(this._animFrameId);
    this._resizeObserver?.disconnect();
    this._controls?.dispose();

    // Dispose all geometries and materials
    this._scene?.traverse(node => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach(m => {
        if (!m) return;
        Object.values(m).forEach(v => { if (v?.isTexture) v.dispose(); });
        m.dispose();
      });
    });

    this._renderer?.dispose();
    this._renderer?.domElement?.remove();
  }
}
