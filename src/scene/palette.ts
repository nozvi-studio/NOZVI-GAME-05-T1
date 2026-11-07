import type { Garnish, Grade, Topping } from '../core/types';

// Ingredient colours shared by trays, jars and bowl contents (GDD §10).
export const TOPPING_COLORS: Record<Topping, number> = {
  pork: 0x9c5a33,
  shrimp: 0xff7f50,
  liver: 0x5e1f24,
  quailEgg: 0xf6efdc,
};

export const GARNISH_COLORS: Record<Garnish, number> = {
  scallion: 0x3fae49,
  pepper: 0x2a2522,
  sprouts: 0xeeeac8,
};

export const NOODLE_COLORS: Record<Grade, number> = {
  perfect: 0xf6e7bd,
  good: 0xe6cf92,
  bad: 0xb9a88a,
};

export const BROTH_COLOR = 0xd08a3a;
export const RAW_NOODLE_COLOR = 0xfaf3dc;
