const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const MAX_TOKENS = 1500;

function buildPrompt({ kanjiName, theme, situation, lifePath, soulUrge, expression}) {
return `あなたはカバラ数秘術・心理学・行動科学を統合したセラピスト「Piece Wave」です。以下のデータをもとに診断レポートを日本語で作成してください。

名前：${kanjiName}
テーマ：${theme}
現状：${situation}
ライフパス：${lifePath}、ソウルアージ：${soulUrge}、エクスプレッション：${expression}


・マークダウン記号（#、##、*、**）を一切使わない
・絵文字を一切使わない
・見出しは使わず、流れるような散文で書く
・700〜900字


1. 冒頭：「${situation}」という現状から入り、その詰まりの正体を数秘的観点で鋭く指摘する
2. 数秘の洞察：ライフパス${lifePath}とソウルアージ${soulUrge}が生み出している具体的な葛藤パターンを描写する
3. 突破口：今すぐできる具体的な一手を1つだけ提示する
4. 結び：この診断で見えるのは設計図の骨格までであり、「なぜ今の状況が起きているか（全体の構造）」「どの順番で何を変えるか」「いつが動き時か」の3点は精密鑑定で初めて明らかになることを、押し売りにならない必然性として、3点とも名指しで示す`;
}

export default async function handler(req, res) {
if (req.method!== "POST") {
return res.status(405).json({ error: "Method not allowed"});
}

const body = req.body || {};
const { kanjiName, theme, situation, lifePath, soulUrge, expression} = body;
const isStr = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const isNum = (v) => Number.isInteger(v) && v >= 1 && v <= 33;
if (!isStr(kanjiName, 50) ||!isStr(theme, 20) ||!isStr(situation, 300) ||!isNum(lifePath) ||!isNum(soulUrge) ||!isNum(expression)) {
return res.status(400).json({ error: "Invalid request"});
}

if (!process.env.ANTHROPIC_API_KEY) {
console.error("ANTHROPIC_API_KEY is not set");
return res.status(500).json({ error: "Server configuration error"});
}

try {
const response = await fetch("https://api.anthropic.com/v1/messages", {
method: "POST",
headers: {
"Content-Type": "application/json",
"x-api-key": process.env.ANTHROPIC_API_KEY,
"anthropic-version": "2023-06-01",
},
body: JSON.stringify({
model: MODEL,
max_tokens: MAX_TOKENS,
messages: [{ role: "user", content: buildPrompt({ kanjiName, theme, situation, lifePath, soulUrge, expression})}],
}),
});

const data = await response.json();
if (!response.ok) {
console.error("Anthropic API error:", response.status, JSON.stringify(data).slice(0, 500));
return res.status(502).json({ error: "Diagnosis generation failed"});
}
const text = data.content?.find((b) => b.type === "text")?.text || "";
if (!text) {
console.error("Anthropic API returned no text:", JSON.stringify(data).slice(0, 500));
return res.status(502).json({ error: "Diagnosis generation failed"});
}
return res.status(200).json({ text});
} catch (e) {
console.error("chat handler error:", e);
return res.status(500).json({ error: "Internal server error"});
}
}
