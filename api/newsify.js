export default async function handler(req, res) {
  // 🔥 CORS – pakollinen Word Onlinea varten
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    // Vain POST sallitaan
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text" });
    }

    // Prompt tekoälylle
    const prompt = `
Muokkaa seuraava teksti uutismaiseksi.
Säilytä faktat ja merkitys muuttumattomina.
Tee seuraavat muutokset:
- lyhennä pitkiä virkkeitä
- poista puhekielisyydet ja täytesanat
- käytä neutraalia yleiskieltä
- vältä monimutkaisia rakenteita
- käytä aktiivista muotoa
- tiivistä tarvittaessa
- älä lisää uutta tietoa

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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Olet uutistoimittaja, joka muokkaa tekstiä journalistiseen tyyliin." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    // Jos OpenAI palauttaa virheen
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await openaiResponse.json();

    // 🔥 Palauta muokattu teksti Wordin lisäosalle
    return res.status(200).json({
      editedText: data.choices?.[0]?.message?.content || ""
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
