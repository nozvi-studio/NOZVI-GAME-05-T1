import { describe, expect, it } from 'vitest';
import { defaultBalance as B, emptyBowl, IMPLIED_RECIPES, type Bowl, type Order } from '../src/core';
import { orderProgress } from '../src/ui/orderProgress';
import { IMPLIED_PHRASE, amountWord, avoidChip, explicitOrder, leaveLine, lineText, reactionLine, spokenOrder } from '../src/ui/speech';

const order: Order = {
  toppings: [{ item: 'pork', portions: 1 }, { item: 'liver', portions: 3 }],
  garnishes: [{ item: 'scallion', portions: 3 }, { item: 'sprouts', portions: 2 }],
  broth: 1,
  avoid: { item: 'pepper', kind: 'dislike' },
  style: 'chips',
  implied: null,
  tutorial: true,
  clarified: false,
};

const bowl = (fill: (b: Bowl) => void = () => {}): Bowl => {
  const b = emptyBowl();
  fill(b);
  return b;
};

const full = (b: Bowl) => {
  b.noodles = 'good';
  b.noodleError = 0.4;
  b.broth = { fill: B.broth.levelFill[0], grade: 'bad' };
  b.toppings.pork = 1;
  b.toppings.liver = 3;
  b.garnishes.scallion = 3;
  b.garnishes.sprouts = 2;
};

// VIS-102 + MEC-006 rule 5: chips show portions given / wanted, broth against the ordered level.
describe('orderProgress', () => {
  it('counts portions per ordered line', () => {
    const p = orderProgress(order, bowl((b) => { b.toppings.liver = 2; b.garnishes.scallion = 3; }), B.broth);
    expect(p.toppings).toEqual([{ given: 0, wanted: 1 }, { given: 2, wanted: 3 }]);
    expect(p.garnishes).toEqual([{ given: 3, wanted: 3 }, { given: 0, wanted: 2 }]);
    expect(p.brothOk).toBe(false);
    expect(p.ready).toBe(false);
  });

  it('is ready only with exact amounts and the ordered broth level', () => {
    expect(orderProgress(order, bowl(full), B.broth)).toMatchObject({ brothOk: true, ready: true });
    expect(orderProgress({ ...order, broth: 3 }, bowl(full), B.broth)).toMatchObject({ brothOk: false, ready: false });
    expect(orderProgress(order, bowl((b) => { full(b); b.toppings.liver = 4; }), B.broth).ready).toBe(false);
  });

  it('is never ready while the avoided ingredient is in the bowl', () => {
    expect(orderProgress(order, bowl((b) => { full(b); b.garnishes.pepper = 1; }), B.broth).ready).toBe(false);
  });
});

// MEC-006 rules 4, 5, 13, 14: Vietnamese wording, no icons.
describe('speech', () => {
  it('words amounts and chips without icons', () => {
    expect([amountWord(1), amountWord(2), amountWord(3)]).toEqual(['Ít', '', 'Nhiều']);
    expect(lineText({ item: 'scallion', portions: 3 })).toBe('Nhiều hành');
    expect(lineText({ item: 'pork', portions: 2 })).toBe('Thịt bằm');
    expect(avoidChip({ item: 'shrimp', kind: 'allergy' })).toBe('Dị ứng tôm');
    expect(avoidChip({ item: 'pepper', kind: 'dislike' })).toBe('Không tiêu');
  });

  it('builds an explicit spoken order with broth and the avoid clause', () => {
    expect(explicitOrder(order, 0)).toBe('Cho 1 tô ít thịt bằm, nhiều gan, nhiều hành, giá, ít nước, không tiêu nha!');
    expect(explicitOrder({ ...order, broth: 2, avoid: { item: 'shrimp', kind: 'allergy' } }, 1)).toBe(
      'Một tô ít thịt bằm, nhiều gan, nhiều hành, giá, tui không ăn được tôm!',
    );
  });

  it('has a phrase for every implied recipe and appends the avoid clause', () => {
    for (const r of IMPLIED_RECIPES) expect(IMPLIED_PHRASE[r.id]).toBeTruthy();
    const o: Order = { ...order, style: 'implied', implied: 'dry', avoid: { item: 'liver', kind: 'allergy' } };
    expect(spokenOrder(o, 0)).toBe('Tô khô khô, ít nước thôi. À, tui dị ứng gan!');
  });

  it('gets harsher with the tier and names the cause', () => {
    expect(reactionLine('happy', null, 'normal', 0)).toBe('Ngon quá!');
    expect(reactionLine('complain', { kind: 'noodles', sign: 1 }, 'normal', 0)).toBe('Mì nát hết rồi, nửa tiền thôi nha!');
    expect(reactionLine('scold', { kind: 'allergy', item: 'shrimp' }, 'picky', 0)).toBe('TRỜI ĐẤT ƠI! Tui dị ứng tôm mà!! Không trả đồng nào!');
    expect(leaveLine('normal', 0)).toBe('Lâu quá, thôi đi chỗ khác!');
  });

  it('contains no emoji in any line', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    const lines = [
      ...Object.values(IMPLIED_PHRASE),
      explicitOrder(order, 2),
      ...(['happy', 'ok', 'grumble', 'complain', 'scold'] as const).map((r) => reactionLine(r, { kind: 'broth', sign: -1 }, 'picky', 1)),
      leaveLine('picky', 0),
    ];
    for (const l of lines) expect(l).not.toMatch(emoji);
  });
});

