# Audit approfondi de la seconde passe

## Verdict général

La seconde passe est **un énorme progrès visuel**. Le projet n’est plus un simple dashboard : il possède désormais une vraie carte 3D de la France, des infrastructures modélisées, des lignes haute tension animées, une caméra manipulable, des effets de crise et un HUD de centre de commandement. La stack Three.js est correctement intégrée à l’application existante avec React Three Fiber, Drei et du postprocessing.

Mais le problème principal est maintenant très clair :

> **Le projet a une nouvelle enveloppe 3D impressionnante, mais il joue encore essentiellement comme l’ancien prototype 2D.**

Le réseau 3D n’est pas encore le véritable moteur du jeu. Il représente visuellement les événements produits par l’ancien simulateur global, mais les lignes, les nœuds et leur topologie ne déterminent pas réellement l’évolution de la partie.

Mon évaluation à partir du repo, sans avoir exécuté le build visuellement :

| Domaine                            | Niveau actuel |
| ---------------------------------- | ------------: |
| Direction artistique               |          8/10 |
| Base technique 3D                  |          7/10 |
| Lisibilité du concept              |          7/10 |
| Gameplay systémique                |          3/10 |
| Sensation de contrôle              |          3/10 |
| Progression et rejouabilité        |          1/10 |
| Architecture pour plusieurs cartes |          3/10 |
| Potentiel après refonte gameplay   |          9/10 |

La priorité ne doit donc plus être d’ajouter davantage de petits modèles 3D. Il faut maintenant **transformer la carte en système de jeu réel**.

---

# 1. Ce qui a été bien réalisé

## 1.1. Le pivot Three.js est réellement fait

L’application utilise maintenant :

* `three` ;
* `@react-three/fiber` ;
* `@react-three/drei` ;
* `@react-three/postprocessing` ;
* Bloom, vignette, brouillard, éclairages et caméra orbitale.

Le canvas remplit tout l’écran et les panneaux sont devenus des overlays flottants. C’est exactement la bonne direction générale pour une démonstration VivaTech.

Le composant `FranceGridCanvas` est proprement isolé du reste de l’application. Il contient le terrain, le réseau, les nœuds, les effets de crise, la caméra et le postprocessing. Le fait que Three.js reste une couche de rendu React et non le détenteur de la logique métier est une bonne décision.

---

## 1.2. La France est reconnaissable et géographiquement structurée

La silhouette de la France métropolitaine et de la Corse est construite à partir de coordonnées longitude/latitude projetées. Le terrain est extrudé et entouré d’un contour lumineux, avec une grille de commandement en arrière-plan.

Les nœuds sont eux aussi positionnés à partir de coordonnées géographiques, avec quelques décalages manuels pour éviter les superpositions en Île-de-France et dans la vallée du Rhône. La carte est donc beaucoup plus crédible que l’ancien radar abstrait.

---

## 1.3. Les lignes sont bien plus impressionnantes

Les lignes disposent désormais de :

* trois conducteurs visuels ;
* pylônes intermédiaires ;
* courbes en 3D ;
* épaisseur variable ;
* couleurs selon la charge ;
* halo en surcharge ;
* particules représentant le flux ;
* grande hitbox invisible pour faciliter les clics.

C’est une très bonne base visuelle. L’utilisation d’un tube invisible pour rendre les lignes fines facilement sélectionnables est notamment une bonne décision d’UX.

La vitesse et le nombre des particules évoluent avec le flux et le taux d’utilisation. Ce sont déjà des informations de gameplay visibles directement sur la carte.

---

## 1.4. Les infrastructures ont une vraie identité

Les nœuds ne sont plus de simples icônes. Ils disposent de modèles procéduraux distincts :

* tours de refroidissement ;
* datacenters ;
* batteries ;
* panneaux solaires ;
* éoliennes ;
* hôpital ;
* ville ;
* industrie ;
* interconnexion ;
* borne de recharge.

Ils possèdent des animations de vapeur, ventilateurs, LED, remplissage et pulsation.

Cela permet déjà au joueur de reconnaître un type de site sans lire son nom.

---

## 1.5. Le HUD est nettement meilleur

Le cockpit est maintenant construit autour de la carte :

* barre de commandement supérieure ;
* indicateurs à gauche ;
* inspecteur contextuel à droite ;
* liste des jobs IA ;
* assistant ATHENA ;
* télémétrie escamotable ;
* timeline inférieure.

La hiérarchie générale est plus proche d’un jeu de commandement que d’un tableau de bord SaaS.

L’inspecteur distingue les lignes, les nœuds et les workloads IA. Une ligne sélectionnée affiche désormais son flux, sa capacité, sa charge, ses causes et des actions suggérées. C’est exactement l’information que le joueur doit obtenir en cliquant sur une surcharge.

---

## 1.6. La présentation produit a été soignée

Il existe maintenant :

* un écran d’accueil avec carte 3D live ;
* un onboarding animé en sept étapes ;
* un écran de résultats ;
* un leaderboard local ;
* des confettis lors de la victoire ;
* un débrief énergie et IA.

La démo paraît beaucoup plus complète et présentable.

---

# 2. Le problème architectural central

## Le jeu contient actuellement deux réseaux différents

Il existe d’un côté l’ancien modèle de simulation :

