document.addEventListener("DOMContentLoaded", function () {
  const listeProduits = document.getElementById("liste-produits");
  const listePanier = document.getElementById("liste-panier");
  const totalPanier = document.getElementById("total-panier");
  const compteurPanier = document.getElementById("compteur-panier");
  let panier = [];
  let produitsCatalogue = [];

  try {
    const panierEnregistre = JSON.parse(localStorage.getItem("ma-poulette-panier") || "[]");
    if (Array.isArray(panierEnregistre)) {
      panier = panierEnregistre.filter(function (article) {
        return article && typeof article.nom === "string" && Number.isFinite(Number(article.prix));
      });
    }
  } catch (erreur) {
    panier = [];
  }

  function sauvegarderPanier() {
    try {
      localStorage.setItem("ma-poulette-panier", JSON.stringify(panier));
    } catch (erreur) {
      // Le panier reste utilisable même si le stockage du navigateur est indisponible.
    }
  }

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

    const categories = [
      { id: "bracelets", titre: "BRACELETS" },
      { id: "colliers", titre: "COLLIERS" },
      { id: "bagues", titre: "BAGUES" },
      { id: "boucles-oreilles", titre: "BOUCLES D’OREILLES" },
      { id: "autres-bijoux", titre: "AUTRES BIJOUX" }
    ];
    const groupes = new Map(categories.map(function (categorie) {
      return [categorie.id, []];
    }));

    produitsCatalogue.forEach(function (produit) {
      const categorie = groupes.has(produit.categorie) ? produit.categorie : "autres-bijoux";
      groupes.get(categorie).push(produit);
    });

    categories.forEach(function (categorie) {
      const produits = groupes.get(categorie.id);
      if (categorie.id === "autres-bijoux" && produits.length === 0) return;

      const section = creerElement("section", "section-categorie");
      section.id = categorie.id;
      const titre = creerElement("h2", "titre-categorie", categorie.titre);
      const grille = creerElement("div", "produits");
      section.append(titre, grille);

      if (produits.length === 0) {
        section.append(creerElement("p", "categorie-vide", "Aucun bijou pour le moment."));
      }

      produits.forEach(function (produit) {
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
      grille.append(article);
      });

      listeProduits.append(section);
    });
  }

  function afficherPanier() {
    let total = 0;
    if (listePanier) {
      listePanier.replaceChildren();
      if (panier.length === 0) {
        listePanier.append(creerElement("p", "", "Votre panier est vide."));
      }

      panier.forEach(function (article, index) {
        total += Number(article.prix);
        const ligne = creerElement("div", "ligne-panier");
        ligne.append(creerElement("p", "", article.nom + " — " + Number(article.prix).toLocaleString("fr-FR") + " €"));
        const boutonRetirer = creerElement("button", "retirer-panier", "Retirer");
        boutonRetirer.type = "button";
        boutonRetirer.dataset.index = index;
        ligne.append(boutonRetirer);
        listePanier.append(ligne);
      });
    } else {
      total = panier.reduce(function (somme, article) {
        return somme + Number(article.prix);
      }, 0);
    }

    if (totalPanier) totalPanier.textContent = total.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
    if (compteurPanier) compteurPanier.textContent = panier.length;
  }

  const diapositives = Array.from(document.querySelectorAll(".diapo"));
  const pointsDiapo = Array.from(document.querySelectorAll(".diapo-point"));
  const boutonPauseDiapo = document.getElementById("diapo-pause");
  if (diapositives.length > 0) {
  let indexDiapo = 0;
  let minuterieDiapo;
  let diapoEnPause = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function afficherDiapo(index) {
    indexDiapo = (index + diapositives.length) % diapositives.length;
    diapositives.forEach(function (diapo, position) {
      const active = position === indexDiapo;
      diapo.classList.toggle("is-active", active);
      diapo.setAttribute("aria-hidden", String(!active));
      pointsDiapo[position].classList.toggle("is-active", active);
      if (active) pointsDiapo[position].setAttribute("aria-current", "true");
      else pointsDiapo[position].removeAttribute("aria-current");
    });
  }

  function demarrerDiaporama() {
    window.clearInterval(minuterieDiapo);
    if (diapoEnPause || document.hidden || diapositives.length < 2) return;
    minuterieDiapo = window.setInterval(function () {
      afficherDiapo(indexDiapo + 1);
    }, 4800);
  }

  function naviguerDiapo(index) {
    afficherDiapo(index);
    demarrerDiaporama();
  }

  document.getElementById("diapo-precedente").addEventListener("click", function () {
    naviguerDiapo(indexDiapo - 1);
  });

  document.getElementById("diapo-suivante").addEventListener("click", function () {
    naviguerDiapo(indexDiapo + 1);
  });

  pointsDiapo.forEach(function (point, index) {
    point.addEventListener("click", function () {
      naviguerDiapo(index);
    });
  });

  boutonPauseDiapo.setAttribute("aria-pressed", String(diapoEnPause));
  boutonPauseDiapo.setAttribute("aria-label", diapoEnPause ? "Reprendre le diaporama" : "Mettre le diaporama en pause");
  boutonPauseDiapo.addEventListener("click", function () {
    diapoEnPause = !diapoEnPause;
    boutonPauseDiapo.setAttribute("aria-pressed", String(diapoEnPause));
    boutonPauseDiapo.setAttribute("aria-label", diapoEnPause ? "Reprendre le diaporama" : "Mettre le diaporama en pause");
    demarrerDiaporama();
  });

  document.addEventListener("visibilitychange", demarrerDiaporama);
  demarrerDiaporama();
  }

  if (listeProduits) listeProduits.addEventListener("click", function (evenement) {
    const bouton = evenement.target.closest(".ajouter-panier");
    if (!bouton) return;

    const produit = produitsCatalogue.find(function (element) {
      return element.id === bouton.dataset.produitId;
    });
    if (!produit) return;

    panier.push({ nom: produit.nom, prix: Number(produit.prix) });
    sauvegarderPanier();
    afficherPanier();
  });

  if (listePanier) listePanier.addEventListener("click", function (evenement) {
    const bouton = evenement.target.closest(".retirer-panier");
    if (!bouton) return;
    panier.splice(Number(bouton.dataset.index), 1);
    sauvegarderPanier();
    afficherPanier();
  });

  const boutonMenuCategories = document.getElementById("bouton-menu-categories");
  const liensCategories = document.getElementById("liens-categories");

  if (boutonMenuCategories && liensCategories) {
  boutonMenuCategories.addEventListener("click", function () {
    const ouvert = boutonMenuCategories.getAttribute("aria-expanded") === "true";
    boutonMenuCategories.setAttribute("aria-expanded", String(!ouvert));
    boutonMenuCategories.setAttribute("aria-label", ouvert ? "Ouvrir les catégories" : "Fermer les catégories");
    liensCategories.hidden = ouvert;
  });

  liensCategories.addEventListener("click", function (evenement) {
    if (!evenement.target.closest("a")) return;
    liensCategories.hidden = true;
    boutonMenuCategories.setAttribute("aria-expanded", "false");
    boutonMenuCategories.setAttribute("aria-label", "Ouvrir les catégories");
  });

  document.addEventListener("keydown", function (evenement) {
    if (evenement.key !== "Escape" || liensCategories.hidden) return;
    liensCategories.hidden = true;
    boutonMenuCategories.setAttribute("aria-expanded", "false");
    boutonMenuCategories.setAttribute("aria-label", "Ouvrir les catégories");
    boutonMenuCategories.focus();
  });
  }

  const boutonCommande = document.getElementById("envoyer-commande");
  if (boutonCommande) boutonCommande.addEventListener("click", function () {
    if (panier.length === 0) {
      alert("Votre panier est vide.");
      return;
    }
    lancerPaiement();
  });

  async function lancerPaiement() {
    const messagePaiement = document.getElementById("erreur-paiement");
    boutonCommande.disabled = true;
    boutonCommande.textContent = "Connexion à Mollie…";
    if (messagePaiement) {
      messagePaiement.hidden = true;
      messagePaiement.textContent = "";
    }

    try {
      let catalogue = produitsCatalogue;
      if (catalogue.length === 0) {
        const reponseCatalogue = await fetch("products.json", { cache: "no-store" });
        if (!reponseCatalogue.ok) throw new Error("Impossible de vérifier le catalogue.");
        catalogue = await reponseCatalogue.json();
      }

      const ids = panier.map(function (article) {
        const produit = article.id
          ? catalogue.find(function (element) { return element.id === article.id; })
          : catalogue.find(function (element) {
            return element.nom === article.nom && Number(element.prix) === Number(article.prix);
          });
        if (!produit) throw new Error("Un article de ton panier n’est plus disponible. Retire-le puis ajoute-le à nouveau.");
        article.id = produit.id;
        article.nom = produit.nom;
        article.prix = Number(produit.prix);
        return produit.id;
      });
      sauvegarderPanier();

      const reponse = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: ids })
      });
      let resultat;
      try {
        resultat = await reponse.json();
      } catch (erreur) {
        throw new Error("Le service de paiement n’a pas répondu correctement. Réessaie dans quelques instants.");
      }
      if (!reponse.ok || !resultat.checkoutUrl) {
        throw new Error(resultat.error || "Le paiement Mollie est momentanément indisponible.");
      }

      window.location.assign(resultat.checkoutUrl);
    } catch (erreur) {
      if (messagePaiement) {
        messagePaiement.textContent = erreur.message || "Impossible de démarrer le paiement. Réessaie dans quelques instants.";
        messagePaiement.hidden = false;
      }
      boutonCommande.disabled = false;
      boutonCommande.textContent = "Valider mon panier";
    }
  }

  afficherPanier();
  if (listeProduits) chargerProduits();
});