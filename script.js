document.addEventListener("DOMContentLoaded", function () {
  const listeProduits = document.getElementById("liste-produits");
  const listePanier = document.getElementById("liste-panier");
  const totalPanier = document.getElementById("total-panier");
  const compteurPanier = document.getElementById("compteur-panier");
  const panier = [];
  let produitsCatalogue = [];

  async function chargerProduits() {
    try {
      const reponse = await fetch("products.json", { cache: "no-store" });
      if (!reponse.ok) throw new Error("Catalogue indisponible");
      const produits = await reponse.json();
      if (!Array.isArray(produits)) throw new Error("Format de catalogue invalide");
      produitsCatalogue = produits;
      afficherProduits();
    } catch (erreur) {
      listeProduits.replaceChildren(creerElement("p", "catalogue-vide", "Impossible de charger les créations. Réessaie dans quelques instants."));
    }
  }

  function creerElement(tag, classe, texte) {
    const element = document.createElement(tag);
    if (classe) element.className = classe;
    if (texte !== undefined) element.textContent = texte;
    return element;
  }

  function afficherProduits() {
    listeProduits.replaceChildren();

    if (produitsCatalogue.length === 0) {
      listeProduits.append(creerElement("p", "catalogue-vide", "Aucun article pour le moment."));
      return;
    }

    produitsCatalogue.forEach(function (produit) {
      const article = creerElement("article", "article-produit");
      const photo = creerElement("div", "photo-bijou");
      if (produit.image) {
        const image = document.createElement("img");
        image.src = new URL(produit.image, document.baseURI).href;
        image.alt = produit.nom;
        image.style.display = "block";
        photo.append(image);
      } else {
        photo.append(creerElement("span", "", produit.emoji || "✨"));
      }

      article.append(
        photo,
        creerElement("h3", "", produit.nom),
        creerElement("p", "", produit.description),
        creerElement("p", "prix", Number(produit.prix).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €")
      );

      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "ajouter-panier bouton-panier-icon";
      bouton.dataset.produitId = produit.id;
      bouton.setAttribute("aria-label", "Ajouter " + produit.nom + " au panier");
      bouton.title = "Ajouter au panier";
      const icone = document.createElement("img");
      icone.src = "panier-osier.svg";
      icone.alt = "";
      bouton.append(icone);
      article.append(bouton);
      listeProduits.append(article);
    });
  }

  function afficherPanier() {
    let total = 0;
    listePanier.replaceChildren();
    if (panier.length === 0) {
      listePanier.append(creerElement("p", "", "Votre panier est vide."));
    }

    panier.forEach(function (article) {
      total += article.prix;
      listePanier.append(creerElement("p", "", article.nom + " — " + article.prix + " €"));
    });

    totalPanier.textContent = total.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
    compteurPanier.textContent = panier.length;
  }

  listeProduits.addEventListener("click", function (evenement) {
    const bouton = evenement.target.closest(".ajouter-panier");
    if (!bouton) return;

    const produit = produitsCatalogue.find(function (element) {
      return element.id === bouton.dataset.produitId;
    });
    if (!produit) return;

    panier.push({ nom: produit.nom, prix: Number(produit.prix) });
    afficherPanier();
  });

  document.getElementById("ouvrir-panier").addEventListener("click", function () {
    document.getElementById("panier").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("envoyer-commande").addEventListener("click", function () {
    if (panier.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    let commande = "Bonjour,\n\nJe souhaite commander :\n";
    panier.forEach(function (article) {
      commande += "- " + article.nom + " : " + article.prix + " €\n";
    });

    window.location.href =
      "mailto:lefranccamille4@gmail.com?subject=Commande Ma poulette&body=" +
      encodeURIComponent(commande);
  });

  afficherPanier();
  chargerProduits();
});