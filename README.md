# Grid Defender: AI Load Control

Serious game web ou le joueur incarne un operateur reseau qui doit passer le pic de 19h tout en pilotant les charges IA d'un datacenter souverain.

Le message produit est volontairement equilibre: l'IA n'est pas coupee, elle est priorisee, reportee ou optimisee selon la tension reseau, la criticite et la valeur du job.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Zustand pour l'etat de jeu
- Recharts pour la telemetrie
- SVG anime pour la carte reseau

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir `http://127.0.0.1:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Contenu MVP

- ecran de lancement mission
- simulation tick fixe de 17:30 a 20:30
- carte reseau 2D/2.5D avec flux animes
- jauges stabilite, CO2, cout, souverainete, productivite IA, satisfaction, services critiques, batterie
- actions joueur: EV smart, report IA, reduction modele, cache, timeout agent, batterie, import, thermique
- evenements scripted: pic EV, job video, chute solaire, job cyber, agent en boucle
- assistant ATHENA deterministe
- graphiques production/demande, stabilite, batterie, charge IA
- debrief final et leaderboard local

## Structure

- `src/game`: types, scenario, actions et moteur de simulation pur TypeScript
- `src/store`: store Zustand et persistance leaderboard locale
- `src/components/game`: cockpit, actions, assistant, jobs IA, resultats
- `src/components/map`: carte SVG interactive
- `src/components/charts`: graphiques Recharts
