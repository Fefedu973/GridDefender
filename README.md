# Grid Defender: AI Load Control

Serious game web où le joueur incarne un opérateur réseau qui doit maintenir un réseau électrique sous tension pendant que les charges IA montent en puissance.

La carte 3D n’est plus une simple illustration : le runtime contient les nœuds, lignes, flux, températures de conducteurs, trips de protection, commandes actives et métriques cumulatives. Les actions du joueur ciblent la carte et recalculent immédiatement le réseau.

## Stack

- Next.js App Router 16
- React 19 + TypeScript
- Three.js, React Three Fiber, Drei, postprocessing
- Zustand pour l’état runtime et la progression locale
- Recharts pour la télémétrie
- `node:test` + `tsx` pour les tests unitaires TypeScript
- Static export GitHub Pages via GitHub Actions

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir `http://127.0.0.1:3000`.

## Vérification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Gameplay actuel

- Carte 3D de commandement avec infrastructures procédurales.
- Solveur de flux DC sur graphe de transport.
- Température persistante des lignes, surcharge, protection et cascade.
- Production/demande dérivées des nœuds de la carte.
- Commandes ciblées : EV smart, report IA, migration IA, modèle réduit, cache, timeout agent, batterie, import, thermique, effacement industriel, reroutage, réparation, surcharge temporaire.
- Capacité opérationnelle, cooldowns et autopilot ATHENA limité.
- Score cumulatif : surcharge, énergie non servie, CO₂, coût, trips, IA utile, gaspillage et assistances.
- Campagne locale avec 8 missions, layouts 3D distincts, médailles, récompenses et déblocage progressif.
- Profils électriques distincts par carte : capacités, contraintes et labels réseau changent entre microgrid, France, Corse, Couloir Rhône, Black Grid et Europe 2030.
- Timeline interactive : un job IA non critique peut être glissé vers un créneau de report.
- Premier écran jouable : le briefing passif reste accessible à la demande mais ne bloque plus le tutoriel.
- Défi quotidien, Crisis Run, Sandbox et Scenario Builder paramétrable lançables depuis l’accueil.
- Crisis Run enchaîne trois vagues sur une durée cible de 8 à 12 minutes avec choix de doctrine entre deux crises.
- Objectifs de mission mesurés et affichés au débrief.
- Replay de fin de partie sur le moment critique : fenêtre temporelle, stabilité, réserve, charge et réponse opérateur.
- Qualité de rendu High / Standard / Safe demo.
- Audio adaptatif WebAudio activable, avec pulses de commande et déclenchement.

## Structure

- `src/game/engine` : boucle de simulation, scoring, commandes appliquées.
- `src/game/simulation` : node balance, DC power flow, thermique ligne, protection.
- `src/game/commands` : coûts, cooldowns et previews de commande.
- `src/game/domain` : définitions de carte, mission, campagne et récompenses.
- `src/content` : registres de cartes, missions, modes seedés et templates de scénarios.
- `src/features/map3d` : renderer Three.js de la carte.
- `src/features/hud` : cockpit, inspecteur, timeline, télémétrie, ATHENA.
- `src/store` : état runtime, progression locale, leaderboard, préférences.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` exécute `npm ci`, `lint`, `typecheck`, `test`, puis `next build` en static export avec `GITHUB_PAGES=true`.

Le site généré est publié depuis `out/` vers GitHub Pages.
