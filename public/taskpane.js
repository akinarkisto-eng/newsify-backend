/* global Office, Word */

Office.onReady(() => {
  const button = document.getElementById("newsify");
  const status = document.getElementById("status");

  if (button) {
    button.addEventListener("click", async () => {
      status.textContent = "";
      button.disabled = true;

      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          selection.load("text");
          await context.sync();

          const text = selection.text;

          if (!text || text.trim().length === 0) {
            status.textContent = "Valitse ensin teksti dokumentista.";
            button.disabled = false;
            return;
          }

          const levelSelect = document.getElementById("editLevel");
          const level = levelSelect ? levelSelect.value : "normal";

          status.textContent = "Muokataan tekstiä…";

          const response = await fetch("https://newsify-backend-eta.vercel.app/api/newsify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, level })
          });

          if (!response.ok) {
            const err = await response.text().catch(() => "");
            console.error("Backend error:", err);
            status.textContent = "Virhe palvelussa. Yritä uudelleen.";
            button.disabled = false;
            return;
          }

          const data = await response.json();
          const editedText = data?.editedText || "";

          if (!editedText) {
            status.textContent = "Palvelu ei palauttanut muokattua tekstiä.";
            button.disabled = false;
            return;
          }

          selection.insertText(editedText, Word.InsertLocation.replace);
          await context.sync();

          status.textContent = "Teksti muokattu.";
        });
      } catch (err) {
        console.error("Word/JS error:", err);
        status.textContent = "Tapahtui virhe. Tarkista yhteys ja yritä uudelleen.";
      } finally {
        button.disabled = false;
      }
    });
  }
});
