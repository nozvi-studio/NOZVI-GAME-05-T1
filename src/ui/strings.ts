import type { Garnish, Grade, Topping } from '../core/types';

// Player-facing strings (Vietnamese, GDD §10). Code identifiers stay English.
export const STR = {
  revenue: 'Doanh thu',
  day: 'Ngày',
  target: 'Mục tiêu',
  timeLeft: 'Còn',
  dayEnded: 'Hết ngày!',
  won: 'Đạt mục tiêu! Giỏi lắm!',
  lost: 'Chưa đạt mục tiêu.',
  served: 'Tô đã bán',
  perfect: 'Tô hoàn hảo',
  lostCustomers: 'Khách bỏ đi',
  playAgain: 'Bán lại',
  hurried: 'Vội!',
  blanch: 'Trụng',
  broth: 'Chan nước',
  bowl: 'Tô',
  trash: 'Bỏ',
  no: 'Không',
  full: 'Tối đa!',
  notTimed: 'Chưa tính giờ',
  askAgain: 'Hỏi lại',
  start: 'Bắt đầu',
  tryIt: 'Để tôi thử',
  moreTables: 'Quán đông khách: ngày mai thêm 1 bàn!',
  brothLevels: ['ít', 'vừa', 'nhiều'],
  rotateTitle: 'Xoay ngang điện thoại để chơi',
  rotateSub: 'Game tạm dừng cho đến khi bạn xoay ngang',
  webglLost: 'Mất kết nối đồ họa. Tải lại trang?',
  reload: 'Tải lại',
} as const;

export const TOPPING_LABEL: Record<Topping, string> = {
  pork: 'Thịt bằm',
  shrimp: 'Tôm',
  liver: 'Gan',
  quailEgg: 'Trứng cút',
};

export const GARNISH_LABEL: Record<Garnish, string> = {
  scallion: 'Hành',
  pepper: 'Tiêu',
  sprouts: 'Giá',
};

export const GRADE_LABEL: Record<Grade, string> = {
  perfect: 'Hoàn hảo!',
  good: 'Tốt',
  bad: 'Hỏng',
};

/** Money is in thousand VND (MEC-004 §5): 30 → "30k". */
export const money = (n: number): string => `${Math.round(n)}k`;

/** Seconds → "m:ss". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
