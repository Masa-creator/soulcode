import { useReducer, useEffect } from 'react';

function getIntervalPoint(pts) { return pts === 21 ? 11 : 8; }
function getMaxPoint(pts) { return pts === 21 ? 30 : 17; }

function checkGameWin(a, b, pts) {
  const max = getMaxPoint(pts);
  if (a >= max) return 'A';
  if (b >= max) return 'B';
  if (a >= pts && a - b >= 2) return 'A';
  if (b >= pts && b - a >= 2) return 'B';
  return null;
}

const INITIAL = {
  phase: 'setup',
  mode: 'singles',
  playerA: '',
  playerA2: '',
  playerB: '',
  playerB2: '',
  gamePoints: 21,
  intervalMins: 1,
  currentGame: 1,
  gameResults: [],
  score: { a: 0, b: 0 },
  history: [],
  serveA: true,
  midIntervalDone: false,
  timerSecs: 0,
  intervalType: null,
  matchWinner: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.key]: action.value };

    case 'START':
      return {
        ...INITIAL,
        mode: state.mode,
        playerA: state.playerA,
        playerA2: state.playerA2,
        playerB: state.playerB,
        playerB2: state.playerB2,
        gamePoints: state.gamePoints,
        intervalMins: state.intervalMins,
        phase: 'playing',
      };

    case 'POINT': {
      const { player } = action;
      const newScore = {
        a: player === 'A' ? state.score.a + 1 : state.score.a,
        b: player === 'B' ? state.score.b + 1 : state.score.b,
      };
      const newServeA = player === 'A';
      const snap = {
        score: { ...state.score },
        serveA: state.serveA,
        midIntervalDone: state.midIntervalDone,
        gameResults: [...state.gameResults],
        currentGame: state.currentGame,
      };
      const newHistory = [...state.history, snap];

      const winner = checkGameWin(newScore.a, newScore.b, state.gamePoints);
      if (winner) {
        const newResults = [...state.gameResults, { a: newScore.a, b: newScore.b, winner }];
        const winsA = newResults.filter(r => r.winner === 'A').length;
        const winsB = newResults.filter(r => r.winner === 'B').length;

        if (winsA === 2 || winsB === 2) {
          return { ...state, phase: 'matchOver', score: newScore, gameResults: newResults, matchWinner: winsA === 2 ? 'A' : 'B', history: newHistory, serveA: newServeA };
        }
        return { ...state, phase: 'interval', intervalType: 'betweengames', timerSecs: state.intervalMins * 60, score: newScore, gameResults: newResults, serveA: newServeA, history: newHistory };
      }

      const intPt = getIntervalPoint(state.gamePoints);
      const newMax = Math.max(newScore.a, newScore.b);
      const oldMax = Math.max(state.score.a, state.score.b);
      if (!state.midIntervalDone && oldMax < intPt && newMax >= intPt) {
        return { ...state, phase: 'interval', intervalType: 'midgame', timerSecs: state.intervalMins * 60, score: newScore, serveA: newServeA, midIntervalDone: true, history: newHistory };
      }

      return { ...state, score: newScore, serveA: newServeA, history: newHistory };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const snap = state.history[state.history.length - 1];
      return { ...state, phase: 'playing', score: snap.score, serveA: snap.serveA, midIntervalDone: snap.midIntervalDone, gameResults: snap.gameResults, currentGame: snap.currentGame, history: state.history.slice(0, -1), timerSecs: 0, intervalType: null, matchWinner: null };
    }

    case 'TICK':
      return state.timerSecs > 0 ? { ...state, timerSecs: state.timerSecs - 1 } : state;

    case 'RESUME':
      if (state.intervalType === 'betweengames') {
        const lastWinner = state.gameResults[state.gameResults.length - 1]?.winner;
        return { ...state, phase: 'playing', currentGame: state.currentGame + 1, score: { a: 0, b: 0 }, midIntervalDone: false, timerSecs: 0, intervalType: null, serveA: lastWinner === 'A' };
      }
      return { ...state, phase: 'playing', timerSecs: 0, intervalType: null };

    case 'RESET':
      return INITIAL;

    default:
      return state;
  }
}