* production globale ;
* consommation globale ;
* batterie globale ;
* réserve globale ;
* stabilité globale ;
* jobs IA globaux.

Et de l’autre côté, la nouvelle représentation 3D :

* nœuds géographiques ;
* lignes haute tension ;
* capacités de lignes ;
* flux locaux ;
* états chargés ou critiques.

Mais ces deux systèmes ne sont pas réellement unifiés.

Le moteur principal calcule toujours la production et la demande avec des blocs globaux comme nucléaire, solaire, éolien, hydraulique, résidentiel, industrie, hôpital, EV et IA. Il ne parcourt pas les nœuds ni les lignes du réseau 3D.

Ensuite, `getFranceGridSnapshot` reconstruit une représentation visuelle en utilisant :

* des flux de base prédéfinis ;
* les flags d’événements ;
* le nom ou l’identifiant des lignes ;
* des bonus et malus manuels.

Par exemple, une ligne reçoit davantage de “pression” parce que son identifiant contient `paris`, `bordeaux` ou `lyon`. Les flux ne proviennent pas d’un calcul de réseau.

Cela provoque plusieurs problèmes.

### Une ligne rouge ne menace pas réellement le système

La ligne peut apparaître à 112 %, mais cette surcharge ne participe pas au calcul de stabilité global. Le réseau 3D illustre la crise ; il ne la génère pas.

### Les flux ne sont pas conservés

Les flux des lignes ne sont pas calculés à partir des surplus et déficits des nœuds. La somme des lignes sortant d’une centrale peut donc être différente de sa production affichée.

### Les chiffres nationaux et locaux ne correspondent pas

La carte affiche par exemple plusieurs sites nucléaires avec leurs propres productions, tandis que le simulateur global utilise une seule valeur nucléaire. Les sommes visibles sur la carte ne correspondent donc pas nécessairement à la production du HUD.

### Une surcharge n’entraîne aucune cascade

Il n’existe pas encore de :

* ligne qui disjoncte ;
* reroutage ;
* surcharge d’une ligne voisine ;
* zone isolée ;
* ville partiellement coupée ;
* redémarrage progressif.

C’est pourtant précisément là que se trouve le potentiel ludique du concept.

---

# 3. Les actions sont contextuelles visuellement, mais pas techniquement

C’est probablement le point qui nuit le plus à la sensation de contrôle.

L’inspecteur présente des “actions locales”, mais son bouton n’envoie au store que le type d’action :

```txt
defer_ai
smart_ev
discharge_battery
activate_cache
```

Il n’envoie ni la ligne sélectionnée, ni le nœud sélectionné, ni le job sélectionné.

Le moteur reçoit lui aussi seulement `actionType`. Il choisit ensuite automatiquement sa cible. Par exemple :

* “Décaler IA” sélectionne le plus gros job non critique disponible ;
* “Réduire le modèle” sélectionne automatiquement le job actif le plus lourd ;
* “Activer le cache” active le cache sur tous les jobs ;
* “Décharger batterie” agit sur une batterie globale ;
* “Recharge EV intelligente” agit sur toute la demande EV.

Cela signifie que :

> Le joueur peut cliquer sur la ligne Grenoble–Rhône, puis choisir “Décaler IA”, alors que le moteur peut décider de décaler un job situé implicitement à Paris.

La carte donne l’illusion d’une action locale, mais la simulation applique une action globale.

## Correction indispensable

Toute action doit devenir une commande ciblée comprenant au minimum :

* type de commande ;
* type de cible ;
* identifiant de la cible ;
* intensité choisie ;
* durée ;
* paramètres facultatifs.

Exemples conceptuels :

```txt
Décaler le workload video-demo jusqu’à 20h05
Décharger la batterie centre-battery à 18 MW pendant 15 minutes
Réduire la recharge de bordeaux-ev de 25 MW
Ouvrir la ligne paris-lyon
Migrer le workload dev-agent de Paris-Saclay vers Grenoble
Limiter le datacenter Paris-Saclay à 55 MW
```

Le moteur doit ensuite :

1. vérifier que la commande est valide ;
2. calculer son coût ;
3. prévoir son impact ;
4. l’appliquer à la cible ;
5. recalculer les flux ;
6. montrer les nouvelles conséquences.

---

# 4. Le rythme actuel empêche presque le gameplay

La mission s’étend de 17h30 à 20h30, avec des ticks de 5 minutes. Cela représente 36 ticks.

Le jeu déclenche un tick toutes les `1350 / speed` millisecondes, et la vitesse par défaut est `×1`. La mission complète dure donc environ :

> **36 × 1,35 seconde = 48,6 secondes**

À cette vitesse :

* le premier événement arrive après environ 8 secondes ;
* le job vidéo après 16 secondes ;
* la chute solaire après 22 secondes ;
* le job cyber après 27 secondes ;
* l’agent en boucle après 32 secondes ;
* la partie se termine avant 50 secondes.

C’est beaucoup trop rapide pour :

* comprendre la carte ;
* lire l’inspecteur ;
* manipuler la caméra ;
* comparer plusieurs actions ;
* ressentir leurs conséquences.

Le mode ×0,25 produit une partie d’environ 3 minutes 15, ce qui est beaucoup plus raisonnable, mais ce n’est pas la vitesse par défaut.

## Nouvelle règle de rythme

