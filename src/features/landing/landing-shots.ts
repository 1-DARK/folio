import type { ShotId } from "./landing-copy";

// Screenshots for the landing's picture slots. Put the image in
// public/landing/ (e.g. public/landing/shot-b.png) and add its path here:
//   B: "/landing/shot-b.png",
// A slot without an image shows a labelled placeholder.
export const LANDING_SHOTS: Partial<Record<ShotId, string>> = {};
