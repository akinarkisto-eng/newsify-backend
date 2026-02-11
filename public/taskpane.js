/* global Office, Word */

Office.onReady(() => {
  const button = document.getElementById("newsify");
  const status = document.getElementById("status");

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

        const mode = document.getElementById("mode").value;
        const level = document.getElementById("editLevel").value;

        status.textContent = "Käsitellään tekstiä…";

        const response = await fetch("https://newsify-backend-eta.vercel.app/api/newsify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode, level })
        });

        if (!response.ok) {
          status.textContent = "Virhe palvelussa.";
          button.disabled = false;
          return;
        }

        const data = await response.json();
        const editedText = data?.editedText || "";

        selection.insertText(editedText, Word.InsertLocation.replace);
        await context.sync();

        status.textContent = "Valmis.";
      });
    } catch (err) {
      console.error(err);
      status.textContent = "Virhe käsittelyssä.";
    } finally {
      button.disabled = false;
    }
  });
});
