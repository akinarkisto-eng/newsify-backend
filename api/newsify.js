export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

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

    const data = await openaiResponse.json();

    return res.status(200).json({
      editedText: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
