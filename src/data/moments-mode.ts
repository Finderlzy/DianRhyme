export type MomentsMode = 'star' | 'gallery';

export interface ModeEnvironment {
  width: number;
  coarsePointer: boolean;
  userChoice?: MomentsMode | null;
}

export function chooseMomentsMode({ width, coarsePointer, userChoice }: ModeEnvironment): MomentsMode {
  if (userChoice === 'star' || userChoice === 'gallery') return userChoice;
  return width <= 768 || coarsePointer ? 'gallery' : 'star';
}

