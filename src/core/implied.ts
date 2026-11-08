import type { Garnish, OrderLine, Topping } from './types';

/** MEC-006 rule 4: a recipe that a spoken phrase stands for. The phrase text lives in the UI (`speech.ts`). */
export interface ImpliedRecipe {
  id: string;
  toppings: OrderLine<Topping>[];
  garnishes: OrderLine<Garnish>[];
  /** 1 ít nước, 2 vừa nước, 3 nhiều nước. */
  broth: number;
}

const t = (item: Topping, portions: number): OrderLine<Topping> => ({ item, portions });
const g = (item: Garnish, portions: number): OrderLine<Garnish> => ({ item, portions });

/** Tô thường: taught by the first customer; most implied phrases modify it. */
export const REGULAR_BOWL: ImpliedRecipe = { id: 'regular', toppings: [t('pork', 2)], garnishes: [g('scallion', 2)], broth: 2 };

export const IMPLIED_RECIPES: readonly ImpliedRecipe[] = [
  REGULAR_BOWL,
  { id: 'hungry', toppings: [t('pork', 3)], garnishes: [g('scallion', 2)], broth: 3 },
  { id: 'light', toppings: [t('pork', 1)], garnishes: [g('scallion', 1)], broth: 1 },
  { id: 'seafood', toppings: [t('pork', 2), t('shrimp', 2)], garnishes: [g('scallion', 2)], broth: 2 },
  { id: 'veggie', toppings: [t('pork', 1)], garnishes: [g('scallion', 3), g('sprouts', 2)], broth: 2 },
  { id: 'dry', toppings: [t('pork', 2)], garnishes: [g('scallion', 2)], broth: 1 },
  { id: 'soupy', toppings: [t('pork', 2)], garnishes: [g('scallion', 2)], broth: 3 },
  { id: 'nourishing', toppings: [t('pork', 2), t('liver', 2), t('quailEgg', 2)], garnishes: [g('scallion', 2)], broth: 2 },
  { id: 'spicy', toppings: [t('pork', 2)], garnishes: [g('scallion', 2), g('pepper', 3)], broth: 2 },
  { id: 'noScallion', toppings: [t('pork', 2)], garnishes: [], broth: 2 },
];