Une mission doit durer entre **3 et 6 minutes**, avec environ **6 à 10 décisions significatives**.

Je recommande :

* vitesse normale : un tick toutes les 4 à 5 secondes ;
* ralentissement automatique lors d’un événement critique ;
* courte pause tactique au premier événement d’un niveau ;
* possibilité de préparer une action pendant la pause ;
* mode difficile sans pause automatique ;
* mode démo piloté avec séquences maîtrisées.

Chaque événement doit offrir au moins 15 à 30 secondes pour comprendre et agir.

---

# 5. Pourquoi le gameplay reste encore limité

## 5.1. Il n’y a pas de ressource de commandement

Les actions peuvent être déclenchées presque librement. Il n’existe pas de véritable :

* cooldown ;
* coût en points de commandement ;
* nombre limité d’ordres ;
* temps de déploiement ;
* niveau de confiance ;
* coût opérationnel immédiat ;
* limite régionale.

Le joueur peut donc utiliser les solutions au fur et à mesure sans construire de stratégie.

Il faut introduire une ressource simple, par exemple :

### Capacité opérationnelle

Le joueur dispose de 100 points de capacité sur la mission.

* lissage EV : 10 points ;
* déplacement de workload : 15 points ;
* activation batterie : 20 points ;
* reroutage : 15 points ;
* import : pas de points mais coût/souveraineté ;
* thermique : pas de points mais forte pénalité CO₂ ;
* appel ATHENA avancé : 5 points ou baisse du multiplicateur de score.

Cette ressource ne doit pas être réaliste au sens industriel strict. Elle sert à créer de vraies décisions.

---

## 5.2. ATHENA donne parfois directement la solution

L’assistant calcule une recommandation et présente un bouton permettant de l’appliquer en un clic.

C’est utile pour une démo, mais cela réduit fortement l’agence du joueur. Il suffit souvent de suivre le bouton lumineux.

ATHENA devrait avoir trois niveaux :

1. **Diagnostic gratuit**
   “La surcharge vient principalement de Paris-Saclay et des EV.”

2. **Options comparées**
   “Déplacer le job IA réduit 24 MW, la batterie en apporte 32, l’import en apporte 34 mais pénalise la souveraineté.”

3. **Autopilot limité**
   ATHENA applique l’action, mais consomme un jeton d’assistance ou réduit le multiplicateur de score.

Pour obtenir une médaille parfaite, le joueur devrait terminer sans autopilot.

---

## 5.3. Tous les événements sont prévisibles

La timeline affiche tous les événements du scénario, y compris ceux qui n’ont pas encore eu lieu.

Pour un tutoriel, c’est acceptable. Pour les niveaux suivants, cela supprime la surprise.

Il faut distinguer :

* événements planifiés connus ;
* prévisions avec probabilité ;
* événements cachés ;
* événements conditionnels déclenchés par les choix du joueur.

Exemple :

```txt
18h45 — risque élevé de chute solaire
19h00–19h20 — demande cyber possible
? — incident non identifié
```

Les modes difficiles doivent réduire la précision de la prévision.

---

## 5.4. Il existe une solution optimale trop évidente

La recommandation de l’écran final indique toujours la même stratégie :

* lisser les EV ;
* reporter l’IA non critique ;
* conserver la batterie ;
* protéger le cyber.

Cette recommandation est écrite en dur et ne dépend pas réellement de la partie.

Le jeu doit proposer plusieurs stratégies viables :

### Stratégie sobre

* beaucoup de planification ;
* peu d’import ;
* faible CO₂ ;
* quelques retards IA.

### Stratégie souveraine

* tout garder en France ;
* solliciter batteries et industrie ;
* coût plus élevé ;
* forte souveraineté.

### Stratégie économique

* utiliser les options les moins chères ;
* accepter plus de risque ;
* optimiser l’IA et les EV.

### Stratégie résilience

* garder d’importantes réserves ;
* sacrifier une partie de la productivité ;
* excellente continuité critique.

Le score et les badges doivent reconnaître ces styles.

---

# 6. Le score doit être cumulatif, pas seulement final

Le score actuel est recalculé à partir des métriques présentes à l’instant courant, puis la valeur finale est utilisée à la fin de la mission.

Cela crée un problème : un joueur peut mal gérer le réseau pendant une grande partie de la mission, puis remonter les jauges avant la fin et obtenir un résultat relativement correct.

Le système doit mémoriser :

* durée totale de surcharge ;
* énergie non servie ;
* nombre de lignes critiques ;
* durée d’indisponibilité d’un service ;
* CO₂ cumulé ;
* coût cumulé ;
* valeur IA produite ;
* deadlines respectées ;
* puissance inutile consommée ;
* actions anticipées ;
* actions d’urgence ;
* sur-réactions.

## Formule recommandée

Le score final doit combiner :

### Sécurité — 35 %

* aucune coupure critique ;
* faible énergie non servie ;
* peu de temps en surcharge.

### Efficacité énergétique — 20 %

* CO₂ cumulé ;
* utilisation du stockage ;
* faible usage thermique.

### IA — 20 %

* valeur des jobs terminés ;
* respect des deadlines ;
* énergie dépensée par unité de valeur ;
* absence de boucles inutiles.

### Souveraineté — 10 %

