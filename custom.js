document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formulaire-personnalisation");

  function valeur(name) {
    return form.elements.namedItem(name).value;
  }

  function mettreAJourResume() {
    document.getElementById("resume-metal").textContent = valeur("metal");
    document.getElementById("resume-maille").textContent = valeur("maille");
    document.getElementById("resume-demande").textContent = valeur("message").trim() || "Ta description apparaîtra ici.";
  }

  form.addEventListener("change", mettreAJourResume);
  form.elements.namedItem("message").addEventListener("input", mettreAJourResume);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const contenu = [
      "Bonjour,",
      "",
      "Je souhaite un devis pour un bijou personnalisé.",
      "",
      "Type d’acier : " + valeur("metal"),
      "Type de maille : " + valeur("maille"),
      "Ma demande :",
      valeur("message").trim(),
      "",
      "Prénom : " + valeur("prenom").trim(),
      "E-mail : " + valeur("email").trim()
    ].join("\n");

    window.location.href = "mailto:camcam.bijouterie@outlook.com?subject=" +
      encodeURIComponent("Demande de bijou personnalisé") + "&body=" + encodeURIComponent(contenu);
  });

  mettreAJourResume();
});
