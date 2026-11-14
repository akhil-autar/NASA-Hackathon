// Optional real NASA textures. Leave a value as null to use the built-in
// procedural material. To use a real image, put the file in public/textures/
// and set its path here, then credit it in src/content/image-credits.json.
//
// Good free sources (check each licence and credit line before use):
//   Sun   - NASA Solar Dynamics Observatory imagery
//   Mars  - NASA/JPL global colour mosaics
//   Earth - NASA Blue Marble
export const TEXTURES: {
  sun: string | null;
  marsGlobe: string | null;
  earthGlobe: string | null;
  marsGround: string | null;
} = {
  sun: null,
  marsGlobe: null,
  earthGlobe: null,
  marsGround: null,
};