* calcul stratégique local ;
* dépendance extérieure ;
* continuité des workloads critiques.

### Économie — 10 %

* coût cumulé ;
* efficacité des ordres ;
* pénalité d’effacement.

### Maîtrise — 5 %

* anticipation ;
* nombre d’assistances ATHENA ;
* absence de spam d’actions.

---

# 7. La progression est actuellement inexistante

Le store ne conserve aujourd’hui que :

* le jeu courant ;
* la vitesse ;
* la sélection ;
* un leaderboard local ;
* l’état “tutoriel vu ou non”.

Il n’existe pas de campagne, de niveaux débloqués, de médailles ou d’outils progressivement accessibles. De plus, `eveningPeakScenario` est directement codé dans l’initialisation, le lancement et le reset de la partie.

L’écran d’accueil ne propose qu’une seule mission.

Le type `Scenario` ne contient pas encore :

* identifiant de carte ;
* difficulté ;
* prérequis ;
* objectifs mesurables ;
* récompenses ;
* événements aléatoires ;
* paramètres environnementaux ;
* règles particulières.

---

# 8. Progression de campagne recommandée

La progression doit introduire **une mécanique nouvelle par mission**. Il ne faut pas présenter huit jauges et huit actions dès le début.

## Structure de campagne

| Niveau                    | Carte                    | Nouvelle mécanique                     | Moment spectaculaire                           |
| ------------------------- | ------------------------ | -------------------------------------- | ---------------------------------------------- |
| 0. Première garde         | Microgrid VivaTech       | Batterie et équilibre simple           | Le stand principal s’éteint puis redémarre     |
| 1. Paris sous tension     | Île-de-France            | EV et jobs IA flexibles                | Une ligne alimente Paris à 115 %               |
| 2. L’île énergétique      | Corse                    | Réseau isolé, solaire et stockage      | Passage soudain en mode îloté                  |
| 3. Tempête Atlantique     | Bretagne / Ouest         | Météo et panne de ligne                | Une ligne tombe et les flux se reroutent       |
| 4. Couloir Rhône          | Rhône-Alpes / PACA       | Industrie, congestion et effacement    | Surcharge nord-sud en cascade                  |
| 5. Souveraineté numérique | France nationale         | Migration entre datacenters            | Choix entre cloud étranger et surcharge locale |
| 6. Black Grid             | France nationale de nuit | Cyberattaque et données incertaines    | Télémetrie partielle, ligne fantôme            |
| Finale. Europe 2030       | France + interconnexions | Prix, carbone et solidarité européenne | Crise simultanée dans plusieurs pays           |

---

## Niveau 0 — Microgrid VivaTech

Carte très petite :

* arrivée réseau ;
* batterie ;
* bornes EV ;
* scène principale ;
* datacenter local ;
* hôpital ou service critique fictif.

Le joueur apprend directement en jouant :

1. cliquer sur une ligne ;
2. lire sa charge ;
3. activer une batterie ;
4. voir immédiatement la ligne refroidir.

Aucun onboarding de sept pages n’est nécessaire avant ce niveau. L’onboarding actuel est bien produit, mais trop long et trop passif pour un salon.

---

## Niveau 1 — Île-de-France

Nouvelles mécaniques :

* jobs IA ;
* deadlines ;
* recharge EV ;
* flexibilité ;
* modèle léger.

Interaction centrale :

> Glisser un job IA sur un autre créneau de la timeline.

Ce drag-and-drop pourrait devenir le geste signature du jeu.

---

## Niveau 2 — Corse

Mécaniques :

* stockage limité ;
* solaire variable ;
* interconnexion unique ;
* mode îloté ;
* redémarrage réseau.

Cette carte change réellement la topologie et ne ressemble pas à une simple reskin de la France.

---

## Niveau 3 — Bretagne / Atlantique

Mécaniques :

* météo incertaine ;
* vent variable ;
* panne de ligne ;
* reroutage ;
* réparation avec délai.

Le joueur doit choisir entre :

* rerouter immédiatement ;
* réduire la demande ;
* attendre une réparation ;
* solliciter l’interconnexion.

---

## Niveau 4 — Rhône / PACA

Mécaniques :

* forte industrie ;
* congestion nord-sud ;
* effacement coûteux ;
* thermique de secours ;
* objectifs économiques.

Une réduction industrielle sauve le réseau mais pénalise le score économique.

---

## Niveau 5 — France nationale

Mécaniques :

* plusieurs datacenters ;
* migration de workloads ;
* souveraineté ;
* import ;
* régionalisation du carbone.

Le joueur peut déplacer un job entre Paris, Grenoble et un cloud extérieur.

---

## Niveau 6 — Cyberattaque

Mécaniques :

* informations imparfaites ;
* fausses alertes ;
* télémétrie indisponible ;
* lignes dont l’état est incertain ;
* jobs cyber critiques.

ATHENA ne doit pas toujours avoir la bonne réponse. Le joueur doit arbitrer entre confiance, observation et action.

---

# 9. Une métaprogression simple mais efficace

Chaque mission devrait offrir trois médailles.

### Médaille bronze

Terminer la mission sans blackout majeur.

### Médaille argent

Préserver tous les services critiques.

### Médaille or

Atteindre l’objectif secondaire, par exemple :