const C = {
  blue: '#3b82f6',
  red: '#ef4444',
  blueDark: '#1d4ed8',
  redDark: '#b91c1c',
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#273549',
  text: '#f1f5f9',
  muted: '#94a3b8',
  gold: '#f59e0b',
  green: '#10b981',
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const nameInpStyle = { width: '100%', padding: '13px 16px 13px 34px', background: C.surfaceAlt, border: `2px solid ${C.surface}`, borderRadius: 12, color: C.text, fontSize: 17, outline: 'none', boxSizing: 'border-box' };

function NameInput({ color, value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: color }} />
      <input value={value} onChange={onChange} placeholder={placeholder} style={nameInpStyle} />
    </div>
  );
}

function SetupScreen({ state, dispatch }) {
  const isDoubles = state.mode === 'doubles';
  const canStart = isDoubles
    ? state.playerA.trim() && state.playerA2.trim() && state.playerB.trim() && state.playerB2.trim()
    : state.playerA.trim() && state.playerB.trim();

  const set = (key) => (e) => dispatch({ type: 'SET', key, value: e.target.value });

  return (
    <div style={{ padding: '32px 20px', maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 48 }}>🏸</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '8px 0 4px', letterSpacing: 1 }}>バドミントン</h1>
        <p style={{ color: C.muted, fontSize: 14, letterSpacing: 2 }}>SCORE SHEET</p>

      </div>

      <section style={{ marginBottom: 28 }}>
        <label style={labelStyle}>種目</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['singles', 'シングルス'], ['doubles', 'ダブルス']].map(([val, label]) => (
            <button key={val} onClick={() => dispatch({ type: 'SET', key: 'mode', value: val })}
              style={{ padding: '15px 0', borderRadius: 12, border: `2px solid ${state.mode === val ? C.gold : C.surface}`, background: state.mode === val ? 'rgba(245,158,11,0.12)' : C.surfaceAlt, color: state.mode === val ? C.gold : C.muted, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <label style={labelStyle}>{isDoubles ? 'チーム A（青）' : '選手名'}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NameInput color={C.blue} value={state.playerA} onChange={set('playerA')} placeholder={isDoubles ? 'チーム A — 選手 1' : '選手 A の名前'} />
          {isDoubles && <NameInput color={C.blue} value={state.playerA2} onChange={set('playerA2')} placeholder="チーム A — 選手 2" />}
        </div>
        {isDoubles && <div style={{ height: 16 }} />}
        {isDoubles && <label style={{ ...labelStyle, marginTop: 4 }}>チーム B（赤）</label>}
        {!isDoubles && <div style={{ height: 10 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: isDoubles ? 0 : 0 }}>
          {!isDoubles && <NameInput color={C.red} value={state.playerB} onChange={set('playerB')} placeholder="選手 B の名前" />}
          {isDoubles && <NameInput color={C.red} value={state.playerB} onChange={set('playerB')} placeholder="チーム B — 選手 1" />}
          {isDoubles && <NameInput color={C.red} value={state.playerB2} onChange={set('playerB2')} placeholder="チーム B — 選手 2" />}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <label style={labelStyle}>ゲームポイント</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[15, 21].map(pts => (
            <button key={pts} onClick={() => dispatch({ type: 'SET', key: 'gamePoints', value: pts })}
              style={{ padding: '16px 0', borderRadius: 12, border: `2px solid ${state.gamePoints === pts ? C.gold : C.surface}`, background: state.gamePoints === pts ? 'rgba(245,158,11,0.12)' : C.surfaceAlt, color: state.gamePoints === pts ? C.gold : C.muted, fontSize: 20, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {pts}点
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <label style={labelStyle}>インターバル時間</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2].map(m => (
            <button key={m} onClick={() => dispatch({ type: 'SET', key: 'intervalMins', value: m })}
              style={{ padding: '16px 0', borderRadius: 12, border: `2px solid ${state.intervalMins === m ? C.gold : C.surface}`, background: state.intervalMins === m ? 'rgba(245,158,11,0.12)' : C.surfaceAlt, color: state.intervalMins === m ? C.gold : C.muted, fontSize: 20, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {m}分
            </button>
          ))}
        </div>
      </section>

      <button onClick={() => dispatch({ type: 'START' })} disabled={!canStart}
        style={{ width: '100%', padding: '18px 0', borderRadius: 14, border: 'none', background: canStart ? C.green : C.surface, color: canStart ? '#fff' : C.muted, fontSize: 18, fontWeight: 700, cursor: canStart ? 'pointer' : 'not-allowed', letterSpacing: 2, transition: 'all 0.2s' }}>
        ゲーム開始
      </button>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, letterSpacing: 3, color: C.muted, textTransform: 'uppercase', marginBottom: 12 };

function getTeamNames(state) {
  if (state.mode === 'doubles') {
    return {
      a: [state.playerA, state.playerA2].filter(Boolean).join(' / ') || 'チーム A',
      b: [state.playerB, state.playerB2].filter(Boolean).join(' / ') || 'チーム B',
      a1: state.playerA || 'チーム A',
      a2: state.playerA2 || '',
      b1: state.playerB || 'チーム B',
      b2: state.playerB2 || '',
    };
  }
  return {
    a: state.playerA || '選手 A',
    b: state.playerB || '選手 B',
    a1: state.playerA || '選手 A',
    a2: '',
    b1: state.playerB || '選手 B',
    b2: '',
  };
}

function GameScoreRow({ gameResults, playerA, playerB }) {
  if (gameResults.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {gameResults.map((r, i) => (
        <div key={i} style={{ background: C.surfaceAlt, borderRadius: 8, padding: '4px 12px', fontSize: 13, color: C.muted }}>
          <span style={{ color: r.winner === 'A' ? C.blue : C.muted, fontWeight: r.winner === 'A' ? 700 : 400 }}>{r.a}</span>
          <span style={{ margin: '0 4px', color: C.surface }}>—</span>
          <span style={{ color: r.winner === 'B' ? C.red : C.muted, fontWeight: r.winner === 'B' ? 700 : 400 }}>{r.b}</span>
        </div>
      ))}
    </div>
  );
}

function PlayingScreen({ state, dispatch }) {
  const winsA = state.gameResults.filter(r => r.winner === 'A').length;
  const winsB = state.gameResults.filter(r => r.winner === 'B').length;
  const names = getTeamNames(state);
  const nameA = names.a;
  const nameB = names.b;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '16px 0 0' }}>
      {/* Header */}
      <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.muted, letterSpacing: 3 }}>GAME {state.currentGame}</span>
          <span style={{ fontSize: 10, color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4, padding: '1px 6px', letterSpacing: 1 }}>{state.mode === 'doubles' ? 'ダブルス' : 'シングルス'}</span>
        </div>
        <GameScoreRow gameResults={state.gameResults} playerA={nameA} playerB={nameB} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: winsA > i ? C.blue : C.surfaceAlt, marginTop: 1 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: winsB > i ? C.red : C.surfaceAlt, marginTop: 1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Score area - takes most of screen */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Player A button */}
        <button onClick={() => dispatch({ type: 'POINT', player: 'A' })}
          style={{ background: 'rgba(59,130,246,0.08)', border: 'none', borderRight: `1px solid ${C.surfaceAlt}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '24px 8px', minHeight: 320, userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', transition: 'background 0.1s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.blue, fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names.a1}</span>
              {state.serveA && <span style={{ fontSize: 14 }}>🏸</span>}
            </div>
            {names.a2 && <span style={{ fontSize: 11, color: 'rgba(59,130,246,0.7)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names.a2}</span>}
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: C.blue, fontVariantNumeric: 'tabular-nums' }}>{state.score.a}</div>
          <div style={{ marginTop: 20, color: 'rgba(59,130,246,0.4)', fontSize: 13, letterSpacing: 2 }}>タップ +1</div>
        </button>

        {/* Player B button */}
        <button onClick={() => dispatch({ type: 'POINT', player: 'B' })}
          style={{ background: 'rgba(239,68,68,0.08)', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '24px 8px', minHeight: 320, userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', transition: 'background 0.1s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!state.serveA && <span style={{ fontSize: 14 }}>🏸</span>}
              <span style={{ fontSize: 12, color: C.red, fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names.b1}</span>
            </div>
            {names.b2 && <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{names.b2}</span>}
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: C.red, fontVariantNumeric: 'tabular-nums' }}>{state.score.b}</div>
          <div style={{ marginTop: 20, color: 'rgba(239,68,68,0.4)', fontSize: 13, letterSpacing: 2 }}>タップ +1</div>
        </button>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '12px 20px 28px', display: 'flex', gap: 10 }}>
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length === 0}
          style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `2px solid ${C.surfaceAlt}`, background: 'transparent', color: state.history.length > 0 ? C.muted : C.surface, fontSize: 15, cursor: state.history.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          ↩ 取り消し
        </button>
        <button onClick={() => { if (window.confirm('ゲームをリセットしますか？')) dispatch({ type: 'RESET' }); }}
          style={{ padding: '14px 18px', borderRadius: 12, border: `2px solid ${C.surfaceAlt}`, background: 'transparent', color: C.muted, fontSize: 15, cursor: 'pointer' }}>
          終了
        </button>
      </div>
    </div>
  );
}

function IntervalScreen({ state, dispatch }) {
  const isBetween = state.intervalType === 'betweengames';
  const names = getTeamNames(state);
  const nameA = names.a;
  const nameB = names.b;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 13, letterSpacing: 4, color: C.gold, marginBottom: 16 }}>
        {isBetween ? 'ゲーム間 インターバル' : 'ミッドゲーム インターバル'}
      </div>

      {isBetween && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>第{state.currentGame}ゲーム 終了</div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.blue, fontSize: 13 }}>{nameA}</div>
              <div style={{ color: C.blue, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{state.score.a}</div>
            </div>
            <div style={{ color: C.muted, fontSize: 36, alignSelf: 'center' }}>–</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.red, fontSize: 13 }}>{nameB}</div>
              <div style={{ color: C.red, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{state.score.b}</div>
            </div>
          </div>
        </div>
      )}

      {!isBetween && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.blue, fontSize: 13 }}>{nameA}</div>
              <div style={{ color: C.blue, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{state.score.a}</div>
            </div>
            <div style={{ color: C.muted, fontSize: 36, alignSelf: 'center' }}>–</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: C.red, fontSize: 13 }}>{nameB}</div>
              <div style={{ color: C.red, fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{state.score.b}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 72, fontWeight: 800, color: C.gold, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8 }}>
        {fmt(state.timerSecs)}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 48 }}>インターバル残り時間</div>

      <button onClick={() => dispatch({ type: 'RESUME' })}
        style={{ padding: '18px 48px', borderRadius: 14, border: 'none', background: C.green, color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: 2 }}>
        {isBetween ? `第${state.currentGame + 1}ゲーム 開始` : '再開'}
      </button>
    </div>
  );
}

function MatchOverScreen({ state, dispatch }) {
  const names = getTeamNames(state);
  const winnerName = state.matchWinner === 'A' ? names.a : names.b;
  const winnerColor = state.matchWinner === 'A' ? C.blue : C.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 13, letterSpacing: 4, color: C.gold, marginBottom: 24 }}>MATCH RESULT</div>

      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: winnerColor, marginBottom: 4 }}>{winnerName}</div>
      <div style={{ fontSize: 14, color: C.muted, letterSpacing: 2, marginBottom: 36 }}>勝利</div>

      <div style={{ background: C.surfaceAlt, borderRadius: 16, padding: '20px 32px', marginBottom: 48, minWidth: 200 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: 3, marginBottom: 16 }}>GAME SCORES</div>
        {state.gameResults.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 20 }}>
            <span style={{ fontSize: 12, color: C.muted }}>第{i + 1}G</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: r.winner === 'A' ? C.blue : C.muted, fontWeight: r.winner === 'A' ? 700 : 400, fontSize: 22 }}>{r.a}</span>
              <span style={{ color: C.surface }}>–</span>
              <span style={{ color: r.winner === 'B' ? C.red : C.muted, fontWeight: r.winner === 'B' ? 700 : 400, fontSize: 22 }}>{r.b}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
        <button onClick={() => dispatch({ type: 'START' })}
          style={{ padding: '16px 0', borderRadius: 12, border: 'none', background: C.green, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          もう一度
        </button>
        <button onClick={() => dispatch({ type: 'RESET' })}
          style={{ padding: '16px 0', borderRadius: 12, border: `2px solid ${C.surfaceAlt}`, background: 'transparent', color: C.muted, fontSize: 16, cursor: 'pointer' }}>
          設定に戻る
        </button>
      </div>
    </div>
  );
}

export default function BadmintonScoresheet() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    if (state.phase !== 'interval' || state.timerSecs <= 0) return;
    const id = setTimeout(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timerSecs]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif", WebkitTapHighlightColor: 'transparent' }}>
      {state.phase === 'setup' && <SetupScreen state={state} dispatch={dispatch} />}
      {state.phase === 'playing' && <PlayingScreen state={state} dispatch={dispatch} />}
      {state.phase === 'interval' && <IntervalScreen state={state} dispatch={dispatch} />}
      {state.phase === 'matchOver' && <MatchOverScreen state={state} dispatch={dispatch} />}
    </div>
  );
}
