function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: "Requête non autorisée." }, 403);
  }
  if (!env.MOLLIE_API_KEY) {
    return jsonResponse({ error: "Le paiement en ligne n’est pas encore configuré." }, 503);
  }
  if (!env.PAYMENTS || typeof env.PAYMENTS.get !== "function") {
    return jsonResponse({ error: "Le suivi des paiements n’est pas encore configuré." }, 503);
  }

  const orderReference = requestUrl.searchParams.get("ref") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderReference)) {
    return jsonResponse({ error: "Référence de paiement invalide." }, 400);
  }

  let order;
  try {
    order = await env.PAYMENTS.get(orderReference, "json");
  } catch (error) {
    return jsonResponse({ error: "Impossible de retrouver le paiement." }, 503);
  }
  if (!order || typeof order.paymentId !== "string" || !/^tr_[A-Za-z0-9]+$/.test(order.paymentId)) {
    return jsonResponse({ error: "La référence de paiement est introuvable ou a expiré." }, 404);
  }

  let mollieResponse;
  try {
    mollieResponse = await fetch("https://api.mollie.com/v2/payments/" + encodeURIComponent(order.paymentId), {
      headers: {
        "Authorization": "Bearer " + env.MOLLIE_API_KEY,
        "Accept": "application/hal+json"
      }
    });
  } catch (error) {
    return jsonResponse({ error: "Impossible de vérifier le paiement auprès de Mollie." }, 502);
  }
  if (!mollieResponse.ok) {
    return jsonResponse({ error: "La vérification du paiement a échoué." }, 502);
  }

  const payment = await mollieResponse.json();
  return jsonResponse({ status: payment.status }, 200);
}