* aucun thermique ;
* aucun cloud étranger ;
* CO₂ sous un seuil ;
* aucune assistance ATHENA ;
* toutes les deadlines IA respectées.

Les médailles débloquent :

* nouvelles cartes ;
* nouveaux outils ;
* variantes de missions ;
* dossiers de renseignement ;
* skins du centre de commandement ;
* modes de difficulté.

## Outils progressivement débloqués

* recharge EV intelligente ;
* batterie automatique ;
* cache IA ;
* modèle adaptatif ;
* migration inter-datacenter ;
* prévision ATHENA ;
* reroutage de ligne ;
* effacement industriel ;
* démarrage à froid ;
* mode îloté.

Cela évite de surcharger le premier niveau.

---

# 10. Les cartes ne sont pas encore réellement extensibles

Actuellement, la France est codée directement dans plusieurs endroits :

* contour géographique dans `franceGeo.ts` ;

* terrain France dans `FranceTerrain.tsx` ;

* nœuds et lignes dans `franceGrid.ts` ;

* courbures des lignes selon leurs identifiants dans `TransmissionLine.tsx`.

Ajouter une carte nécessiterait donc de modifier le rendu, les données réseau et parfois le composant de ligne.

## Architecture à viser

### `MapDefinition`

Décrit uniquement l’espace :

* identifiant ;
* nom ;
* type de terrain ;
* contour géographique ;
* projection ;
* caméra initiale ;
* nœuds ;
* lignes ;
* chemins visuels ;
* palette ;
* environnement ;
* météo possible ;
* ambiance sonore ;
* échelle des modèles.

### `MissionDefinition`

Décrit le gameplay sur une carte :

* `mapId` ;
* heure de début et fin ;
* état initial ;
* workloads ;
* événements ;
* objectifs ;
* restrictions ;
* ressources disponibles ;
* difficulté ;
* récompenses ;
* seed aléatoire.

### `CampaignDefinition`

Décrit :

* ordre des missions ;
* prérequis ;
* embranchements ;
* récompenses ;
* médailles ;
* progression narrative.

Ainsi, une même carte pourra accueillir plusieurs missions :

```txt
France — pic du soir
France — vague de froid
France — panne nucléaire
France — cyberattaque
France — finale VivaTech
```

---

# 11. Nouvelle structure de code recommandée

```text
src/
  content/
    maps/
      vivatech-campus/
      corsica/
      idf/
      brittany/
      rhone/
      france/
      europe/
    missions/
      tutorial-microgrid/
      paris-peak/
      corsica-islanding/
      atlantic-storm/
      rhone-corridor/
      sovereign-ai/
      black-grid/
    campaign/
      mainCampaign.ts
    eventDecks/
    doctrines/

  game/
    domain/
      mapDefinition.ts
      missionDefinition.ts
      campaignDefinition.ts
      runtimeState.ts
      command.ts
      objective.ts
      reward.ts

    simulation/
      simulationLoop.ts
      nodeBalance.ts
      powerFlow.ts
      lineThermalState.ts
      protectionSystem.ts
      workloadScheduler.ts
      batterySystem.ts
      demandResponse.ts
      eventDirector.ts
      objectiveEvaluator.ts
      cumulativeScoring.ts

    commands/
      validateCommand.ts
      previewCommand.ts
      applyCommand.ts
      commandCosts.ts

    progression/
      campaignProgress.ts
      unlocks.ts
      achievements.ts
      missionRating.ts

  features/
    map3d/
      GridSceneCanvas.tsx
      terrain/
      nodes/
      lines/
      weather/
      camera/
      effects/

    hud/
      commandBar/
      inspector/
      timeline/
      advisor/
      objectives/
      missionResults/

  store/
    runStore.ts
    profileStore.ts
    settingsStore.ts
```

Le composant actuel `FranceGridCanvas` doit devenir un renderer générique du type `GridSceneCanvas`, recevant une carte et un état runtime. Il ne doit plus importer directement `getFranceGridSnapshot`.

---

# 12. Faire du réseau 3D la source de vérité

Le nouvel état runtime doit contenir directement :

```txt
nodes
lines
workloads
batteries
incidents
activeCommands
cumulativeMetrics
```

À chaque tick :

1. Calculer production et demande de chaque nœud.
2. Ajouter les workloads IA au datacenter correspondant.
3. Appliquer les commandes actives.
4. Calculer le solde local de chaque nœud.
5. Résoudre les flux sur le graphe.
6. Mettre à jour la température de chaque ligne.
7. Déclencher les protections et disjonctions.
8. Recalculer les flux après une coupure.
9. Mesurer les demandes non servies.
10. Mettre à jour les objectifs et scores.
11. Envoyer exactement cet état à la carte 3D.

## Modèle de surcharge recommandé

Une ligne ne doit pas disjoncter dès qu’elle atteint 101 %.

Elle doit avoir une inertie thermique :

```txt
< 80 %       refroidissement
80–100 %     température stable ou légère hausse
100–115 %    chauffe progressive
115–130 %    chauffe rapide
> 130 %      risque de déclenchement immédiat
```

Le joueur voit :

* la ligne jaunir ;
* devenir orange ;
* rougir ;
* produire des étincelles ;
* s’affaisser légèrement ;
* déclencher une alarme ;
* éventuellement se couper.

