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
    if (now - rateLimitStore[k].firstSeen > 25 * 60 * 60 * 1000) delete rateLimitStore[k];
  }
  if (!rateLimitStore[key]) rateLimitStore[key] = { count: 0, firstSeen: now };
  rateLimitStore[key].count++;
  return rateLimitStore[key].count <= RATE_LIMIT_REQUESTS;
}

// Build USCCB URL from date string YYYY-MM-DD
function getUSCCBUrl(date, lang) {
  const [y, m, d] = date.split("-");
  const yy = y.slice(2);
  const code = `${m}${d}${yy}`;
  return lang === "es"
    ? `https://bible.usccb.org/es/bible/lecturas/${code}.cfm`
    : `https://bible.usccb.org/bible/readings/${code}.cfm`;
}

// Parse USCCB HTML into readings array
function parseUSCCB(html, lang) {
  const readings = [];

  // Remove script/style tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "")
             .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Find all h3 sections
  const sectionRegex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<footer|<div class="view-|$)/gi;
  let match;

  while ((match = sectionRegex.exec(html)) !== null) {
    const rawLabel = match[1].replace(/<[^>]+>/g, "").trim();
    const rawBody = match[2];

    // Extract reference link text
    const refMatch = rawBody.match(/<a[^>]*bible[^>]*>([\s\S]*?)<\/a>/i);
    const reference = refMatch ? refMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    // Extract all paragraph text
    const text = rawBody
      .replace(/<a[^>]*bible[^>]*>[\s\S]*?<\/a>/i, "") // remove reference link
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/R\.\s*/g, "\nR. ")
      .trim();

    if (!text || text.length < 20) continue;

    // Map label to standard format
    let label = null;
    const l = rawLabel.toLowerCase();
    if (l.includes("reading i") || l.includes("primera lectura") || l.includes("lectura i")) {
      label = "First Reading";
    } else if (l.includes("reading ii") || l.includes("segunda lectura") || l.includes("lectura ii")) {
      label = "Second Reading";
    } else if (l.includes("psalm") || l.includes("salmo")) {
      label = "Responsorial Psalm";
    } else if (l.includes("alleluia") || l.includes("aleluya") || l.includes("gospel acclamation") || l.includes("aclamación")) {
      label = "Gospel Acclamation";
    } else if (l.includes("gospel") || l.includes("evangelio")) {
      label = "Gospel";
    }

    if (label) {
      // Avoid duplicates
      if (!readings.find(r => r.label === label)) {
        readings.push({ label, reference, text });
      }
    }
  }

  return readings;
}

// Translate readings to Portuguese using Gemini
async function translateToPT(readings, apiKey) {
  if (!apiKey) return readings;

  const texts = readings.map(r => `[${r.label}]\n${r.text}`).join("\n\n---\n\n");

  const prompt = `Translate these Catholic Mass readings to Brazilian Portuguese (CNBB Catholic style). Return ONLY a JSON array of strings, one per reading in the same order. No markdown, no backticks.

${texts}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
        })
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return readings;
    const clean = text.replace(/```json|```/g, "").trim();
    const translations = JSON.parse(clean);
    return readings.map((r, i) => ({ ...r, nativeText: translations[i] || r.text }));
  } catch {
    return readings.map(r => ({ ...r, nativeText: r.text }));
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Daily limit reached. Come back tomorrow! 🙏" });
  }

  const { date, lang } = req.body || {};
  if (!date || !lang) return res.status(400).json({ error: "Missing date or lang" });

  try {
    // Fetch USCCB page — English for PT users, Spanish for ES users
    const url = getUSCCBUrl(date, lang);
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HolyMassApp/1.0)" }
    });

    if (!pageRes.ok) {
      return res.status(500).json({ error: `USCCB fetch failed: ${pageRes.status}` });
    }

    const html = await pageRes.text();
    let readings = parseUSCCB(html, lang);

    if (!readings || readings.length === 0) {
      return res.status(500).json({ error: "Could not parse readings from USCCB" });
    }

    // For Spanish: text IS the native text
    if (lang === "es") {
      readings = readings.map(r => ({ ...r, nativeText: r.text }));
    }

    // For Portuguese: translate English text via Gemini
    if (lang === "pt") {
      const apiKey = process.env.GEMINI_API_KEY;
      readings = await translateToPT(readings, apiKey);
    }

    return res.status(200).json({ readings });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
