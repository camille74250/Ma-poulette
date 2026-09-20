document.addEventListener("DOMContentLoaded", function () {
  const panier = [];
  const listePanier = document.getElementById("liste-panier");
  const totalPanier = document.getElementById("total-panier");
  const compteurPanier = document.getElementById("compteur-panier");

  function afficherPanier() {
    let total = 0;
    listePanier.innerHTML = "";

    if (panier.length === 0) {
      listePanier.innerHTML = "<p>Votre panier est vide.</p>";
    }

    panier.forEach(function (bijou) {
      total = total + bijou.prix;
      listePanier.innerHTML += "<p>" + bijou.nom + " — " + bijou.prix + " €</p>";
    });

    totalPanier.textContent = total;
    compteurPanier.textContent = panier.length;
  }

  document.querySelectorAll(".ajouter-panier").forEach(function (bouton) {
    bouton.addEventListener("click", function () {
      panier.push({
        nom: bouton.dataset.nom,
        prix: Number(bouton.dataset.prix)
      });

      afficherPanier();
    });
  });

  document.getElementById("ouvrir-panier").addEventListener("click", function () {
    document.getElementById("panier").scrollIntoView();
  });

  document.getElementById("envoyer-commande").addEventListener("click", function () {
    if (panier.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    let commande = "Bonjour,\n\nJe souhaite commander :\n";

    panier.forEach(function (bijou) {
      commande += "- " + bijou.nom + " : " + bijou.prix + " €\n";
    });

    window.location.href =
      "mailto:lefranccamille4@gmail.com?subject=Commande Ma poulette&body=" +
      encodeURIComponent(commande);
  });
});