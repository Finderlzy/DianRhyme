export interface TierInput {
  dpr: number;
  width: number;
  coarsePointer: boolean;
  reducedMotion: boolean;
}

export interface DeviceTier {
  isMobile: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  pixelRatioCap: number;
  maxTextureEdge: number;
  particleCount: number;
  antialias: boolean;
}

const DESKTOP = { pixelRatioCap: 2, maxTextureEdge: 1024, particleCount: 550, antialias: true };
const MOBILE = { pixelRatioCap: 1.75, maxTextureEdge: 768, particleCount: 120, antialias: false };

export function resolveTier(input: TierInput): DeviceTier {
  const isMobile = input.width < 768 && input.coarsePointer;
  const preset = isMobile ? MOBILE : DESKTOP;
  return {
    isMobile,
    isTouch: input.coarsePointer,
    reducedMotion: input.reducedMotion,
    ...preset,
  };
}