Une ligne coupée oblige alors le réseau à rerouter le flux, ce qui peut surcharger les voisines.

C’est cette cascade qui produira les moments de jeu mémorables.

---

# 13. Introduire de vraies interactions spatiales

## 13.1. Déplacer les jobs IA

Le joueur doit pouvoir glisser un job :

* vers un autre horaire ;
* vers un autre datacenter ;
* vers un modèle plus léger ;
* vers un cloud externe.

Pendant le déplacement, la carte affiche un aperçu :

```txt
Paris-Saclay : -24 MW
Grenoble : +24 MW
Ligne Paris–Lyon : 106 % → 88 %
Souveraineté : inchangée
Deadline : respectée
Coût : +4
```

Le joueur comprend alors réellement l’impact de son choix.

---

## 13.2. Piloter la batterie avec un curseur

Au lieu d’un bouton fixe “Décharger batterie”, proposer :

* puissance de 0 à 40 MW ;
* durée de 5 à 30 minutes ;
* estimation du niveau restant ;
* lignes soulagées.

Une décharge forte sauve immédiatement le réseau mais consomme la réserve.

---

## 13.3. Commander les lignes

Pour certaines lignes contrôlables :

* ouvrir ;
* fermer ;
* rerouter ;
* limiter le transit ;
* autoriser une surcharge temporaire ;
* envoyer une équipe de réparation.

Les champs `isControllable` et `isCritical` existent déjà dans les données, mais ils ne produisent pas encore de mécanique dédiée.

---

## 13.4. Gérer les entreprises

Chaque site industriel ou datacenter peut appartenir à une organisation fictive :

* opérateur IA souverain ;
* constructeur automobile ;
* hôpital ;
* usine stratégique ;
* salon technologique ;
* cloud étranger.

Chaque entreprise possède :

* consommation ;
* contrat de flexibilité ;
* criticité ;
* coût de réduction ;
* réputation ;
* délai minimal ;
* satisfaction.

Le joueur reçoit alors des demandes :

> “L’industrie lyonnaise accepte une réduction de 18 MW pendant 20 minutes, mais réclame une compensation.”

Cela crée des arbitrages plus humains qu’un simple bouton.

---

# 14. Relier les animations à l’état réel

Les modèles 3D sont déjà animés, mais la plupart des animations sont aujourd’hui des boucles décoratives. Par exemple, les indicateurs de charge, les LED ou le remplissage de batterie évoluent selon le temps d’animation, pas selon la charge réelle du nœud. Le mémo du modèle ne réagit par ailleurs qu’à l’identifiant et au type de nœud, pas à sa puissance ou son statut.

C’est le prochain gros gain visuel.

## Datacenter

* intensité des LED selon la charge ;
* vitesse des ventilateurs selon la puissance ;
* lumière bleue qui vire à orange en surchauffe ;
* racks qui s’éteignent après un throttling ;
* transfert lumineux lors d’une migration.

## Batterie

* niveau de remplissage égal à la vraie charge ;
* animation montante quand elle charge ;
* animation descendante quand elle se décharge ;
* couleur rouge sous 15 %.

## Éolien

* vitesse des pales proportionnelle à la production ;
* arrêt des pales lors d’une chute de vent.

## Solaire

* luminosité et inclinaison liées à l’heure ;
* extinction progressive au coucher du soleil.

## Ville

* nombre de fenêtres éclairées selon la demande ;
* quartiers qui s’éteignent en cas de délestage ;
* lumière d’urgence à l’hôpital.

## Ligne haute tension

* particules dans le véritable sens du flux ;
* vitesse proportionnelle au flux ;
* flux pouvant s’inverser ;
* chaleur, étincelles et vibration en surcharge ;
* disparition du flux lors de la coupure.

> Ajouter encore davantage de géométrie est moins important que rendre chaque animation informative.

---

# 15. Améliorer la caméra et la mise en scène

La caméra actuelle déplace doucement sa cible vers le nœud ou le milieu de la ligne sélectionnée, mais elle ne change pas véritablement de distance ou de cadrage.

Il faut ajouter des presets cinématiques.

## Vue nationale

* France entière ;
* inclinaison légère ;
* faible rotation idle.

## Focus incident

* travelling de 0,8 seconde ;
* cadrage de la ligne et de ses deux nœuds ;
* ralentissement du temps ;
* vignette orange ou rouge.

## Focus datacenter

* zoom plus proche ;
* affichage des flux vers le datacenter ;
* ouverture de la timeline des workloads.

## Coupure

* léger camera shake ;
* flash ;
* extinction de la zone ;
* flux qui se reroutent.

## Résolution

* ligne qui refroidit ;
* couleur rouge vers orange puis vert ;
* petit son de confirmation ;
* score/combo visible brièvement.

Un événement important doit devenir une petite séquence, pas seulement un changement de couleur.

---

# 16. Le son est un énorme manque actuel

Pour une expérience de salon, l’audio représente un gain de perception très supérieur à son coût de développement.

Prévoir :

* bourdonnement électrique permanent ;
* intensité du bourdonnement liée à la demande ;
* clics de sélection ;
* impulsion lors d’une commande ;
* montée sonore lors d’une surcharge ;
* alarmes distinctes pour ligne, datacenter et service critique ;
* disjonction sèche lors d’une coupure ;
* son de flux lors d’un reroutage ;
* voix radio ou synthèse ATHENA ;
* musique adaptative selon la stabilité.

