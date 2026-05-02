const RATE_LIMIT_REQUESTS = 10;
const rateLimitStore = {};

function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const key = `${ip}:${new Date().toISOString().slice(0, 10)}`;
  const now = Date.now();
  for (const k of Object.keys(rateLimitStore)) {
    if (now - rateLimitStore[k].firstSeen > 25 * 60 * 60 * 1000) {
      delete rateLimitStore[k];
    }
  }
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 0, firstSeen: now };
  }
  rateLimitStore[key].count++;
  return rateLimitStore[key].count <= RATE_LIMIT_REQUESTS;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Daily limit reached. Come back tomorrow!" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "No API key found" });
  }

  const { date, lang } = req.body || {};
  if (!date || !lang) {
    return res.status(400).json({ error: "Missing date or lang" });
  }

  const langLabel = lang === "pt"
    ? "Brazilian Portuguese (Catholic, CNBB style)"
    : "Latin American Spanish (Catholic, Biblia de Jerusalen style)";

  const prompt = `You are a Catholic liturgical expert. Return the Roman Catholic Mass readings for ${date} as a JSON array. Return ONLY valid JSON, no markdown, no backticks.

[
  { "label": "First Reading", "reference": "Book Chapter:Verses", "text": "full English text", "nativeText": "${langLabel} translation" },
  { "label": "Responsorial Psalm", "reference": "Psalm N:Verses", "text": "full English text", "nativeText": "${langLabel} translation" },
  { "label": "Gospel Acclamation", "reference": "", "text": "verse text only", "nativeText": "${langLabel} translation" },
  { "label": "Gospel", "reference": "Book Chapter:Verses", "text": "full English text", "nativeText": "${langLabel} translation" }
]

Include Second Reading only on Sundays and solemnities. Always include full text. NABRE-style English.`;

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(500).json({ error: "Gemini error", details: geminiData });
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Empty response", raw: geminiData });
    }

    const clean = text.replace(/```json|```/g, "").trim();
    const readings = JSON.parse(clean);
    return res.status(200).json({ readings });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

