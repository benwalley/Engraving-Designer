export const PRODUCT_MODELS = [
  {
    id: 'dev-box',
    name: 'Dev Box (placeholder)',
    thumbnail: null,
    glbPath: null,
    engraveMeshName: 'EngraveFace',
    baseTexturePath: null,
    // Dashed boundary drawn on the Fabric canvas to show the engravable area
    boundaryPath: 'M 50 50 L 350 50 L 350 250 L 50 250 Z',
    // The canvas region that maps to the texture (scene coordinates)
    canvasRegion: { x: 50, y: 50, width: 300, height: 200 },
  },
  {
    id: 'dog-tag-test',
    name: 'Test Dog Tag',
    thumbnail: null,
    glbPath: '/models/dog-tag-test/model.glb',
    engraveMeshName: 'EngraveFace',
    baseTexturePath: null,
    // SVG file defines the exact boundary shape — edit this in Illustrator/Figma/Inkscape.
    // The SVG is fetched at runtime; all <path> elements are combined into a compound path.
    // Add additional sub-paths for holes (evenodd fill rule cuts them out automatically).
    boundarySvgPath: '/models/dog-tag-test/boundary.svg',
    // Inline fallback used if the SVG fails to load
    boundaryPath: 'M 10 0 L 90 0 A 10 10 0 0 1 100 10 L 100 196 A 10 10 0 0 1 90 206 L 10 206 A 10 10 0 0 1 0 196 L 0 10 A 10 10 0 0 1 10 0 Z',
    canvasRegion: null,
  },
  {
    id: 'bar-pendant',
    name: 'Bar Pendant',
    thumbnail: null,
    glbPath: '/models/bar-pendant/model.glb',
    engraveMeshName: 'engrage',
    baseTexturePath: null,
    // SVG file defines the exact boundary shape — edit this in Illustrator/Figma/Inkscape.
    // The SVG is fetched at runtime; all <path> elements are combined into a compound path.
    // Add additional sub-paths for holes (evenodd fill rule cuts them out automatically).
    boundarySvgPath: '/models/bar-pendant/boundary.svg',
    // Inline fallback used if the SVG fails to load
    boundaryPath: 'M 10 0 L 90 0 A 10 10 0 0 1 100 10 L 100 196 A 10 10 0 0 1 90 206 L 10 206 A 10 10 0 0 1 0 196 L 0 10 A 10 10 0 0 1 10 0 Z',
    canvasRegion: null,
  },
];

export const MODEL_MAP = Object.fromEntries(PRODUCT_MODELS.map(m => [m.id, m]));