Le joueur doit pouvoir comprendre qu’une crise approche avant même de lire les jauges.

---

# 17. Réduire la surcharge cognitive du HUD

Le HUD est beau, mais il affiche simultanément beaucoup d’informations :

* sept jauges à gauche ;

* inspecteur ;

* jobs IA ;

* ATHENA ;

* timeline ;

* télémétrie ;

* barre supérieure.

Pour les premières missions, limiter l’affichage principal à :

* stabilité ;
* réserve ;
* continuité critique ;
* objectif courant.

Les métriques CO₂, coût, souveraineté et IA peuvent apparaître progressivement.

Le panneau des jobs IA ne devrait être ouvert en permanence que lorsque :

* un datacenter est sélectionné ;
* un événement IA survient ;
* le joueur active le mode “couche IA”.

Ajouter trois couches de lecture :

```txt
Réseau
IA
Carbone / coût
```

Chaque couche change les couleurs, labels et informations de la carte.

---

# 18. Refaire le tutoriel comme mission interactive

L’onboarding actuel contient sept écrans explicatifs avant de jouer. Il est bien présenté, mais il retarde le moment où l’utilisateur touche réellement à la carte.

Le tutoriel idéal dure 90 secondes :

1. Une ligne devient orange.
2. ATHENA demande de cliquer dessus.
3. Le joueur lit la cause.
4. Le jeu met en évidence la batterie.
5. Le joueur choisit 15 MW de décharge.
6. La ligne repasse au vert.
7. Un job IA apparaît.
8. Le joueur le déplace sur la timeline.
9. Mission réussie.

Les informations conceptuelles sur souveraineté et décarbonation peuvent être affichées entre deux actions, en une phrase.

---

# 19. Améliorer la rejouabilité

Une campagne linéaire ne suffira pas à rendre le jeu durable.

Après les missions principales, ajouter :

## Crisis Run

Une partie de 8 à 12 minutes avec événements semi-aléatoires et trois vagues.

À la fin de chaque vague, le joueur choisit une doctrine :

* cache IA distribué ;
* batterie renforcée ;
* meilleure prévision météo ;
* contrats EV flexibles ;
* import moins coûteux ;
* protection de ligne améliorée.

## Défi quotidien

* carte et seed communes ;
* mêmes événements pour tous ;
* leaderboard ;
* score comparable.

## Sandbox

* choix de la carte ;
* heure ;
* météo ;
* demande ;
* capacité IA ;
* pannes ;
* niveau de difficulté.

## Scenario Builder

Permettre à l’équipe du hackathon de construire rapidement un nouveau scénario en données, sans toucher au moteur.

---

# 20. Corrections techniques prioritaires

## 20.1. Supprimer les sélections héritées

Le store possède encore :

* `selectedAssetId` ;
* `selectedJobId` ;
* `selectedEntity`.

Cela peut créer des incohérences : un job peut rester visuellement sélectionné dans la liste alors qu’une ligne est maintenant sélectionnée sur la carte.

Il faut conserver une seule sélection générique.

---

## 20.2. Persister l’état des lignes

`overloadDuration` est actuellement recalculé depuis le nombre total de ticks lorsque la ligne est surchargée, au lieu d’être un état propre à chaque ligne. Une ligne qui devient rouge tardivement peut donc sembler surchargée depuis longtemps.

Chaque ligne doit conserver :

* température ;
* durée de surcharge ;
* historique de charge ;
* état de protection ;
* délai de réparation ;
* nombre de coupures.

---

## 20.3. Remplacer les identifiants interprétés par des règles de données

Les règles du type :

```txt
si l’id contient paris
si l’id contient bordeaux
si l’id contient lyon
```

doivent disparaître.

Les effets doivent venir de la topologie et des nœuds affectés.

---

## 20.4. Réellement instancier les éléments répétés

`EnergyNodeInstances` ne fait pas d’instancing Three.js : il effectue simplement un `.map()` vers plusieurs composants `EnergyNode`.

Pour douze nœuds, cela reste acceptable. Pour une carte Europe ou cinquante installations, il faudra utiliser :

* `InstancedMesh` pour les éléments répétés ;
* géométries et matériaux partagés ;
* pooling des particules ;
* instancing des pylônes ;
* peu de lumières dynamiques.

Chaque nœud crée actuellement aussi sa propre `pointLight`, ce qui peut devenir coûteux.

---

## 20.5. Prévoir plusieurs niveaux de qualité

Le canvas utilise :

* DPR jusqu’à 1,9 ;
* antialiasing ;
* ombres ;
* plusieurs lumières ;
* bloom ;
* vignette ;
* nombreux objets animés.

Prévoir :

### High

* DPR 1,5 ;
* bloom ;
* ombres ;
* particules complètes ;
* météo.

### Standard

* DPR 1 ;
* bloom modéré ;
* pas d’ombres dynamiques ;
* moins de particules.

### Safe demo

* DPR 1 ;
* pas de postprocessing lourd ;
* particules réduites ;
* stabilité maximale.

Le mode safe doit être activable avant une démonstration.

---

## 20.6. Déplacer la simulation dans un Web Worker à terme

Pour 10 à 15 nœuds, le thread principal suffit.

