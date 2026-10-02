document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formulaire-atelier");

  function valeur(name) {
    return form.elements.namedItem(name).value.trim();
  }

  function dateLisible(date) {
    if (!date) return "À préciser";
    return new Date(date + "T00:00:00").toLocaleDateString("fr-FR");
  }

  function mettreAJourResume() {
    document.getElementById("resume-evenement").textContent = valeur("evenement") || "À préciser";
    document.getElementById("resume-lieu").textContent = valeur("lieu") || "À préciser";
    document.getElementById("resume-date").textContent = dateLisible(valeur("date"));
    document.getElementById("resume-participants").textContent = valeur("participants")
      ? valeur("participants") + " personne(s)"
      : "À préciser";
    document.getElementById("resume-demande").textContent = valeur("message") || "Les détails de votre projet apparaîtront ici.";
  }

  form.addEventListener("change", mettreAJourResume);
  form.elements.namedItem("message").addEventListener("input", mettreAJourResume);
  form.elements.namedItem("participants").addEventListener("input", mettreAJourResume);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const contenu = [
      "Bonjour,",
      "",
      "Je souhaite demander un devis pour un atelier de création de bijoux.",
      "",
      "Événement : " + valeur("evenement"),
      "Lieu souhaité : " + valeur("lieu"),
      "Date : " + dateLisible(valeur("date")),
      "Ville et code postal : " + valeur("ville"),
      "Nombre de participants : " + (valeur("participants") || "À préciser"),
      "",
      "Mon projet :",
      valeur("message"),
      "",
      "Prénom : " + valeur("prenom"),
      "E-mail : " + valeur("email")
    ].join("\n");

    window.location.href = "mailto:camcam.bijouterie@outlook.com?subject=" +
      encodeURIComponent("Demande de devis - Atelier bijoux") + "&body=" + encodeURIComponent(contenu);
  });

  mettreAJourResume();
});