export default async function handler(req, res) {
  // 🔥 CORS – pakollinen Word Onlinea varten
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  // 🔥 OPTIONS‑preflight pitää hyväksyä
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Sallitaan vain POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text" });
    }

    // 🔧 Päivitetty prompti: sitaatit säilyvät
    const prompt = `
Muokkaa seuraava teksti uutismaiseksi, mutta säilytä kaikki lainausmerkkien ("") sisällä olevat sitaatit mahdollisimman muuttumattomina.
Älä poista asiantuntijoiden nimiä, titteleitä tai taustatietoja.
Älä poista vivahteita, yksityiskohtia tai sävyjä.
Voit sujuvoittaa sitaatteja vain, jos ne ovat selvästi epäselviä, mutta älä muuta niiden sisältöä tai merkitystä.
Muokkaa ensisijaisesti ympäröivää tekstiä: rakennetta, rytmiä, selkeyttä, uutiskärkeä, taustoitusta ja loogista etenemistä.
Älä lyhennä tekstiä tarpeettomasti.
Palauta vain muokattu teksti ilman selityksiä, otsikoita tai metakommentteja.

Teksti:
${text}
`;

    // 🔥 OpenAI-kutsu
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Toimit kokeneena uutiseditorina, joka muokkaa tekstiä journalistiseen tyyliin." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await openaiResponse.json();
    const editedText = data?.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({ editedText });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
