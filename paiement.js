document.addEventListener("DOMContentLoaded", async function () {
  const titre = document.getElementById("titre-paiement");
  const message = document.getElementById("message-paiement");
  const orderReference = new URLSearchParams(window.location.search).get("ref");

  if (!orderReference) {
    titre.textContent = "Paiement non vérifié";
    message.textContent = "Aucune référence de paiement n’a été reçue. Le panier est conservé ; tu peux vérifier la transaction dans Mollie.";
    return;
  }

  try {
    const response = await fetch("/api/payment-status?ref=" + encodeURIComponent(orderReference), { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Vérification impossible.");

    if (result.status === "paid") {
      titre.textContent = "Paiement confirmé";
      message.textContent = "Merci pour ta commande. Le paiement a bien été confirmé par Mollie.";
      localStorage.removeItem("ma-poulette-panier");
    } else if (["canceled", "failed", "expired"].includes(result.status)) {
      titre.textContent = "Paiement non effectué";
      message.textContent = "Le paiement n’a pas été confirmé. Ton panier est conservé ; tu peux réessayer.";
    } else {
      titre.textContent = "Paiement en cours";
      message.textContent = "Mollie n’a pas encore confirmé le paiement. Ton panier est conservé ; vérifie à nouveau dans quelques instants.";
    }
  } catch (error) {
    titre.textContent = "Vérification momentanément indisponible";
    message.textContent = "Ton panier est conservé. Vérifie le statut dans Mollie ou réessaie dans quelques instants.";
  }
});