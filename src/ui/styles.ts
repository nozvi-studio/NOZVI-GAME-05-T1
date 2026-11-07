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
.htg-chip.g { background: #d9efd2; }
.htg-bubble .tag { position: absolute; top: -10px; right: -6px; background: #8e5ad1; color: #fff; border-radius: 8px; padding: 0 6px; font-size: 11px; }
.htg-patience { height: 7px; background: #ddd; border-radius: 4px; overflow: hidden; }
.htg-patience > div { height: 100%; border-radius: 4px; transition: background-color .3s; }
.htg-gauge { position: absolute; width: 26px; height: 150px; transform: translate(-50%, -100%); background: rgba(28,18,12,.85);
  border: 2px solid #fff7ea; border-radius: 8px; overflow: hidden; }
.htg-gauge .zone { position: absolute; left: 0; right: 0; }
.htg-gauge .good { background: #e8c547; }
.htg-gauge .perfect { background: #3fbf5a; }
.htg-gauge .needle { position: absolute; left: -2px; right: -2px; height: 4px; background: #fff; box-shadow: 0 0 4px #000; margin-bottom: -2px; }
.htg-gauge .label { position: absolute; left: 50%; bottom: 100%; }
.htg-gauge-label { position: absolute; transform: translate(-50%, 6px); font-weight: 700; font-size: 13px; text-shadow: 0 1px 3px #000; }
.htg-float { position: absolute; transform: translate(-50%, -50%); font-weight: 800; font-size: clamp(16px, min(3vw, 6vh), 28px); color: #ffd36b;
  text-shadow: 0 2px 4px #000; animation: htg-float 1.2s ease-out forwards; white-space: nowrap; }
.htg-float.small { font-size: clamp(14px, 2.2vw, 20px); color: #fff7ea; }
@keyframes htg-float { from { opacity: 1; margin-top: 0; } to { opacity: 0; margin-top: -60px; } }
.htg-hint { position: absolute; width: 64px; height: 64px; margin: -32px 0 0 -32px; border: 4px solid #ffd36b; border-radius: 50%;
  box-shadow: 0 0 12px #ffd36b; animation: htg-pulse 1s ease-in-out infinite; }
.htg-hint::after { content: "👆"; position: absolute; left: 34px; top: 30px; font-size: 30px; }
@keyframes htg-pulse { 0%,100% { transform: scale(.8); opacity: .9; } 50% { transform: scale(1.15); opacity: .5; } }
.htg-label { position: absolute; transform: translate(-50%, 0); background: rgba(28,18,12,.75); border-radius: 6px; padding: 0 5px;
  font-size: clamp(9px, min(1.5vw, 3vh), 13px); font-weight: 600; white-space: nowrap; }
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
