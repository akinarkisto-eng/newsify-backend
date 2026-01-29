Office.onReady(() => {
  document.getElementById("newsify").onclick = improveToNewsStyle;
});

async function improveToNewsStyle() {
  const status = document.getElementById("status");
  status.textContent = "Käsitellään...";

  try {
    const original = await getSelectedText();
    if (!original.trim()) {
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

  const data = await response.json();
  return data.editedText;
}
