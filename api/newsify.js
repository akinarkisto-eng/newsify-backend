export default async function handler(req, res) {
  // CORS – pakollinen Word Onlinea varten
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { text, level } = req.body || {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing text" });
    }

    const editLevel = level || "normal";

    let prompt;

    if (editLevel === "light") {
      prompt = `
Muokkaa seuraava teksti kevyesti uutismaisemmaksi.
Säilytä kaikki lainausmerkkien ("") sisällä olevat sitaatit. 
Voit korjata niistä selviä puhekielisyyksiä, kirjoitusvirheitä tai kömpelyyksiä, mutta älä muuta merkitystä.
Älä poista yhtäkään sitaattia.
Älä poista asiantuntijoiden nimiä, titteleitä tai taustatietoja.
Älä poista vivahteita, yksityiskohtia tai sävyjä.
Muokkaa ympäröivää tekstiä vain kevyesti: selkeytä, suorista lauserakenteita ja tee tekstistä hieman uutismäisempi.
Älä lyhennä tekstiä merkittävästi.
Palauta vain muokattu teksti ilman selityksiä.

Teksti:
${text}
`;
    } else if (editLevel === "strong") {
      prompt = `
Muokkaa seuraava teksti vahvasti uutismaiseksi.
Voit järjestellä kappaleita uudelleen, tiivistää rakennetta ja tehdä tekstistä selkeästi journalistisen.
Säilytä kaikki lainausmerkkien ("") sisällä olevat sitaatit, mutta voit muokata niitä selvästi sujuvammiksi, jos niissä on kankeaa kieltä, puhekielisyyksiä tai raskaita rakenteita.
Älä poista yhtäkään sitaattia.
Älä muuta sitaattien merkitystä, faktoja tai puhujan ääntä.
Älä poista asiantuntijoiden nimiä, titteleitä tai taustatietoja.
Säilytä faktat ja olennainen sisältö, mutta voit tiivistää ja jäsentää tekstiä rohkeasti.
Palauta vain muokattu teksti ilman selityksiä.

Teksti:
${text}
`;
    } else {
      // normaali taso
      prompt = `
Muokkaa seuraava teksti uutismaiseksi.
Säilytä kaikki lainausmerkkien ("") sisällä olevat sitaatit, mutta voit muokata niitä kevyesti, jos niissä on kankeaa kieltä, puhekielisyyksiä tai raskaita rakenteita.
Älä poista yhtäkään sitaattia.
Älä muuta sitaattien merkitystä, faktoja tai puhujan ääntä.
Älä poista asiantuntijoiden nimiä, titteleitä tai taustatietoja.
Älä poista vivahteita, yksityiskohtia tai sävyjä.

Muokkaa ensisijaisesti ympäröivää tekstiä:
- rakenne
- rytmi
- selkeys
- uutiskärki
- taustoitus
- looginen eteneminen

Älä lyhennä tekstiä tarpeettomasti.
Palauta vain muokattu teksti ilman selityksiä, otsikoita tai metakommentteja.

Teksti:
${text}
`;
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "Toimit kokeneena uutiseditorina, joka muokkaa tekstiä journalistiseen tyyliin ja kunnioittaa sitaattien merkitystä."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text().catch(() => "");
      console.error("OpenAI error:", openaiResponse.status, errorText);
      return res.status(500).json({ error: "OpenAI request failed" });
    }

    const data = await openaiResponse.json();
    const editedText = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!editedText) {
      return res.status(500).json({ error: "No content in OpenAI response" });
    }

    return res.status(200).json({ editedText });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
