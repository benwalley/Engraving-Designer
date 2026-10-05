// Prefix for files in public/ — the app is served from a subpath on GitHub Pages.
const BASE = import.meta.env.BASE_URL;

export const PRODUCT_MODELS = [
  {
    id: 'dog-tag',
    name: 'Rounded Dog Tag',
    thumbnail: null,
    glbPath: `${BASE}models/dog-tag/model.glb`,
    engraveMeshName: 'EngraveFace',
    baseTexturePath: null,
    // SVG file defines the exact boundary shape — edit this in Illustrator/Figma/Inkscape.
    // The SVG is fetched at runtime; all <path> elements are combined into a compound path.
    // Add additional sub-paths for holes (evenodd fill rule cuts them out automatically).
    boundarySvgPath: `${BASE}models/dog-tag/boundary.svg`,
    // Inline fallback used if the SVG fails to load (28×50mm, curved top and bottom)
    boundaryPath: 'M 0.15 6.15 C 6.15 -1.85 22.15 -1.85 28.15 6.15 V 44.15 C 22.15 52.15 6.15 52.15 0.15 44.15 Z',
    canvasRegion: null,
  },
];

export const MODEL_MAP = Object.fromEntries(PRODUCT_MODELS.map(m => [m.id, m]));
