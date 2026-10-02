function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: "Requête non autorisée." }, 403);
  }

  if (!env.MOLLIE_API_KEY) {
    return jsonResponse({ error: "Le paiement en ligne n’est pas encore configuré." }, 503);
  }
  if (!env.PAYMENTS || typeof env.PAYMENTS.put !== "function") {
    return jsonResponse({ error: "Le suivi des paiements n’est pas encore configuré." }, 503);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 10000) {
    return jsonResponse({ error: "Le panier est trop volumineux." }, 413);
  }

  let payload;
  try {
    const body = await request.text();
    if (body.length > 10000) return jsonResponse({ error: "Le panier est trop volumineux." }, 413);
    payload = JSON.parse(body);
  } catch (error) {
    return jsonResponse({ error: "Le contenu du panier est invalide." }, 400);
  }

  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 40) {
    return jsonResponse({ error: "Le panier est vide ou contient trop d’articles." }, 400);
  }
  if (payload.items.some(function (id) { return typeof id !== "string" || id.length > 80; })) {
    return jsonResponse({ error: "Un article du panier est invalide." }, 400);
  }

  let products;
  try {
    const catalogResponse = await env.ASSETS.fetch(new URL("/products.json", requestUrl));
    if (!catalogResponse.ok) throw new Error("Catalogue indisponible");
    products = await catalogResponse.json();
  } catch (error) {
    return jsonResponse({ error: "Impossible de vérifier les prix du catalogue." }, 503);
  }
  if (!Array.isArray(products)) {
    return jsonResponse({ error: "Le catalogue est indisponible." }, 503);
  }

  const productsById = new Map(products.filter(function (product) {
    return product && typeof product.id === "string" && typeof product.nom === "string" &&
      Number.isFinite(Number(product.prix)) && Number(product.prix) > 0;
  }).map(function (product) {
    return [product.id, product];
  }));
  const quantities = new Map();
  for (const id of payload.items) {
    if (!productsById.has(id)) {
      return jsonResponse({ error: "Un article de ton panier n’est plus disponible." }, 400);
    }
    quantities.set(id, (quantities.get(id) || 0) + 1);
  }

  let totalCents = 0;
  const orderLines = [];
  for (const [id, quantity] of quantities) {
    const product = productsById.get(id);
    const unitPriceCents = Math.round(Number(product.prix) * 100);
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 1) {
      return jsonResponse({ error: "Le prix d’un article est invalide." }, 400);
    }
    totalCents += unitPriceCents * quantity;
    orderLines.push({ id: id, quantity: quantity });
  }
  if (!Number.isSafeInteger(totalCents) || totalCents < 1) {
    return jsonResponse({ error: "Le montant de la commande est invalide." }, 400);
  }

  const orderReference = crypto.randomUUID();
  const redirectUrl = new URL("/paiement.html", requestUrl);
  redirectUrl.searchParams.set("ref", orderReference);

  let mollieResponse;
  try {
    mollieResponse = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.MOLLIE_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/hal+json"
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (totalCents / 100).toFixed(2) },
        description: "Commande Ma poulette - " + payload.items.length + " article(s)",
        redirectUrl: redirectUrl.href,
        locale: "fr_FR",
        metadata: { order_reference: orderReference, items: orderLines }
      })
    });
  } catch (error) {
    return jsonResponse({ error: "Mollie est momentanément inaccessible. Réessaie dans quelques instants." }, 502);
  }

  if (!mollieResponse.ok) {
    return jsonResponse({ error: "Mollie n’a pas pu créer le paiement. Vérifie la configuration de ton compte." }, 502);
  }

  let payment;
  try {
    payment = await mollieResponse.json();
  } catch (error) {
    return jsonResponse({ error: "La réponse de Mollie est invalide." }, 502);
  }

  const checkoutUrl = payment && payment._links && payment._links.checkout && payment._links.checkout.href;
  let checkout;
  try {
    checkout = new URL(checkoutUrl);
  } catch (error) {
    return jsonResponse({ error: "Mollie n’a pas fourni de lien de paiement valide." }, 502);
  }
  if (checkout.protocol !== "https:" || (checkout.hostname !== "mollie.com" && !checkout.hostname.endsWith(".mollie.com")) || !payment.id) {
    return jsonResponse({ error: "Mollie n’a pas fourni de lien de paiement valide." }, 502);
  }

  try {
    await env.PAYMENTS.put(orderReference, JSON.stringify({ paymentId: payment.id }), { expirationTtl: 2592000 });
  } catch (error) {
    return jsonResponse({ error: "Impossible d’enregistrer la référence du paiement. Contacte la boutique avant de réessayer." }, 503);
  }

  return jsonResponse({ checkoutUrl: checkoutUrl }, 200);
}