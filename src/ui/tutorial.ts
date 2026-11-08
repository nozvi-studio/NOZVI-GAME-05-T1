import type { HintTarget, Order } from '../core/types';

// MEC-007 rules 4-6: one-line tutorial captions for the first three customers, and one-time tips later.

export interface TutorialState {
  /** The day clock is frozen for the first customer. */
  frozen: boolean;
  /** What the player should touch next (from `DaySim.nextHint`). */
  hint: HintTarget;
  /** Order of the first waiting tutorial customer, if any. */
  tutorialOrder: Order | null;
}

const FIRST: Partial<Record<Exclude<HintTarget, null>, string>> = {
  basket: 'Nhấn giữ rổ mì để trụng, thả tay khi kim vào vùng xanh.',
  bowl: 'Kéo rổ mì thả vào tô.',
  toppings: 'Chạm khay thịt bằm 2 lần: vừa = 2 phần.',
  pot: 'Nhấn giữ nồi để chan nước, thả tay ở vùng xanh.',
  garnishes: 'Chạm hũ hành 2 lần.',
  table: 'Kéo tô ra bàn của khách. Khách đầu chưa tính giờ!',
};

/** Caption for the tutorial bar, or null when no tutorial customer is waiting. */
export function tutorialCaption(s: TutorialState): string | null {
  if (s.frozen) return s.hint ? FIRST[s.hint] ?? null : 'Khách đang tới, chờ chút nhé.';
  const o = s.tutorialOrder;
  if (!o) return null;
  if (o.avoid) return o.avoid.kind === 'allergy' ? 'Khách dị ứng một món: tuyệt đối đừng bỏ món đó vào!' : 'Khách dặn "Không ...": đừng bỏ món đó vào tô.';
  if (o.broth !== 2) return 'Ít nước / Nhiều nước: thả tay khi kim vào vùng xanh của mức đó.';
  if ([...o.toppings, ...o.garnishes].some((l) => l.portions !== 2)) return 'Ít = chạm 1 lần, vừa = 2 lần, nhiều = 3 lần. Số đếm cho biết đã đủ chưa.';
  return 'Nấu theo đơn: chip chuyển xanh là đủ phần.';
}

/** One-time tips shown as a toast (MEC-007 rule 6). */
export const TIPS = {
  clockStarts: 'Bắt đầu tính giờ! Phục vụ thật nhanh và đúng ý khách.',
  tutorialDone: 'Hết hướng dẫn: từ giờ không còn số đếm và vùng xanh. Đọc kỹ đơn nhé!',
  firstSpoken: 'Khách gọi món bằng lời: đọc kỹ câu để nấu đúng.',
  firstImplied: 'Tô thường = thịt bằm vừa, hành vừa, vừa nước.',
} as const;
