# AlphaSnipe — Dashboard Memecoin Trading Bot

Interface frontend moderne simulant le tableau de bord d'un bot de sniping de
memecoins. **Données entièrement simulées, à but de démonstration / illustration.**

## Aperçu

- **Capital initial :** 0.10 ETH
- **Sommet :** 15.4 ETH — puis série perdante finale → **solde final 14.73 ETH**
- **Période :** 3 février 2025 → 28 janvier 2026 (bot ensuite arrêté)
- **623 trades** générés (≈ 70 % de gains au global ; les 35 derniers, dès le
  24 janvier, sont de petits trades à 85 % perdants)
- 46 memecoins connus : TRUMP, MELANIA, MAGA, DOGE, PEPE, SHIB, WIF, BONK,
  POPCAT, FARTCOIN, PNUT, BRETT, FLOKI, MOG, GOAT, PONKE, SPX, DEGEN…

## Fonctionnalités

- Cartes de stats (valeur du portefeuille, P&L, taux de réussite, meilleur trade)
- Courbe d'équité (canvas pur, échelle log, tooltip au survol)
- Historique de trades complet, filtrable (tous / gains / pertes)
- Watchlist memecoins avec prix « live » et sparklines animées
- Positions ouvertes + configuration du bot

## Lancer

Aucune dépendance / build. Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
cd memecoin-dashboard
python3 -m http.server 8080
# puis http://localhost:8080
```

## Architecture

| Fichier      | Rôle                                                            |
|--------------|-----------------------------------------------------------------|
| `index.html` | Structure de la page                                            |
| `styles.css` | Thème sombre, mise en page                                      |
| `data.js`    | Génération déterministe de l'historique (PRNG seedé)            |
| `app.js`     | Rendu : stats, graphique, tableau, watchlist                   |

La courbe d'équité est construite via une dérive logarithmique linéaire
(0.10 → 16.40 ETH) à laquelle s'ajoute un **pont brownien** (bruit nul aux
extrémités). Le solde final vaut donc toujours exactement 16.40 ETH, tout en
produisant des phases de gains et de pertes réalistes. Le PRNG étant seedé,
l'historique est identique à chaque chargement.