// MEC-007 rules 4-6.
import { INTRO, TIPS, firstBowlLine, firstDayLine, tutorialCaption } from '../src/ui/tutorial';

describe('tutorial captions', () => {
  const base: Order = { toppings: [{ item: 'pork', portions: 2 }], garnishes: [{ item: 'scallion', portions: 2 }], broth: 2, avoid: null, style: 'chips', implied: null, tutorial: true, clarified: false };

  it('walks the first customer step by step while the clock is frozen', () => {
    expect(tutorialCaption({ frozen: true, hint: 'basket', tutorialOrder: base })).toBe('Mì có trong giá rồi, cầm rồi trụng đi, tới khi ông bà mách dừng thì dừng.');
    expect(tutorialCaption({ frozen: true, hint: 'bowl', tutorialOrder: base })).toBe('Rồi bỏ vào trong tô.');
    expect(tutorialCaption({ frozen: true, hint: 'toppings', tutorialOrder: base })).toBe('Nhìn người ta yêu cầu mà bỏ vô, lấy từng phần mỗi lần.');
    expect(tutorialCaption({ frozen: true, hint: 'pot', tutorialOrder: base })).toBe('Chan đi.');
    expect(tutorialCaption({ frozen: true, hint: 'garnishes', tutorialOrder: base })).toBe('Thêm tí gia vị, nhớ làm theo ý khách.');
    expect(tutorialCaption({ frozen: true, hint: 'table', tutorialOrder: base })).toMatch(/chưa tính giờ/);
  });

  it('explains what is new in the 2nd and 3rd tutorial orders', () => {
    expect(tutorialCaption({ frozen: false, hint: 'basket', tutorialOrder: { ...base, avoid: { item: 'shrimp', kind: 'allergy' } } })).toMatch(/dị ứng/);
    expect(tutorialCaption({ frozen: false, hint: 'basket', tutorialOrder: { ...base, broth: 3 } })).toMatch(/Nhiều nước/);
    expect(tutorialCaption({ frozen: false, hint: 'basket', tutorialOrder: { ...base, toppings: [{ item: 'pork', portions: 1 }] } })).toBe('Lấy từng phần nhé, khách ăn ít thì lấy một phần thôi. Khách ăn nhiều thì lấy ba phần là đủ rồi.');
  });

  it('stays silent once no tutorial customer waits', () => {
    expect(tutorialCaption({ frozen: false, hint: 'basket', tutorialOrder: null })).toBeNull();
  });

  it('first-bowl verdict: perfect / small miss / far off', () => {
    expect(firstBowlLine(true, 'happy')).toBe('Có tiềm năng, bán tiếp đi biết đâu xây biệt thự.');
    expect(firstBowlLine(false, 'ok')).toBe('Để ý khách nhé, nhiều người khó tính họ bỏ về đó.');
    expect(firstBowlLine(false, 'grumble')).toBe('Để ý khách nhé, nhiều người khó tính họ bỏ về đó.');
    expect(firstBowlLine(false, 'scold')).toMatch(/^Có tiền năng nha/);
  });

  it('day-1 verdict: met / at least 200 / below', () => {
    expect(firstDayLine(360, 350, 200)).toBe('Thằng này được, mới tập tành buôn bán mà giỏi dữ.');
    expect(firstDayLine(200, 350, 200)).toBe('Ngày mai cố gắng thêm nhé, ngày đầu nhẹ nhàng thôi.');
    expect(firstDayLine(199, 350, 200)).toBe('Chà cần cải thiện thêm nha bây, buôn bán kiểu này không đủ tiền hụi.');
  });

  it('uses no emoji', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const t of [...Object.values(TIPS), INTRO]) expect(t).not.toMatch(emoji);
  });
});
