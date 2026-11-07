import { useState } from "react";

const MOSH_URLS = {
  1: "https://mosh.jp/services/346293?openExternalBrowser=1",
  2: "https://mosh.jp/services/346379?openExternalBrowser=1",
  3: "https://mosh.jp/services/346380?openExternalBrowser=1",
  4: "https://mosh.jp/services/346381?openExternalBrowser=1",
  5: "https://mosh.jp/services/346382?openExternalBrowser=1",
  6: "https://mosh.jp/services/346384?openExternalBrowser=1",
  7: "https://mosh.jp/services/346385?openExternalBrowser=1",
  8: "https://mosh.jp/services/346386?openExternalBrowser=1",
};

const COURSES = {
  1: { title: "単発・簡易プラン", price: "9,800円", tag: "まず整理したい方へ" },
  2: { title: "恋愛特化プラン", price: "15,800円", tag: "恋愛の詰まりを解く" },
  3: { title: "金運・キャリア特化", price: "20,800円", tag: "収入・働き方を変える" },
  4: { title: "詳細サイクルプラン", price: "26,800円", tag: "数年先の地図を持つ" },
  5: { title: "3ヶ月集中プログラム", price: "43,670円", tag: "習慣ごと変える" },
  6: { title: "独立起業・インフラ構築", price: "54,670円", tag: "事業の核を作る" },
  7: { title: "プレミアム・コンサル", price: "86,900円", tag: "半年並走・全体設計" },
  8: { title: "マスターコース", price: "106,700円", tag: "人生の最終設計図" },
};

function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

function calcLifePath(dob) {
  const digits = dob.replace(/-/g, "").split("").map(Number);
  return reduceNum(digits.reduce((a, b) => a + b, 0));
}

function calcSoulUrge(romaName) {
  const vowelMap = { a:1,e:5,i:9,o:6,u:3 };
  const sum = romaName.toLowerCase().replace(/[^a-z]/g,"").split("").reduce((acc, c) => acc + (vowelMap[c] || 0), 0);
  return reduceNum(sum);
}

function calcExpression(romaName) {
  const map = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8};
  const sum = romaName.toLowerCase().replace(/[^a-z]/g,"").split("").reduce((acc, c) => acc + (map[c] || 0), 0);
  return reduceNum(sum);
}

function calcPersonality(romaName) {
  // 人格数：子音のみ合計（換算表は calcExpression と同一。母音 a,e,i,o,u を除く）
  const map = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8};
  const vowels = new Set(["a","e","i","o","u"]);
  const sum = romaName.toLowerCase().replace(/[^a-z]/g,"").split("")
    .filter(c => !vowels.has(c))
    .reduce((acc, c) => acc + (map[c] || 0), 0);
  return reduceNum(sum);
}

function calcBirthday(dob) {
  // 誕生数：生まれた「日」を還元。11日・22日はマスター保持、
  // 29日→11 のような途中還元でのマスター保持も reduceNum の仕様で自動的に満たす
  const day = Number(dob.split("-")[2]);
  return reduceNum(day);
}

