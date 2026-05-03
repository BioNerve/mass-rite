// api/chat.js — translation only
// Receives pre-extracted English readings, returns Portuguese translations.
// USCCB fetching happens client-side in the browser to avoid IP blocks.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { readings, lang } = req.body || {};
  if (!readings || !lang) return res.status(400).json({ error: "Missing readings or lang" });

  // Spanish readings come pre-translated from USCCB ES page — nothing to do
  if (lang === "es") return res.status(200).json({ translations: readings.map(r => r.text) });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const texts = readings.map((r, i) => `[${i}] ${r.label}\n${r.text}`).join("\n\n---\n\n");
  const prompt = `Translate these Catholic Mass readings to Brazilian Portuguese (CNBB Catholic style). Return ONLY a JSON array of strings, one translated text per reading in the same order. No markdown, no backticks, no explanation.\n\n${texts}`;

  try {
    const geminiRes = await fetch(
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

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No response from Gemini" });

    const clean = text.replace(/```json|```/g, "").trim();
    const translations = JSON.parse(clean);
    return res.status(200).json({ translations });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
