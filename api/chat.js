// Build USCCB URL from date string YYYY-MM-DD
function getUSCCBUrl(date, lang) {
  const [y, m, d] = date.split("-");
  const yy = y.slice(2);
  const code = `${m}${d}${yy}`;
  return lang === "es"
    ? `https://bible.usccb.org/es/bible/lecturas/${code}.cfm`
    : `https://bible.usccb.org/bible/readings/${code}.cfm`;
}

// Strip HTML tags and normalize whitespace
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Parse USCCB HTML into readings array
function parseUSCCB(html) {
  const readings = [];

  // Remove scripts, styles, nav
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Split by h3 tags
  const parts = html.split(/<h3[^>]*>/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const closingH3 = part.indexOf("</h3>");
    if (closingH3 === -1) continue;

    const rawLabel = stripHtml(part.substring(0, closingH3)).trim();
    const rawBody = part.substring(closingH3 + 5);

    // Get reference — first anchor link text
    const refMatch = rawBody.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    const reference = refMatch ? stripHtml(refMatch[1]).trim() : "";

    // Get body text — strip all HTML, clean up
    const text = rawBody
      .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "") // remove all links
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/R\.\s+/g, "\nR. ")
      .replace(/\s*\n\s*/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (!text || text.length < 30) continue;

    // Map label to standard key
    let label = null;
    const l = rawLabel.toLowerCase();

    if (l.includes("reading i") && !l.includes("reading ii") ||
        l.includes("primera lectura") ||
        l.includes("lectura i") && !l.includes("lectura ii")) {
      label = "First Reading";
    } else if (l.includes("reading ii") || l.includes("segunda lectura") || l.includes("lectura ii")) {
      label = "Second Reading";
    } else if (l.includes("psalm") || l.includes("salmo")) {
      label = "Responsorial Psalm";
    } else if (l.includes("alleluia") || l.includes("aleluya") ||
               l.includes("acclamation") || l.includes("aclamación")) {
      label = "Gospel Acclamation";
    } else if (l.includes("gospel") || l.includes("evangelio")) {
      label = "Gospel";
    }

    if (label && !readings.find(r => r.label === label)) {
      readings.push({ label, reference, text });
    }
  }

  return readings;
}

// Translate readings to Portuguese using Gemini
async function translateToPT(readings, apiKey) {
  if (!apiKey) return readings.map(r => ({ ...r, nativeText: r.text }));

  const texts = readings.map((r, i) => `[${i}] ${r.label}\n${r.text}`).join("\n\n---\n\n");
  const prompt = `Translate these Catholic Mass readings to Brazilian Portuguese (CNBB Catholic style). Return ONLY a JSON array of strings, one translated text per reading in the same order. No markdown, no backticks, no explanation.\n\n${texts}`;

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
    if (!text) return readings.map(r => ({ ...r, nativeText: r.text }));
    const clean = text.replace(/```json|```/g, "").trim();
    const translations = JSON.parse(clean);
    return readings.map((r, i) => ({ ...r, nativeText: translations[i] || r.text }));
  } catch (e) {
    console.error("Translation error:", e.message);
    return readings.map(r => ({ ...r, nativeText: r.text }));
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { date, lang } = req.body || {};
  if (!date || !lang) return res.status(400).json({ error: "Missing date or lang" });

  try {
    const url = getUSCCBUrl(date, lang);
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Referer": "https://bible.usccb.org/"
      }
    });

    if (!pageRes.ok) return res.status(500).json({ error: `USCCB fetch failed: ${pageRes.status}` });

    const html = await pageRes.text();
    let readings = parseUSCCB(html);

    if (!readings || readings.length === 0) {
      return res.status(500).json({ error: "Could not parse readings from USCCB", url });
    }

    if (lang === "es") {
      readings = readings.map(r => ({ ...r, nativeText: r.text }));
    }

    if (lang === "pt") {
      const apiKey = process.env.GEMINI_API_KEY;
      readings = await translateToPT(readings, apiKey);
    }

    return res.status(200).json({ readings });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
