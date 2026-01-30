// Varmistetaan, että Office.js on valmis
Office.onReady(() => {
  const button = document.getElementById("newsify");
  if (button) {
    button.onclick = improveToNewsStyle;
  }
});

async function improveToNewsStyle() {
  const status = document.getElementById("status");
  status.textContent = "Käsitellään...";

  try {
    const original = await getSelectedText();
    if (!original || !original.trim()) {
      status.textContent = "Valitse ensin teksti dokumentista.";
      return;
    }

    const edited = await callBackend(original);
    await replaceSelectedText(edited);

    status.textContent = "Valmis.";
  } catch (e) {
    console.error(e);
    status.textContent = "Virhe käsittelyssä.";
  }
}

// --- Word API: valinnan lukeminen ---
async function getSelectedText() {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    return selection.text;
  });
}

// --- Word API: tekstin korvaaminen ---
async function replaceSelectedText(newText) {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(newText, Word.InsertLocation.replace);
    await context.sync();
  });
}

// --- Kutsu Vercel-backendille ---
async function callBackend(originalText) {
  const response = await fetch("https://newsify-backend-eta.vercel.app/api/newsify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: originalText })
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.editedText) {
    throw new Error("Backend response missing 'editedText'");
  }

  return data.editedText;
}
