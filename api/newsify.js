export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { text, mode, level } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    let prompt = "";

    // -------------------------
    // A) EDITOINTITASOT
    // -------------------------
    if (mode === "edit") {
      if (level === "light") {
        prompt = `
Muokkaa teksti kevyesti uutismaisemmaksi...
(kevyt versio)
Teksti:
${text}`;
      } else if (level === "strong") {
        prompt = `
Muokkaa teksti vahvasti uutismaiseksi...
(vahva versio)
Teksti:
${text}`;
      } else {
        prompt = `
Muokkaa teksti uutismaiseksi...
(normaalitaso)
Teksti:
${text}`;
      }
    }

    // -------------------------
    // B) UUTISRAKENNE
    // -------------------------
    if (mode === "structure") {
      prompt = `
Järjestä teksti selkeäksi uutiseksi, jossa on vahva uutiskärki...
Teksti:
${text}`;
    }

    // -------------------------
    // C) GENEERISET SITAATIT
    // -------------------------
    if (mode === "quotes") {
      prompt = `
Luo 2–4 geneeristä, journalistiseen uutiseen sopivaa sitaattia...
Teksti:
${text}`;
    }

    // -------------------------
    // D) MUUTA TEKSTI SITAATIKSI
    // -------------------------
    if (mode === "quoteify") {
      prompt = `
Muuta osa tekstistä sitaatiksi...
Teksti:
${text}`;
    }

    // -------------------------
    // E) SITAATTIAUTOMAATIO
    // -------------------------
    if (mode === "autoquote") {
      prompt = `
Luo uutiseen sopivia, uskottavia mutta geneerisiä sitaatteja...
Teksti:
${text}`;
    }

    // -------------------------
    // OPENAI-KUTSU
    // -------------------------
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Toimit kokeneena uutiseditorina." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const data = await openaiResponse.json();
    const editedText = data?.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({ editedText });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