Pour :

* 50 nœuds ;
* solveur de flux ;
* événements conditionnels ;
* recalculs de previews ;
* simulation accélérée ;

le calcul devrait être séparé de la boucle de rendu.

Le worker reçoit les commandes et renvoie un snapshot par tick. Three.js interpole visuellement entre les snapshots.

---

## 20.7. Ajouter tests et CI

Le `package.json` ne contient actuellement que les scripts dev, build, start et lint.

Ajouter :

* vérification TypeScript ;
* tests unitaires du solveur ;
* tests de commandes ;
* tests de scénarios ;
* tests de progression ;
* test end-to-end d’une mission ;
* simulation automatique de centaines de runs seedés.

Critères importants :

* chaque mission doit être gagnable ;
* aucune stratégie unique ne doit garantir systématiquement le score maximal ;
* les métriques ne doivent jamais devenir négatives ou `NaN` ;
* aucun job critique ne doit être impossible à terminer ;
* les flux doivent respecter les équilibres du modèle.

---

## 20.8. Nettoyer le repo

Les logs de développement ont été commités et montrent notamment :

* de nombreux avertissements `THREE.Clock` déprécié ;
* des erreurs internes Next.js liées au router.

Il faut :

* retirer `.next-dev.stderr.log` et `.next-dev.stdout.log` ;
* les ajouter au `.gitignore` ;
* reproduire et comprendre l’erreur router ;
* décider si l’avertissement Clock vient de la version Three/R3F ou du code ;
* mettre en place une CI réelle.

Le README est également obsolète : il décrit toujours une carte SVG et l’ancienne structure de composants.

Enfin, les polices sont chargées par un `@import` Google Fonts dans le CSS. Pour une démo de salon potentiellement soumise à une mauvaise connexion, mieux vaut utiliser `next/font` afin que les fichiers soient intégrés au build.

---

# 21. Ordre précis de développement recommandé

## Phase 1 — Rendre la carte vraie

Priorité absolue :

1. Ajouter nœuds et lignes au `GameState`.
2. Supprimer le snapshot visuel artificiel.
3. Calculer les métriques globales depuis les nœuds.
4. Calculer les flux depuis la topologie.
5. Persister la température et les surcharges.
6. Faire en sorte qu’une ligne rouge puisse réellement disjoncter.
7. Faire en sorte qu’une disjonction modifie les autres flux.

**Résultat attendu :** la carte n’illustre plus le jeu, elle est le jeu.

---

## Phase 2 — Rendre les actions réellement locales

1. Introduire les commandes ciblées.
2. Supprimer les actions globales implicites.
3. Ajouter validation et preview.
4. Ajouter curseurs de puissance/durée.
5. Attacher chaque job à un datacenter.
6. Autoriser la migration entre datacenters.
7. Afficher les lignes affectées avant confirmation.

**Résultat attendu :** cliquer un élément de la carte produit une décision cohérente sur cet élément.

---

## Phase 3 — Créer une boucle fun de trois minutes

1. Ralentir la mission.
2. Ajouter la pause tactique.
3. Introduire les points de commandement.
4. Limiter ATHENA.
5. Ajouter des coûts et cooldowns.
6. Ajouter un score cumulatif.
7. Créer trois solutions viables par crise.
8. Ajouter audio et feedback immédiat.

**Résultat attendu :** le joueur réfléchit, choisit, voit l’impact et veut rejouer.

---

## Phase 4 — Construire la campagne

1. Généraliser `MapDefinition`.
2. Généraliser `MissionDefinition`.
3. Créer un registre des cartes.
4. Créer une sauvegarde de progression.
5. Ajouter médailles et objectifs secondaires.
6. Produire trois cartes réellement différentes.
7. Introduire progressivement les outils.

**Résultat attendu :** le jeu n’est plus une seule démo, mais une expérience avec montée en compétence.

---

## Phase 5 — Ajouter le “next level” visuel

1. Animations liées aux vraies métriques.
2. Jour/nuit.
3. Météo régionale.
4. coupures visibles dans les villes ;
5. étincelles et chaleur sur les lignes ;
6. caméra cinématique ;
7. audio adaptatif ;
8. replay du moment critique à la fin ;
9. campagne affichée sur une carte 3D.

---

# 22. Définition d’une version véritablement “next level”

La prochaine version majeure devrait comporter au minimum :

* 3 cartes distinctes ;
* 5 missions ;
* 1 tutoriel réellement jouable ;
* 1 réseau dont les flux sont calculés ;
* 1 système de surcharge et de cascade ;
* 1 système de commandes ciblées ;
* 2 datacenters entre lesquels déplacer les jobs ;
* 8 actions avec coûts et cooldowns ;
* 3 niveaux de difficulté ;
* 3 médailles par mission ;
* progression persistante ;
* audio adaptatif ;
* météo et cycle jour/nuit ;
* débrief personnalisé ;
* mode challenge seedé ;
* mode performance pour la démo.

La consigne centrale pour la prochaine passe doit être :

> **Ne plus ajouter de décoration indépendante de l’état du jeu. Chaque ligne, animation, lumière, son et mouvement de caméra doit communiquer une information ou réagir à une décision.**

La seconde passe a construit la scène.
La troisième doit construire **le jeu qui vit réellement dans cette scène**.
