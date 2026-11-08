import type { HintTarget, Order, Reaction } from '../core/types';

// MEC-007 rules 4-6: one-line tutorial captions for the first three customers, and one-time tips later.

export interface TutorialState {
  /** The day clock is frozen for the first customer. */
  frozen: boolean;
  /** What the player should touch next (from `DaySim.nextHint`). */
  hint: HintTarget;
  /** Order of the first waiting tutorial customer, if any. */
  tutorialOrder: Order | null;
}

// Owner wording (2026-11-08), in order. Player-facing Vietnamese.
const FIRST: Partial<Record<Exclude<HintTarget, null>, string>> = {
  basket: 'Mì có trong giá rồi, cầm rồi trụng đi, tới khi ông bà mách dừng thì dừng.',
  bowl: 'Rồi bỏ vào trong tô.',
  toppings: 'Nhìn người ta yêu cầu mà bỏ vô, lấy từng phần mỗi lần.',
  pot: 'Chan đi.',
  garnishes: 'Thêm tí gia vị, nhớ làm theo ý khách.',
  table: 'Kéo tô ra bàn của khách. Khách đầu chưa tính giờ!',
};

/** Opening line of the first day (MEC-007 rule 4a). */
export const INTRO = 'Tích góp bấy lâu nay cuối cùng cũng mở được quán hủ tiếu nhỉ. Chắc gì đã biết bán, coi rồi làm theo nè.';

/** What the elders call out when the blanch needle is in the green zone, for the first customer. */
export const STOP_CUE = 'Dừng!';

/** Verdict after the first bowl (MEC-007 rule 4b): perfect / small miss / far off. */
export function firstBowlLine(perfect: boolean, reaction: Reaction): string {
  if (perfect) return 'Có tiềm năng, bán tiếp đi biết đâu xây biệt thự.';
  if (reaction === 'complain' || reaction === 'scold') return 'Có tiền năng nha, tiền năng về nhà bấm điện thoại tiếp chứ buôn bán gì nữa.';
  return 'Để ý khách nhé, nhiều người khó tính họ bỏ về đó.';
}

/** Verdict at the end of day 1 (MEC-007 rule 4c): target met / at least `fair` / below. */
export function firstDayLine(revenue: number, target: number, fair: number): string {
  if (revenue >= target) return 'Thằng này được, mới tập tành buôn bán mà giỏi dữ.';
  if (revenue >= fair) return 'Ngày mai cố gắng thêm nhé, ngày đầu nhẹ nhàng thôi.';
  return 'Chà cần cải thiện thêm nha bây, buôn bán kiểu này không đủ tiền hụi.';
}

/** Caption for the tutorial bar, or null when no tutorial customer is waiting. */
export function tutorialCaption(s: TutorialState): string | null {
  if (s.frozen) return s.hint ? FIRST[s.hint] ?? null : 'Khách đang tới, chờ chút nhé.';
  const o = s.tutorialOrder;
  if (!o) return null;
  if (o.avoid) return o.avoid.kind === 'allergy' ? 'Khách dị ứng một món: tuyệt đối đừng bỏ món đó vào!' : 'Khách dặn "Không ...": đừng bỏ món đó vào tô.';
  if (o.broth !== 2) return 'Ít nước / Nhiều nước: thả tay khi kim vào vùng xanh của mức đó.';
  if ([...o.toppings, ...o.garnishes].some((l) => l.portions !== 2)) return 'Lấy từng phần nhé, khách ăn ít thì lấy một phần thôi. Khách ăn nhiều thì lấy ba phần là đủ rồi.';
  return 'Nấu theo đơn: chip chuyển xanh là đủ phần.';
}

/** One-time tips shown as a toast (MEC-007 rule 6). */
export const TIPS = {
  clockStarts: 'Bắt đầu tính giờ! Phục vụ thật nhanh và đúng ý khách.',
  tutorialDone: 'Hết hướng dẫn: từ giờ không còn số đếm và vùng xanh. Đọc kỹ đơn nhé!',
  firstSpoken: 'Khách gọi món bằng lời: đọc kỹ câu để nấu đúng.',
  firstImplied: 'Tô thường = thịt bằm vừa, hành vừa, vừa nước.',
} as const;
