# Configuration de Mollie

Le paiement est créé par une fonction Cloudflare Pages. La clé Mollie n’est jamais envoyée au navigateur.

## Configuration Cloudflare

1. Dans Mollie, récupère une clé de test dans **Developers > API access tokens**.
2. Dans Cloudflare, crée un namespace depuis **Storage & databases > KV**.
3. Dans **Workers & Pages > ma-poulette2 > Settings > Bindings**, ajoute ce namespace comme liaison KV nommée exactement `PAYMENTS`. Les références de paiement y sont conservées pendant 30 jours.
4. Dans **Settings > Variables and Secrets**, ajoute `MOLLIE_API_KEY` comme secret chiffré avec la clé de test. Ne colle pas cette clé dans un fichier du site ni dans une conversation.
5. Redéploie le projet après avoir configuré le secret et l’espace KV.

Pour passer en production, remplace la clé de test par la clé Live Mollie dans le secret Cloudflare, puis redéploie.

## Parcours de paiement

Le navigateur transmet uniquement les identifiants des articles. La fonction relit `products.json` et recalcule le montant côté serveur avant de créer le paiement Mollie. Au retour, une référence aléatoire permet de vérifier le statut directement auprès de Mollie. Le panier n’est vidé que lorsque Mollie confirme le statut `paid`.

Les pages de demande de devis « Créer mon bijou » et « Atelier » ne déclenchent pas de paiement immédiat.