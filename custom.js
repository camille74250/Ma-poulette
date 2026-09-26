document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formulaire-personnalisation");
  const graveCheck = document.getElementById("avec-gravure");
  const champGravure = document.getElementById("champ-gravure");
  const resumeGravureLigne = document.getElementById("resume-gravure-ligne");

  function valeur(name) {
    const element = form.elements.namedItem(name);
    if (element instanceof RadioNodeList) return element.value;
    return element.value;
  }

  function mettreAJourResume() {
    form.querySelectorAll(".option-type").forEach(function (option) {
      option.classList.toggle("is-selected", option.querySelector('input[type="radio"]').checked);
    });
    document.getElementById("resume-type").textContent = valeur("type");
    document.getElementById("resume-metal").textContent = valeur("metal");
    document.getElementById("resume-pierre").textContent = valeur("pierre");
    document.getElementById("resume-style").textContent = valeur("style");
    document.getElementById("resume-longueur").textContent = valeur("longueur");

    const gravure = graveCheck.checked ? valeur("gravure").trim() : "";
    resumeGravureLigne.hidden = !gravure;
    document.getElementById("resume-gravure").textContent = gravure;
  }

  form.addEventListener("change", mettreAJourResume);
  form.elements.namedItem("gravure").addEventListener("input", mettreAJourResume);
  form.querySelector(".choix-type").addEventListener("click", function (event) {
    const option = event.target.closest(".option-type");
    if (!option) return;

    option.querySelector('input[type="radio"]').checked = true;
    mettreAJourResume();
  });

  graveCheck.addEventListener("change", function () {
    champGravure.hidden = !graveCheck.checked;
    if (!graveCheck.checked) form.elements.namedItem("gravure").value = "";
    mettreAJourResume();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const gravure = graveCheck.checked && valeur("gravure").trim()
      ? valeur("gravure").trim()
      : "Aucune";
    const message = valeur("message").trim() || "Aucune précision";
    const contenu = [
      "Bonjour,",
      "",
      "Je souhaite un devis pour un bijou personnalisé :",
      "",
      "Type : " + valeur("type"),
      "Métal : " + valeur("metal"),
      "Pierre ou détail : " + valeur("pierre"),
      "Style : " + valeur("style"),
      "Longueur : " + valeur("longueur"),
      "Gravure : " + gravure,
      "Précisions : " + message,
      "",
      "Prénom : " + valeur("prenom").trim(),
      "E-mail : " + valeur("email").trim()
    ].join("\n");

    const subject = "Demande de bijou personnalisé - " + valeur("type");
    window.location.href = "mailto:camcam.bijouterie@outlook.com?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(contenu);
  });

  mettreAJourResume();
});