function recommendCourses(theme, lifePath) {
  if (theme === "恋愛") return [2, 1];
  if (theme === "仕事・キャリア") return [3, 1];
  if (theme === "お金・収入") return [3, 4, 1];
  if (theme === "人間関係") return [1, 2];
  if (theme === "独立・起業") return [3, 1];
  if ([1,8,22].includes(lifePath)) return [3, 1];
  if ([2,6,9].includes(lifePath)) return [2, 1];
  return [1];
}

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Josefin+Sans:wght@100;300;400&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root { --gold: #b8a060; --gold-dim: rgba(184,160,96,0.12); --bg: #09090e; --surface: rgba(255,255,255,0.025); --text: #f5f0ea; --muted: #a09890; }
  body { background: var(--bg); color: var(--text); font-family: 'Josefin Sans', sans-serif; font-weight: 300; min-height: 100vh; }
  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 48px 20px 80px; background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,160,96,0.08), transparent 70%); }
  ::selection { background: rgba(184,160,96,0.35); }
  .wrap { width: 100%; max-width: 560px; }
  .header { text-align: center; margin-bottom: 48px; }
  .brand { font-size: 11px; letter-spacing: 7px; color: var(--gold); text-transform: uppercase; margin-bottom: 20px; }
  .footer { text-align: center; font-size: 8px; letter-spacing: 4px; color: var(--muted); padding: 40px 0 0; text-transform: uppercase; }
  .therapist-sig { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 300; color: var(--gold); text-align: right; letter-spacing: 3px; margin-top: -20px; margin-bottom: 36px; padding-right: 4px; }
  .logo { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(52px, 12vw, 78px); line-height: 0.88; color: var(--text); }
  .logo em { font-style: italic; color: var(--gold); }
  .subtitle { font-size: 12px; letter-spacing: 6px; color: var(--gold); font-family: 'Josefin Sans', sans-serif; font-weight: 300; margin-top: 10px; }
  .tagline { font-size: 11px; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; margin-top: 8px; }
  .rule { width: 1px; height: 36px; background: linear-gradient(to bottom, transparent, var(--gold), transparent); margin: 0 auto 40px; }
  .steps { display: flex; justify-content: center; gap: 8px; margin-bottom: 32px; }
  .step-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); transition: background 0.3s; }
  .step-dot.active { background: var(--gold); }
  .section-label { font-size: 11px; letter-spacing: 5px; color: var(--gold); text-transform: uppercase; margin-bottom: 28px; }
  .field { margin-bottom: 28px; }
  .field label { display: block; font-size: 11px; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; margin-bottom: 10px; }
  .field input, .field textarea { width: 100%; background: transparent; border: none; border-bottom: 1px solid #222018; padding: 10px 0; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; color: var(--text); outline: none; transition: border-color 0.3s; }
  .field input:focus, .field textarea:focus { border-color: var(--gold); background: rgba(184,160,96,0.03); }
  .field input::placeholder, .field textarea::placeholder { color: #5a554c; }
  .field textarea { resize: none; height: 64px; }
  .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
  .theme-btn { background: transparent; border: 1px solid #222018; color: var(--muted); padding: 13px 8px; font-family: 'Josefin Sans', sans-serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.25s; }
  .theme-btn.selected { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
  .theme-btn:hover { border-color: rgba(184,160,96,0.5); color: #d8d2c8; }
  .btn { width: 100%; background: transparent; border: 1px solid var(--gold); color: var(--gold); padding: 17px; font-family: 'Josefin Sans', sans-serif; font-size: 12px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase; cursor: pointer; transition: all 0.3s; margin-top: 8px; }
  .btn:hover:not(:disabled) { background: var(--gold); color: var(--bg); box-shadow: 0 8px 32px rgba(184,160,96,0.25); }
  .btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .loading { text-align: center; padding: 64px 0; }
  .loading-symbol { font-family: 'Cormorant Garamond', serif; font-size: 56px; color: var(--gold); animation: breathe 2s ease-in-out infinite; }
  @keyframes breathe { 0%,100% { opacity: 0.2; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }
  .loading-text { font-size: 12px; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; margin-top: 20px; }
  .loading-bar { width: 160px; height: 1px; background: #222018; margin: 24px auto 0; overflow: hidden; }
  .loading-bar::after { content: ''; display: block; width: 40%; height: 100%; background: var(--gold); animation: slide 1.2s ease-in-out infinite; }
  @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
  .result { animation: rise 0.7s ease-out; }
  @keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .result-header { text-align: center; margin-bottom: 32px; }
  .numbers-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; flex-wrap: wrap; }
  .num-item { text-align: center; }
  .num-value { font-family: 'Josefin Sans', sans-serif; font-size: 44px; font-weight: 300; color: var(--gold); line-height: 1; letter-spacing: 2px; text-shadow: 0 0 32px rgba(184,160,96,0.35); }
  .num-label { font-size: 11px; letter-spacing: 3px; color: var(--muted); text-transform: uppercase; margin-top: 4px; }
  .result-name { font-size: 12px; letter-spacing: 5px; color: var(--muted); text-transform: uppercase; margin-top: 16px; }
  .report-box { background: rgba(255,255,255,0.04); border: 1px solid var(--gold-dim); padding: 28px; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; line-height: 1.9; color: #ddd6cc; white-space: pre-wrap; margin-bottom: 36px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
  .bridge-text { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 300; line-height: 1.9; color: #c4bdb0; margin-bottom: 28px; padding: 24px; border-left: 1px solid var(--gold); }
  .course-section-label { font-size: 12px; letter-spacing: 5px; color: var(--gold); text-transform: uppercase; text-align: center; margin-bottom: 20px; }
  .course-card { border: 1px solid #222018; padding: 20px 24px; margin-bottom: 10px; transition: all 0.25s; cursor: pointer; text-decoration: none; display: block; }
  .course-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
  .result a.course-card { animation: rise 0.6s ease-out both; }
  .result a.course-card:nth-of-type(2) { animation-delay: 0.1s; }
  .result a.course-card:nth-of-type(3) { animation-delay: 0.2s; }
  .course-card.primary { border-color: var(--gold); background: var(--gold-dim); }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
  .card-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; color: var(--text); }
  .card-price { font-size: 12px; letter-spacing: 2px; color: var(--gold); white-space: nowrap; padding-top: 2px; }
  .card-tag { font-size: 11px; letter-spacing: 3px; color: var(--muted); text-transform: uppercase; }
  .card-arrow { font-size: 13px; color: var(--gold); margin-top: 10px; letter-spacing: 2px; }
  .line-box { border: 1px solid var(--gold-dim); padding: 28px 24px; text-align: center; margin-top: 32px; }
  .line-text { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 300; line-height: 1.9; color: #c4bdb0; margin-bottom: 18px; }
  .line-btn { display: inline-block; border: 1px solid var(--gold); color: var(--gold); padding: 13px 30px; font-family: 'Josefin Sans', sans-serif; font-size: 12px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; text-decoration: none; cursor: pointer; transition: all 0.3s; }
  .line-btn:hover { background: var(--gold); color: var(--bg); }
  .reset-btn { background: transparent; border: none; color: #6a6460; font-family: 'Josefin Sans', sans-serif; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; cursor: pointer; display: block; width: 100%; text-align: center; margin-top: 32px; transition: color 0.3s; }
  .reset-btn:hover { color: var(--gold); }
  .error { font-size: 10px; letter-spacing: 2px; color: #8a4040; text-align: center; margin-top: 12px; }
`;

const THEMES = ["恋愛", "仕事・キャリア", "お金・収入", "人間関係", "独立・起業", "その他"];

export default function App() {
  const [step, setStep] = useState(1);
  const [kanjiName, setKanjiName] = useState("");
  const [romaName, setRomaName] = useState("");
  const [dob, setDob] = useState("");
  const [theme, setTheme] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canStep1 = kanjiName.trim() && romaName.trim() && dob;
  const canStep2 = theme && situation.trim();

  async function handleDiagnose() {
    setLoading(true);
    setError("");
    const lp = calcLifePath(dob);
    const su = calcSoulUrge(romaName);
    const ex = calcExpression(romaName);
    const pe = calcPersonality(romaName);
    const bd = calcBirthday(dob);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kanjiName, theme, situation, lifePath: lp, soulUrge: su, expression: ex })
      });
      const data = await res.json().catch(() => ({}));
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (!res.ok || text.length < 100) {
        window.gtag?.("event", "diagnosis_error", { theme });
        setError("診断レポートを作成できませんでした。少し時間をおいて、もう一度お試しください。");
        setLoading(false);
        return;
      }
      const recommended = recommendCourses(theme, lp).filter(n => n >= 1 && n <= 4);
      setResult({ lifePath: lp, soulUrge: su, expression: ex, personality: pe, birthday: bd, report: text, recommended });
      window.gtag?.("event", "diagnosis_complete", { life_path: lp, soul_urge: su, expression: ex, theme });
      setStep(3);
    } catch (e) {
      setError("診断中に問題が生じました。もう一度お試しください。");
    }
    setLoading(false);
  }

  function reset() {
    setStep(1); setResult(null); setError("");
    setKanjiName(""); setRomaName(""); setDob(""); setTheme(""); setSituation("");
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <div className="wrap">
          <div className="header">
            <div className="brand"></div>
            <h1 className="logo">SOUL <em>CODE</em></h1>
            <p className="subtitle">宿命の調律</p>
            <p className="tagline">魂の設計図を読み解く精密鑑定</p>
          </div>
          {!loading && <div className="steps">{[1,2,3].map(s => <div key={s} className={`step-dot ${step >= s ? "active" : ""}`} />)}</div>}
          <div className="rule" />
          {step === 1 && !loading && (
            <>
              <div className="section-label">01 — 基本情報</div>
              <div className="field"><label>お名前（漢字）</label><input value={kanjiName} onChange={e => setKanjiName(e.target.value)} placeholder="例：山田 太郎" /></div>
              <div className="field"><label>お名前（ローマ字）</label><input value={romaName} onChange={e => setRomaName(e.target.value)} placeholder="例：YAMADATARO" /></div>
              <div className="field"><label>生年月日</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} min="1900-01-01" max="2099-12-31" /></div>
                      <button className="btn" onClick={() => { window.gtag?.("event", "step_next", { step_from: 1, step_to: 2 }); setStep(2); }} disabled={!canStep1}>次へ進む</button>
            </>
          )}
          {step === 2 && !loading && (
            <>
              <div className="section-label">02 — 相談テーマ</div>
              <div className="field"><label>今、最も向き合いたいテーマ</label><div className="theme-grid">{THEMES.map(t => <button key={t} className={`theme-btn ${theme === t ? "selected" : ""}`} onClick={() => setTheme(t)}>{t}</button>)}</div></div>
              <div className="field"><label>現状（1〜3行でOK）</label><textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="今、何が詰まっていますか？" /></div>
              <button className="btn" onClick={handleDiagnose} disabled={!canStep2}>設計図を診断する</button>
              <button className="reset-btn" onClick={() => { window.gtag?.("event", "step_back", { step_from: 2, step_to: 1 }); setStep(1); }}>← 基本情報に戻る</button>
              {error && <p className="error">{error}</p>}
            </>
          )}
          {loading && <div className="loading"><div className="loading-symbol">◈</div><p className="loading-text">魂の設計図を読み解いています</p><div className="loading-bar" /></div>}
          {step === 3 && result && !loading && (
            <div className="result">
              <div className="result-header">
                <div className="numbers-row">
                  <div className="num-item"><div className="num-value">{result.lifePath}</div><div className="num-label">Life Path</div></div>
                  <div className="num-item"><div className="num-value">{result.soulUrge}</div><div className="num-label">Soul Urge</div></div>
                  <div className="num-item"><div className="num-value">{result.expression}</div><div className="num-label">Expression</div></div>
                  <div className="num-item"><div className="num-value">{result.personality}</div><div className="num-label">Personality</div></div>
                  <div className="num-item"><div className="num-value">{result.birthday}</div><div className="num-label">Birthday</div></div>
                </div>
                <div className="result-name">{kanjiName} の設計図</div>
              </div>
              <div className="rule" />
              <div className="report-box">{result.report}</div>
              <div className="therapist-sig">宿命調律師　まさ</div>
              <div className="bridge-text">
                {kanjiName}さんの設計図の輪郭は、今お見せした通りです。ただし、これはまだ骨格に過ぎません。本来の鑑定では、カバラ数秘術に心理学・行動科学を融合させた独自の解析により、「なぜ今の状況が起きているか」「どの順番で何を変えるか」「いつが動き時か」を、{kanjiName}さんの現実に即して書面で設計します。以下の中から、今のあなたに最も近いものを選んでください。
              </div>
              <div className="rule" />
              <p className="course-section-label">あなたに最適な鑑定プラン</p>
              {result.recommended.map((n, i) => {
                const c = COURSES[n];
                return <a key={n} href={MOSH_URLS[n]} target="_blank" rel="noopener noreferrer" className={`course-card ${i === 0 ? "primary" : ""}`} onClick={() => window.gtag?.("event", "mosh_link_click", { course_id: n, course_title: c.title, course_price: c.price, is_primary: i === 0 })}><div className="card-top"><div className="card-title">{c.title}</div><div className="card-price">{c.price}</div></div><div className="card-tag">{c.tag}</div><div className="card-arrow">→ 詳細・お申し込み</div></a>;
              })}
              <div className="line-box">
                <p className="line-text">あなたの誕生数の深掘りと、月ごとの運気の波は、公式LINEでお届けしています。</p>
                <a className="line-btn" href="https://lin.ee/tYqWJEy?openExternalBrowser=1" target="_blank" rel="noopener noreferrer" onClick={() => window.gtag?.("event", "line_link_click", { from: "diagnosis_result" })}>公式LINEで続きを受け取る</a>
              </div>
              <button className="reset-btn" onClick={reset}>← 別の診断をする</button>
            </div>
          )}
        </div>
        <footer className="footer">© Piece Wave</footer>
      </div>
    </>
  );
}
