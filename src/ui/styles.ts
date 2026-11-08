// DOM overlay styles (GDD §10: high contrast, readable on a 5" phone in landscape).
const CSS = `
.htg-ui { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #fff7ea; user-select: none; -webkit-user-select: none; overflow: hidden; }
.htg-hud { position: absolute; top: 10px; left: 12px; right: 12px; display: flex; justify-content: space-between; gap: 12px; }
.htg-pill { background: rgba(28, 18, 12, 0.82); border: 2px solid #e8b04a; border-radius: 14px; padding: 6px 14px;
  font-weight: 700; font-size: clamp(12px, min(2.4vw, 4.2vh), 20px); white-space: nowrap; }
.htg-pill b { color: #ffd36b; }
.htg-pill.low { border-color: #e04848; }
.htg-bubble { position: absolute; transform: translate(-50%, -100%); background: #fffaf0; color: #2a1a12; border-radius: 12px;
  padding: 6px 8px 8px; min-width: 96px; box-shadow: 0 3px 10px rgba(0,0,0,.45); font-size: clamp(10px, min(1.7vw, 3.4vh), 14px); font-weight: 600; }
.htg-bubble::after { content: ""; position: absolute; left: 50%; bottom: -8px; margin-left: -8px; border: 8px solid transparent;
  border-bottom: 0; border-top-color: #fffaf0; }
.htg-bubble .row { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 3px; }
.htg-chip { background: #f3e2c0; border-radius: 8px; padding: 1px 6px; white-space: nowrap; }
.htg-chip.g { background: #ebe4d3; } /* neutral: green means "amount exact" only (MEC-006 rule 5) */
.htg-chip .n { font-weight: 800; color: #7a5a3a; }
.htg-chip.done { background: #bfe6b4; color: #1f5e2a; }
.htg-chip.no { background: #eee3dc; color: #6b3a2a; }
.htg-chip.w { background: #f2dfb8; }
.htg-bubble.spoken { min-width: min(24vw, 160px); max-width: min(31vw, 260px); } /* three must fit side by side */
/* Short landscape phones: three bubbles must fit side by side (MEC-005 chips are wider). */
@media (max-height: 480px) {
  .htg-bubble { max-width: 31vw; padding: 4px 6px 6px; }
  .htg-bubble.spoken { min-width: 0; max-width: 31vw; }
  .htg-chip { padding: 0 4px; }
}
.htg-bubble .say { font-style: italic; font-weight: 700; line-height: 1.25; margin-bottom: 4px; }
.htg-say { position: absolute; transform: translate(-50%, -100%); background: #fffaf0; color: #2a1a12; border-radius: 12px; padding: 5px 10px;
  max-width: 240px; font-weight: 800; font-size: clamp(12px, min(1.8vw, 3.6vh), 16px); text-align: center; box-shadow: 0 3px 10px rgba(0,0,0,.45);
  border: 2px solid #9a8a70; animation: htg-say 2.8s ease-out forwards; }
.htg-say.happy { border-color: #3fbf5a; }
.htg-say.grumble { border-color: #d6b24a; }
.htg-say.leave { border-color: #8a7a6a; font-style: italic; }
.htg-say.complain { border: 3px solid #e8762a; }
.htg-say.scold { border: 3px solid #e04848; background: #fff0ee; color: #8a1f1f; }
@keyframes htg-say { 0% { opacity: 0; margin-top: 8px; } 10%, 80% { opacity: 1; margin-top: 0; } 100% { opacity: 0; margin-top: -10px; } }
.htg-bubble.ready { box-shadow: 0 0 0 3px #3fbf5a, 0 3px 10px rgba(0,0,0,.45); }
.htg-bubble .tag { position: absolute; top: -10px; right: -6px; background: #8e5ad1; color: #fff; border-radius: 8px; padding: 0 6px; font-size: 11px; }
.htg-patience { height: 7px; background: #ddd; border-radius: 4px; overflow: hidden; }
.htg-patience > div { height: 100%; border-radius: 4px; transition: background-color .3s; }
.htg-gauge { position: absolute; width: 26px; height: 150px; transform: translate(-50%, -100%); background: rgba(28,18,12,.85);
  border: 2px solid #fff7ea; border-radius: 8px; overflow: hidden; }
.htg-gauge .zone { position: absolute; left: 0; right: 0; }
.htg-gauge .good { background: #e8c547; }
.htg-gauge .perfect { background: #3fbf5a; }
.htg-gauge .tick { position: absolute; left: 0; right: 0; height: 2px; background: rgba(255,247,234,.85); }
.htg-gauge .tick { font-size: 10px; line-height: 0; text-indent: 30px; white-space: nowrap; color: #fff7ea; text-shadow: 0 1px 2px #000; }
.htg-gauge { overflow: visible; }
.htg-gauge .needle { position: absolute; left: -2px; right: -2px; height: 4px; background: #fff; box-shadow: 0 0 4px #000; margin-bottom: -2px; }
.htg-gauge .label { position: absolute; left: 50%; bottom: 100%; }
.htg-gauge-label { position: absolute; transform: translate(-50%, 6px); font-weight: 700; font-size: 13px; text-shadow: 0 1px 3px #000; }
.htg-float { position: absolute; transform: translate(-50%, -50%); font-weight: 800; font-size: clamp(16px, min(3vw, 6vh), 28px); color: #ffd36b;
  text-shadow: 0 2px 4px #000; animation: htg-float 1.2s ease-out forwards; white-space: nowrap; }
.htg-float.small { font-size: clamp(14px, 2.2vw, 20px); color: #fff7ea; }
@keyframes htg-float { from { opacity: 1; margin-top: 0; } to { opacity: 0; margin-top: -60px; } }
.htg-hint { position: absolute; width: 64px; height: 64px; margin: -32px 0 0 -32px; border: 4px solid #ffd36b; border-radius: 50%;
  box-shadow: 0 0 12px #ffd36b; animation: htg-pulse 1s ease-in-out infinite; }
@keyframes htg-pulse { 0%,100% { transform: scale(.8); opacity: .9; } 50% { transform: scale(1.15); opacity: .5; } }
.htg-label { position: absolute; transform: translate(-50%, 0); background: rgba(28,18,12,.86); border: 1.5px solid rgba(255,214,140,.55);
  border-radius: 999px; padding: 1px 8px; color: #fff7ea; box-shadow: 0 1px 4px rgba(0,0,0,.5);
  font-size: clamp(12px, min(1.7vw, 3.4vh), 15px); font-weight: 700; white-space: nowrap; }
/* Short landscape phones: tighter counter labels. */
@media (max-height: 480px) { .htg-label { padding: 0 6px; } }
.htg-rotate { position: absolute; inset: 0; z-index: 10; display: none; flex-direction: column; align-items: center; justify-content: center;
  gap: 18px; padding: 24px; text-align: center; background: rgba(14, 9, 6, .96); pointer-events: auto; }
.htg-rotate .phone { width: 56px; height: 96px; border: 5px solid #ffd36b; border-radius: 12px; position: relative;
  animation: htg-rotate-phone 2.4s ease-in-out infinite; }
.htg-rotate .phone::after { content: ""; position: absolute; left: 50%; bottom: 6px; width: 16px; height: 4px; margin-left: -8px;
  border-radius: 2px; background: #ffd36b; }
.htg-rotate .title { font-size: 22px; font-weight: 800; color: #fff7ea; max-width: 16em; }
.htg-rotate .sub { font-size: 14px; color: #d9c7a8; max-width: 18em; }
@keyframes htg-rotate-phone { 0%, 20% { transform: rotate(0deg); } 55%, 80% { transform: rotate(-90deg); } 100% { transform: rotate(0deg); } }
.htg-tut { position: absolute; top: 56px; left: 50%; transform: translateX(-50%); max-width: min(50vw, 520px); z-index: 3;
  background: rgba(255,250,240,.96); color: #2a1a12; border: 2px solid #e8b04a; border-radius: 12px; padding: 5px 12px; text-align: center;
  font-weight: 700; font-size: clamp(12px, min(1.7vw, 3.4vh), 16px); box-shadow: 0 3px 10px rgba(0,0,0,.45); }
.htg-tut.anchored { transform: translate(-50%, -100%); max-width: min(56vw, 380px); }
.htg-toasts { position: absolute; left: 50%; top: 34%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; align-items: center; z-index: 4; }
.htg-toast { background: rgba(28,18,12,.9); color: #fff7ea; border: 2px solid #ffd36b; border-radius: 14px; padding: 8px 16px; max-width: min(70vw, 560px);
  text-align: center; font-weight: 800; font-size: clamp(13px, min(2vw, 4vh), 20px); animation: htg-toast 4.5s ease-out forwards; }
@keyframes htg-toast { 0% { opacity: 0; transform: scale(.9); } 8%, 82% { opacity: 1; transform: scale(1); } 100% { opacity: 0; } }
.htg-summary { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(10,6,4,.6);
  pointer-events: auto; }
.htg-card { background: #fffaf0; color: #2a1a12; border-radius: 18px; padding: 18px 28px; min-width: 260px; text-align: center;
  box-shadow: 0 8px 30px rgba(0,0,0,.6); }
.htg-card h1 { margin: 0 0 4px; font-size: 28px; }
.htg-card .verdict { font-weight: 700; margin-bottom: 10px; }
.htg-card .verdict.win { color: #2e8b3e; }
.htg-card .verdict.lose { color: #c0392b; }
.htg-card table { margin: 0 auto 14px; border-collapse: collapse; font-size: 16px; }
.htg-card td { padding: 2px 10px; text-align: left; }
.htg-card td + td { text-align: right; font-weight: 700; }
.htg-card button { font: inherit; font-size: 20px; font-weight: 800; padding: 10px 34px; border: 0; border-radius: 12px; background: #e8b04a;
  color: #2a1a12; cursor: pointer; }
`;

export function injectStyles(): void {
  if (document.getElementById('htg-style')) return;
  const style = document.createElement('style');
  style.id = 'htg-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}
