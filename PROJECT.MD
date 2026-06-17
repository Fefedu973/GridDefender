# Spécifications détaillées — **Grid Defender: AI Load Control**

## 0. Résumé du concept

**Grid Defender** est un jeu de stratégie / serious game de data visualisation dans lequel le joueur incarne un opérateur chargé de maintenir un réseau électrique stable pendant une journée critique. Le réseau doit alimenter des foyers, des hôpitaux, des industries, des bornes de recharge, un salon technologique en direct, et surtout des **datacenters IA** qui lancent des charges de calcul plus ou moins urgentes.

Le message central n’est pas : **“l’IA consomme trop, il faut l’arrêter.”**

Le message central est :

> **L’IA n’est pas le problème. Le vrai enjeu est de savoir quand, où et comment on l’intègre au réseau électrique. Grid Defender montre que l’IA peut être à la fois une charge énergétique à piloter et un outil pour défendre le réseau.**

Le joueur doit donc arbitrer entre plusieurs objectifs :

* éviter le blackout ;
* maintenir une électricité bas carbone ;
* garder un coût raisonnable ;
* assurer les usages critiques ;
* préserver la souveraineté numérique ;
* maintenir la productivité IA ;
* gérer les pics de consommation ;
* expliquer ses décisions au public.

Le projet est pensé pour un hackathon type **Defend Hack / VivaTech / Defend Intelligence**, avec une démo très visuelle, jouable en quelques minutes, et suffisamment profonde pour montrer une vraie architecture technique.

---

# 1. Positionnement du projet

## 1.1. Nom du jeu

Nom principal recommandé :

## **Grid Defender**

Sous-titre recommandé :

## **AI Load Control**

Nom complet :

> **Grid Defender: AI Load Control**

Autres noms possibles :

* **Grid Guardian AI**
* **AI Grid Commander**
* **Sovereign Grid**
* **WattShield AI**
* **Defend the Grid**
* **GreenOps AI**
* **PowerOps AI**

Le meilleur reste **Grid Defender**, parce qu’il est simple, clair, aligné avec “Defend Hack”, et immédiatement compréhensible.

---

## 1.2. Pitch court

> **Grid Defender est un serious game où le joueur doit défendre un réseau électrique bas carbone face aux pics de consommation, aux datacenters IA, aux événements météo et aux usages critiques. L’objectif n’est pas de freiner l’IA, mais de l’orchestrer intelligemment pour éviter les tensions réseau, réduire les coûts et préserver la souveraineté.**

---

## 1.3. Pitch long

> **Dans Grid Defender, vous incarnez l’opérateur d’un réseau électrique moderne. Une journée de forte tension commence : vague de froid, recharge massive de véhicules électriques, baisse du vent, datacenter IA qui lance des calculs lourds, salon VivaTech en direct, hôpital prioritaire, industrie stratégique. À chaque tour, vous devez arbitrer : produire plus, stocker, décaler certains usages, optimiser les jobs IA, utiliser des batteries, importer de l’énergie ou demander à l’IA de proposer une stratégie. Le jeu montre que l’enjeu énergétique de l’IA n’est pas uniquement son volume de consommation, mais sa flexibilité, son timing, son intégration au réseau et son utilité.**

---

## 1.4. Intention éditoriale

Le jeu doit éviter deux pièges :

Premier piège : faire un jeu culpabilisant où l’IA est présentée comme un problème écologique simple.

Deuxième piège : faire un dashboard énergétique froid, sans tension, sans narration, sans plaisir de jeu.

La bonne position :

> **L’IA devient une composante stratégique du système énergétique. Elle consomme, mais elle peut aussi prévoir, optimiser, arbitrer et défendre.**

Le jeu doit montrer que la question intelligente n’est pas seulement :

> “Combien consomme un prompt ?”

mais plutôt :

> “Est-ce que cette charge IA est urgente ? Peut-elle être décalée ? Peut-elle utiliser un modèle plus léger ? Peut-elle tourner quand le réseau est moins tendu ? Peut-elle aider à économiser davantage qu’elle ne consomme ?”

---

# 2. Objectifs du produit

## 2.1. Objectif principal

Créer une expérience interactive qui permet de comprendre en moins de 3 minutes les enjeux suivants :

* un réseau électrique doit être équilibré en permanence ;
* tous les usages ne se valent pas ;
* certaines consommations sont critiques, d’autres flexibles ;
* l’IA ajoute une nouvelle catégorie de charge numérique ;
* cette charge peut être pilotée intelligemment ;
* l’IA peut aussi servir d’assistant de pilotage énergétique.

---

## 2.2. Objectifs secondaires

Le jeu doit aussi permettre de :

* vulgariser les notions de puissance, énergie, pic de demande, stockage, intensité carbone et flexibilité ;
* faire une démonstration visuelle forte sur un stand ;
* montrer un cas d’usage positif de l’IA dans l’énergie ;
* intégrer un module inspiré de **PromptWatt** pour estimer la consommation de charges IA ;
* intégrer un module inspiré d’**Energy SOC** pour détecter les comportements anormaux ;
* permettre à une équipe hackathon de construire rapidement un MVP mais avec une architecture extensible.

---

## 2.3. Expérience attendue pour le joueur

Le joueur doit ressentir trois choses :

1. **La tension du temps réel**
   Le réseau bouge, les jauges montent ou descendent, des événements arrivent.

2. **La satisfaction de l’optimisation**
   Une bonne décision stabilise le réseau, baisse le coût, réduit les émissions ou améliore le score.

3. **La compréhension pédagogique**
   Après chaque décision importante, l’IA explique pourquoi c’était bon, risqué ou sous-optimal.

---

# 3. Public cible

## 3.1. Jury hackathon

Le jury doit voir rapidement :

* un concept clair ;
* une vraie utilisation de l’IA ;
* un lien évident avec l’énergie ;
* une démo visuelle ;
* une architecture crédible ;
* un potentiel produit.

La démo doit être compréhensible sans connaissance technique profonde.

---

## 3.2. Public VivaTech

Le public doit pouvoir jouer une partie courte en 2 à 4 minutes.

Il doit pouvoir comprendre :

* “je dois garder les jauges dans le vert” ;
* “si je lance trop de consommation au mauvais moment, le réseau souffre” ;
* “l’IA peut m’aider à prendre de meilleures décisions”.

---

## 3.3. Développeurs IA

Ils doivent reconnaître des situations réalistes :

* agent IA qui fait trop d’appels ;
* job non urgent qui peut être décalé ;
* modèle trop lourd pour une tâche simple ;
* batch, cache, réduction de modèle, file d’attente ;
* monitoring des coûts et de l’énergie.

---

## 3.4. Acteurs énergie / industrie

Ils doivent reconnaître :

* contraintes d’équilibre offre-demande ;
* production variable ;
* stockage ;
* effacement ;
* flexibilité ;
* arbitrages coût / stabilité / CO₂ ;
* priorisation des usages critiques.

---

# 4. Vision du jeu

## 4.1. Genre

Le jeu est un mélange de :

* serious game ;
* jeu de stratégie en temps réel simplifié ;
* dashboard de supervision ;
* simulateur énergétique ;
* outil de vulgarisation ;
* assistant IA interactif.

Il ne doit pas être un jeu de gestion complexe façon simulation industrielle complète. Il doit rester lisible, rapide, démontrable.

---

## 4.2. Format recommandé

Format principal :

> **Application web jouable dans un navigateur.**

Format cible pour le hackathon :

* écran ordinateur ;
* résolution idéale : 1440 × 900 ou 1920 × 1080 ;
* jouable à la souris ;
* possible sur tablette, mais pas prioritaire ;
* pas besoin de login pour le MVP ;
* mode démo réinitialisable en un clic.

---

## 4.3. Durée d’une partie

Trois formats de partie doivent être prévus :

### Mode démo rapide

Durée : 2 à 4 minutes.

But : montrer un événement fort, par exemple pic de consommation + datacenter IA + décision de décaler le calcul.

### Mode mission

Durée : 8 à 12 minutes.

But : jouer une journée complète compressée, par exemple de 8h à 22h.

### Mode sandbox

Durée libre.

But : tester des scénarios, modifier les paramètres, expérimenter.

Pour le hackathon, seul le mode démo rapide et une mission doivent être obligatoires.

---

# 5. Principe central de gameplay

## 5.1. Le joueur incarne qui ?

Le joueur incarne un ou une :

> **Grid Defense Operator**

Rôle fictif :

> Responsable de la supervision énergétique d’une zone stratégique comprenant une ville, un datacenter IA souverain, un salon technologique, un hôpital, une zone industrielle, des logements et des infrastructures de recharge électrique.

Le joueur n’est pas un politicien, ni un simple consommateur. C’est un opérateur stratégique.

---

## 5.2. Objectif de chaque partie

Le joueur doit terminer la mission avec un score élevé en maintenant plusieurs indicateurs.

Les indicateurs principaux :

1. **Stabilité réseau**
2. **CO₂**
3. **Coût**
4. **Souveraineté IA**
5. **Productivité IA**
6. **Satisfaction publique**
7. **Continuité des services critiques**

Le joueur ne peut pas maximiser tout en même temps. Il doit arbitrer.

Exemple :

* importer de l’énergie peut sauver la stabilité mais augmenter le coût ou le CO₂ ;
* décaler un job IA peut réduire la tension réseau mais diminuer la productivité immédiate ;
* réduire la recharge EV peut soulager le réseau mais frustrer le public ;
* lancer un modèle IA plus petit peut réduire la consommation mais perdre en qualité ;
* utiliser les batteries maintenant peut aider, mais laisser moins de marge pour la soirée.

---

## 5.3. Boucle de jeu

La boucle fondamentale est :

1. Le jeu avance dans le temps.
2. La consommation et la production évoluent.
3. Un événement arrive ou une tendance devient visible.
4. Le joueur analyse les jauges et la carte.
5. Le joueur choisit une ou plusieurs actions.
6. Le simulateur applique les conséquences.
7. L’assistant IA explique ou conseille.
8. Le score évolue.
9. La partie continue jusqu’à la fin de la journée ou jusqu’à un échec.

---

# 6. Histoire et univers

## 6.1. Cadre narratif

Le jeu se déroule dans un futur proche, très proche du réel.

Lieu :

> Une région française fictive appelée **Néo-Réseau Atlantique**, ou une version stylisée de la France.

Contexte :

> Une journée de forte attention médiatique démarre. Le salon technologique **VivaGrid Live** accueille des démonstrations IA, des conférences sur l’énergie, des startups et des décideurs publics. En parallèle, un datacenter IA souverain doit traiter des tâches critiques : recherche, cybersécurité, santé, modélisation industrielle, agents publics.

Problème :

> La journée cumule plusieurs contraintes : météo variable, pic de demande en soirée, recharge de véhicules, forte activité numérique, tension sur une ligne locale, événement inattendu dans un datacenter.

Mission :

> Assurer que l’IA reste disponible, que les services critiques restent alimentés, et que le réseau reste stable.

---

## 6.2. Ton narratif

Le ton doit être :

* sérieux mais accessible ;
* techno mais pas jargonneux ;
* énergique, visuel, “control room” ;
* aligné avec une esthétique Defend Intelligence : noir, vert, rouge, bleu électrique, interface de supervision.

Le jeu doit donner l’impression d’être dans un centre de commandement, pas dans une application administrative.

---

## 6.3. Personnages / voix

Il n’est pas nécessaire d’avoir des personnages animés, mais il est utile d’avoir des voix narratives.

### 1. L’assistant IA : **ATHENA Grid**

Rôle :

* conseille le joueur ;
* explique les conséquences ;
* vulgarise les concepts ;
* propose des optimisations.

Ton :

* clair ;
* synthétique ;
* jamais moralisateur ;
* orienté solution.

Exemple :

> “Le réseau est stable pour l’instant, mais la marge de réserve baisse. Le job IA de génération vidéo n’est pas critique : le décaler de 45 minutes réduirait la tension sans impacter les services essentiels.”

### 2. Le responsable réseau

Rôle :

* annonce les incidents ;
* donne les objectifs opérationnels.

Exemple :

> “La demande résidentielle grimpe plus vite que prévu. Il faut préserver les réserves avant 19h.”

### 3. Le responsable datacenter IA

Rôle :

* signale les besoins de calcul ;
* demande de ne pas couper les jobs critiques.

Exemple :

> “Le modèle de détection cyber doit rester prioritaire. En revanche, le batch de génération de contenu marketing peut attendre.”

### 4. Le public / médias

Rôle :

* reflète la satisfaction ;
* réagit aux décisions.

Exemple :

> “Les visiteurs du salon remarquent un ralentissement sur les démos IA. Satisfaction en baisse légère.”

---

# 7. Les ressources du jeu

## 7.1. Ressources de production

Le réseau dispose de plusieurs sources de production électrique. Chaque source a des caractéristiques différentes.

### Nucléaire

Rôle dans le jeu :

* production de base stable ;
* faible intensité carbone ;
* peu flexible à court terme ;
* rassurant pour la stabilité.

Caractéristiques :

* puissance élevée ;
* coût moyen stable ;
* émission faible ;
* variation lente ;
* indisponibilité rare mais impact fort.

Usage gameplay :

* représente le socle bas carbone ;
* ne peut pas être ajusté instantanément ;
* apprend au joueur que toute production n’est pas pilotable de la même manière.

---

### Hydraulique

Rôle :

* production flexible ;
* permet de répondre rapidement aux pics ;
* ressource limitée sur la journée.

Caractéristiques :

* démarrage rapide ;
* bas carbone ;
* capacité limitée ;
* utile pour sauver le réseau en situation critique.

Usage gameplay :

* bouton de secours élégant ;
* si utilisé trop tôt, il manque plus tard.

---

### Solaire

Rôle :

* production variable selon l’heure et la météo ;
* forte en journée ;
* nulle le soir.

Caractéristiques :

* bas carbone ;
* coût marginal faible ;
* dépendant de l’ensoleillement ;
* prévisible mais variable.

Usage gameplay :

* incite à déplacer les charges flexibles en milieu de journée ;
* rend le timing des jobs IA important.

---

### Éolien

Rôle :

* production variable ;
* parfois forte, parfois faible ;
* incertitude plus élevée.

Caractéristiques :

* bas carbone ;
* dépend de la météo ;
* peut provoquer des surplus ou des manques.

Usage gameplay :

* introduit l’incertitude ;
* oblige à garder une marge de réserve.

---

### Batteries

Rôle :

* stockage temporaire ;
* absorbe les surplus ;
* couvre les pics.

Caractéristiques :

* capacité en MWh ;
* puissance maximale de charge/décharge ;
* rendement imparfait ;
* usure possible en version avancée.

Usage gameplay :

* choix tactique important ;
* charge à midi, décharge à 19h ;
* très visuel.

---

### Import d’électricité

Rôle :

* solution de secours ;
* stabilise rapidement ;
* peut augmenter coût et CO₂.

Caractéristiques :

* disponible dans certaines limites ;
* prix variable ;
* intensité carbone variable selon le scénario ;
* dépend de la souveraineté énergétique.

Usage gameplay :

* dernier recours ;
* évite le blackout mais pénalise le score.

---

### Centrale thermique de secours

Rôle :

* production pilotable mais carbonée ;
* utilisée si le réseau est en danger.

Caractéristiques :

* démarrage rapide ou moyen ;
* coût élevé ;
* CO₂ élevé ;
* impact négatif sur score environnemental.

Usage gameplay :

* bouton rouge ;
* utile pour montrer les arbitrages.

---

## 7.2. Ressources de consommation

### Résidentiel

Rôle :

* consommation de base des foyers ;
* augmente matin et soir ;
* sensible à la météo.

Caractéristiques :

* peu flexible ;
* pic à 7h-9h et 18h-21h ;
* chauffage/climatisation selon température.

Actions possibles :

* demander un léger effacement ;
* envoyer un signal de sobriété ;
* moduler certains usages non critiques.

Conséquence :

* si trop d’effacement, satisfaction publique en baisse.

---

### Industrie

Rôle :

* gros consommateur ;
* partiellement flexible ;
* important pour l’économie.

Caractéristiques :

* consommation stable ou par plages ;
* certaines machines peuvent être décalées ;
* pénalité économique si coupure.

Actions possibles :

* demander report de production ;
* prioriser industrie stratégique ;
* réduire temporairement.

---

### Hôpital / services critiques

Rôle :

* consommation prioritaire ;
* ne doit presque jamais être réduite.

Caractéristiques :

* charge stable ;
* priorité maximale ;
* coupure très pénalisante.

Actions possibles :

* aucune coupure normale ;
* mode secours uniquement en cas extrême ;
* batterie dédiée éventuelle.

Conséquence :

* toute dégradation fait chuter fortement le score.

---

### Véhicules électriques

Rôle :

* charge flexible mais massive ;
* pic possible en soirée.

Caractéristiques :

* demande surtout après 18h ;
* peut être décalée ;
* satisfaction dépend du taux de recharge final.

Actions possibles :

* recharge intelligente ;
* report partiel ;
* limitation de puissance ;
* priorité aux véhicules critiques.

---

### Salon technologique / événement live

Rôle :

* consommation événementielle ;
* écran, streaming, stands, démos IA ;
* visible par le public.

Caractéristiques :

* consommation modérée mais symbolique ;
* besoin de stabilité ;
* impact sur réputation.

Actions possibles :

* réduire luminosité ;
* limiter certaines démos ;
* décaler calculs non essentiels ;
* prioriser scène principale.

---

### Datacenter IA

Rôle :

* cœur du sujet ;
* consomme de l’énergie ;
* peut être flexible ;
* produit de la valeur stratégique.

Caractéristiques :

* charges IA multiples ;
* jobs urgents et non urgents ;
* différentes intensités de calcul ;
* différentes exigences de souveraineté ;
* capacité de déplacer, retarder, optimiser.

Actions possibles :

* décaler un job ;
* réduire le modèle ;
* activer cache ;
* regrouper les requêtes ;
* limiter agents autonomes ;
* mettre en file d’attente ;
* prioriser les tâches critiques ;
* choisir local souverain ou cloud externe ;
* déplacer le calcul vers une zone moins tendue.

---

# 8. Les charges IA dans le jeu

## 8.1. Pourquoi c’est central

Les charges IA sont le pont entre le thème énergie et le thème intelligence artificielle.

Le datacenter IA ne doit pas être un simple bloc qui consomme X MW. Il doit être décomposé en **jobs IA** compréhensibles.

---

## 8.2. Types de jobs IA

### Job texte léger

Exemple narratif :

* assistant public ;
* chatbot de support ;
* résumé de documents ;
* aide à la recherche.

Caractéristiques :

* consommation faible ;
* latence importante mais pas critique ;
* fréquence élevée ;
* bonne cible pour cache.

Actions utiles :

* cache ;
* modèle plus petit ;
* batching léger ;
* priorité basse ou moyenne.

---

### Job code / agent développeur

Exemple :

* génération de code ;
* agent qui teste plusieurs solutions ;
* outil d’aide au hackathon.

Caractéristiques :

* consommation moyenne ;
* peut faire beaucoup d’appels ;
* risque de boucle ;
* haute valeur pour productivité.

Actions utiles :

* limiter le nombre d’itérations ;
* activer timeout ;
* vérifier redondance ;
* modèle moyen pour tâches simples ;
* modèle fort pour tâches complexes.

---

### Job image / vidéo

Exemple :

* génération visuelle pour un stand ;
* contenus marketing ;
* démo créative.

Caractéristiques :

* consommation plus visible dans le jeu ;
* souvent non critique ;
* peut être décalé.

Actions utiles :

* reporter ;
* réduire résolution ;
* limiter batch ;
* faire tourner pendant période solaire.

---

### Job recherche / simulation scientifique

Exemple :

* simulation climatique ;
* recherche médicale ;
* optimisation industrielle ;
* calcul scientifique open source.

Caractéristiques :

* forte consommation ;
* forte valeur ;
* souvent flexible sur l’heure ;
* deadline longue.

Actions utiles :

* planification intelligente ;
* découpage en batch ;
* exécution quand le réseau est favorable ;
* réservation de capacité.

---

### Job cyberdéfense critique

Exemple :

* détection d’attaque ;
* analyse d’incident ;
* surveillance d’infrastructure ;
* réponse d’urgence.

Caractéristiques :

* consommation parfois élevée ;
* priorité maximale ;
* faible flexibilité ;
* très forte valeur souveraine.

Actions utiles :

* ne pas couper ;
* préserver ressources ;
* réduire autres usages autour ;
* activer priorité souveraine.

---

### Agent IA autonome

Exemple :

* agent qui surveille des logs ;
* agent qui planifie des tâches ;
* agent qui tente d’optimiser le réseau ;
* agent mal configuré qui boucle.

Caractéristiques :

* consommation imprévisible ;
* peut devenir très inefficace ;
* peut générer trop d’appels ;
* parfait pour un événement “anomalie”.

Actions utiles :

* limiter itérations ;
* audit ;
* arrêt contrôlé ;
* cache ;
* validation humaine ;
* détection d’anomalie.

---

## 8.3. Paramètres d’un job IA

Chaque job IA doit posséder les paramètres suivants.

### Identité

* nom affiché ;
* icône ;
* catégorie ;
* description courte ;
* propriétaire fictif : hôpital, salon, datacenter, startup, défense, recherche.

### Énergie

* puissance instantanée estimée ;
* énergie totale si terminé ;
* variation selon modèle choisi ;
* variation selon optimisation activée.

### Temps

* heure de début possible ;
* durée estimée ;
* deadline ;
* flexibilité ;
* pénalité si retard.

### Criticité

* critique ;
* important ;
* confortable ;
* non essentiel.

### Valeur

* contribution à la productivité IA ;
* contribution à la souveraineté ;
* contribution à la satisfaction ;
* contribution à la sécurité.

### Optimisabilité

* compatible cache ;
* compatible batching ;
* compatible modèle plus petit ;
* compatible décalage ;
* compatible réduction qualité ;
* compatible exécution externe.

### Risque

* risque de boucle agent ;
* risque de surcharge ;
* risque de perte de qualité ;
* risque de non-souveraineté si externalisé.

---

# 9. Actions disponibles pour le joueur

## 9.1. Actions sur le datacenter IA

### Décaler un job IA

Effet :

* réduit la charge actuelle ;
* reporte la consommation plus tard ;
* peut améliorer CO₂ et stabilité ;
* peut réduire productivité si deadline proche.

Utilisation idéale :

* job non urgent ;
* période de pic ;
* production solaire attendue plus tard ;
* batterie faible.

---

### Réduire le modèle

Effet :

* baisse la consommation ;
* baisse parfois la qualité ;
* améliore la rapidité ;
* réduit coût.

Exemple :

* passer de “modèle expert” à “modèle standard” ;
* passer de “haute résolution” à “moyenne résolution”.

Conséquence gameplay :

* productivité légèrement réduite ;
* stabilité améliorée ;
* score sobriété amélioré.

---

### Activer le cache

Effet :

* réduit les appels redondants ;
* très efficace sur assistants répétitifs ;
* peu d’impact sur qualité ;
* nécessite parfois une courte mise en place.

Conséquence gameplay :

* baisse progressive de consommation ;
* amélioration du score technique ;
* bon message pédagogique.

---

### Activer un timeout agent

Effet :

* empêche un agent de tourner en boucle ;
* réduit les pics imprévus ;
* peut interrompre une recherche utile.

Conséquence gameplay :

* protège le réseau ;
* améliore sécurité ;
* peut réduire productivité si trop strict.

---

### Batcher les requêtes

Effet :

* regroupe plusieurs tâches ;
* améliore efficacité ;
* augmente légèrement latence ;
* réduit coût et énergie.

Utilisation idéale :

* tâches non urgentes ;
* analyse documentaire ;
* génération de rapports ;
* jobs nocturnes.

---

### Prioriser IA critique

Effet :

* garantit les jobs cyber/santé/défense ;
* réduit les ressources pour jobs non critiques ;
* améliore souveraineté et sécurité.

Conséquence gameplay :

* score sécurité augmente ;
* satisfaction salon peut baisser si certaines démos ralentissent.

---

### Externaliser vers cloud étranger

Effet :

* soulage le réseau local ;
* peut augmenter ou réduire CO₂ selon scénario ;
* baisse souveraineté ;
* peut augmenter coût.

Utilisation idéale :

* solution d’urgence ;
* démonstration d’arbitrage souveraineté / stabilité.

Conséquence gameplay :

* stabilité locale augmente ;
* souveraineté baisse ;
* coût variable.

---

## 9.2. Actions sur le réseau

### Décharger les batteries

Effet :

* augmente production disponible immédiatement ;
* réduit déficit ;
* diminue niveau de batterie.

Risques :

* manquer d’énergie plus tard ;
* effet limité par puissance maximale.

---

### Charger les batteries

Effet :

* absorbe surplus ;
* prépare le pic ;
* consomme une partie de la production disponible.

Utilisation idéale :

* forte production solaire ;
* faible demande ;
* prix bas.

---

### Activer hydraulique flexible

Effet :

* réponse rapide ;
* bas carbone ;
* capacité limitée.

Utilisation idéale :

* pic court ;
* besoin urgent ;
* alternative à thermique.

---

### Importer de l’électricité

Effet :

* stabilise rapidement ;
* coût et CO₂ selon contexte ;
* baisse souveraineté énergétique.

Utilisation idéale :

* éviter blackout ;
* urgence.

---

### Lancer production thermique de secours

Effet :

* stabilise fortement ;
* augmente CO₂ ;
* augmente coût.

Utilisation idéale :

* dernier recours.

---

### Effacement résidentiel léger

Effet :

* baisse demande ;
* réduit satisfaction publique ;
* meilleur si bien expliqué.

Exemple :

* “reporter certains usages non critiques de 30 minutes”.

---

### Effacement industriel

Effet :

* baisse demande fortement ;
* coûte économiquement ;
* peut affecter production stratégique.

---

### Recharge EV intelligente

Effet :

* décale une partie de la charge ;
* baisse pic du soir ;
* satisfaction EV dépend du niveau final atteint.

---

# 10. Indicateurs et scoring

## 10.1. Indicateurs principaux affichés

### Stabilité réseau

C’est l’indicateur le plus important.

Il représente :

* équilibre offre-demande ;
* marge de réserve ;
* congestion ;
* fréquence abstraite.

Affichage :

* jauge de 0 à 100 ;
* vert au-dessus de 75 ;
* orange entre 45 et 75 ;
* rouge sous 45 ;
* blackout si chute prolongée sous un seuil critique.

---

### CO₂ / intensité carbone

Représente l’impact carbone du mix électrique utilisé.

Affichage :

* grammes CO₂/kWh simulés ;
* ou score environnemental de 0 à 100 ;
* visualisation du mix de production.

Important :

Le jeu ne doit pas faire croire que toute consommation IA est fortement carbonée. Il doit montrer que l’impact dépend du mix, du moment et des choix.

---

### Coût

Représente :

* coût de production ;
* coût d’import ;
* coût d’activation de ressources flexibles ;
* coût économique des coupures.

Affichage :

* score ;
* ou montant fictif en milliers d’euros.

---

### Souveraineté

Représente :

* part des calculs IA traités localement ;
* dépendance à un cloud externe ;
* capacité à maintenir les services stratégiques ;
* autonomie énergétique.

Affichage :

* jauge de 0 à 100.

---

### Productivité IA

Représente :

* jobs IA terminés ;
* qualité des résultats ;
* respect des deadlines ;
* disponibilité des services IA.

Affichage :

* jauge ou score ;
* détail par type de job.

---

### Satisfaction publique

Représente :

* confort résidentiel ;
* qualité de l’événement ;
* disponibilité des bornes EV ;
* réactions du public.

Affichage :

* jauge ;
* feed de messages courts.

---

### Services critiques

Représente :

* hôpital ;
* cyberdéfense ;
* sécurité publique ;
* infrastructure essentielle.

Affichage :

* indicateur binaire ou jauge très sensible.

Le joueur ne doit presque jamais sacrifier ces services.

---

## 10.2. Score final

Le score final doit être sur 1000 points.

Répartition recommandée :

* stabilité : 300 points ;
* services critiques : 200 points ;
* CO₂ : 150 points ;
* coût : 100 points ;
* productivité IA : 100 points ;
* souveraineté : 100 points ;
* satisfaction publique : 50 points.

Cette pondération peut être modifiée selon le message voulu, mais la stabilité et les services critiques doivent rester prioritaires.

---

## 10.3. Badges de fin de partie

Badges possibles :

* **Grid Defender** : aucune panne, stabilité élevée.
* **AI Optimizer** : forte productivité IA avec faible consommation.
* **Low Carbon Operator** : très bon score CO₂.
* **Sovereign Shield** : très peu d’externalisation.
* **Peak Master** : pic du soir parfaitement géré.
* **Battery Strategist** : usage optimal du stockage.
* **Public Hero** : satisfaction élevée.
* **Crisis Commander** : incident critique résolu sans blackout.
* **Overkill AI** : trop de jobs IA lourds pour peu de valeur.
* **Carbon Panic Button** : trop de thermique utilisé.
* **Cloud Dependency** : souveraineté trop basse.

---

# 11. Progression du jeu

## 11.1. Structure globale

Le jeu doit contenir plusieurs missions. Pour un MVP, une seule mission complète suffit. Pour une version plus ambitieuse, prévoir 5 missions.

---

## 11.2. Mission 0 — Tutoriel : “Bienvenue au centre de contrôle”

Durée : 2 minutes.

Objectif :

* apprendre les jauges ;
* comprendre production / consommation ;
* faire une première action simple.

Situation :

* réseau stable ;
* faible demande ;
* production suffisante ;
* un petit job IA non critique apparaît.

Événement :

> “Un batch de génération d’images est prévu dans 15 minutes. Le réseau sera plus favorable à midi.”

Action attendue :

* décaler le job ;
* ou le lancer maintenant pour voir la différence.

Leçon :

* toutes les charges ne sont pas urgentes ;
* le timing compte.

---

## 11.3. Mission 1 — “Le pic de 19h”

Durée : 5 minutes.

Objectif :

* survivre au pic du soir.

Situation :

* recharge EV augmente ;
* résidentiel augmente ;
* solaire baisse ;
* datacenter veut lancer un job IA moyen.

Événement central :

> “18h45 : recharge massive de véhicules électriques + baisse solaire + demande résidentielle.”

Actions possibles :

* recharge EV intelligente ;
* décharger batteries ;
* décaler job IA ;
* hydraulique ;
* effacement léger.

Leçon :

* le problème n’est pas seulement l’énergie totale, mais la puissance appelée au mauvais moment.

---

## 11.4. Mission 2 — “Datacenter sous pression”

Durée : 7 minutes.

Objectif :

* maintenir productivité IA sans fragiliser le réseau.

Situation :

* plusieurs jobs IA arrivent :

  * cyberdéfense critique ;
  * génération vidéo non urgente ;
  * agent développeur ;
  * chatbot public.

Événement central :

> “Un agent IA mal configuré multiplie les appels et crée une charge anormale.”

Actions possibles :

* activer Energy SOC ;
* imposer timeout ;
* cache ;
* priorisation IA critique ;
* report des jobs non essentiels.

Leçon :

* le monitoring et l’optimisation logicielle peuvent économiser de l’énergie sans réduire l’utilité.

---

## 11.5. Mission 3 — “Météo instable”

Durée : 8 minutes.

Objectif :

* gérer l’incertitude renouvelable.

Situation :

* vent variable ;
* soleil intermittent ;
* demande industrielle fixe ;
* jobs IA flexibles.

Événement central :

> “La production éolienne chute plus tôt que prévu.”

Actions possibles :

* garder réserve ;
* charger batterie avant ;
* reporter certains calculs ;
* utiliser hydraulique ;
* importer si nécessaire.

Leçon :

* une bonne stratégie doit anticiper, pas seulement réagir.

---

## 11.6. Mission 4 — “Souveraineté ou secours externe”

Durée : 8 minutes.

Objectif :

* arbitrer entre souveraineté et stabilité.

Situation :

* datacenter local saturé ;
* cloud externe disponible ;
* réseau local tendu ;
* job IA public stratégique.

Événement central :

> “Le service IA public doit rester disponible pendant un pic réseau.”

Actions possibles :

* externaliser ;
* dégrader modèle ;
* prioriser local ;
* reporter ;
* augmenter production.

Leçon :

* l’énergie, l’IA et la souveraineté créent des arbitrages complexes.

---

## 11.7. Mission finale — “Defend Intelligence Live”

Durée : 10 à 12 minutes.

Objectif :

* gérer une journée complète de salon en direct.

Situation :

* événement live ;
* hôpital prioritaire ;
* datacenter IA ;
* recharge EV ;
* industrie ;
* météo variable ;
* incident agent ;
* pic du soir.

Déroulé :

* matin : préparation, batteries à charger ;
* midi : opportunité solaire ;
* après-midi : conférence IA, jobs de démonstration ;
* 18h : montée résidentielle ;
* 19h : crise ;
* fin : scoring et débrief.

Leçon finale :

> **L’IA peut être intégrée au réseau si elle est observée, priorisée, optimisée et planifiée.**

---

# 12. Interface utilisateur détaillée

## 12.1. Vue principale

L’écran principal doit être divisé en 5 zones.

### Zone 1 — Header supérieur

Contenu :

* nom du jeu ;
* mission actuelle ;
* heure simulée ;
* vitesse du temps ;
* bouton pause ;
* bouton recommencer ;
* score courant.

Objectif :

* donner immédiatement le contexte.

---

### Zone 2 — Carte centrale

C’est la zone la plus visuelle.

Elle affiche :

* ville ;
* datacenter IA ;
* hôpital ;
* industrie ;
* quartier résidentiel ;
* bornes EV ;
* batteries ;
* productions ;
* lignes électriques ;
* flux d’énergie animés.

Chaque élément doit avoir :

* couleur d’état ;
* icône ;
* niveau de charge ;
* alerte éventuelle ;
* clic pour ouvrir un panneau détail.

Couleurs recommandées :

* vert : stable ;
* orange : attention ;
* rouge : critique ;
* bleu : IA / numérique ;
* violet : événement spécial ;
* blanc : neutre.

---

### Zone 3 — Dashboard droit

Affiche les indicateurs :

* stabilité ;
* CO₂ ;
* coût ;
* souveraineté ;
* productivité IA ;
* satisfaction ;
* services critiques.

Chaque jauge doit être cliquable pour expliquer ce qui l’influence.

Exemple :

En cliquant sur CO₂ :

* mix actuel ;
* source principale d’émission ;
* impact de l’import ;
* impact du thermique.

---

### Zone 4 — Timeline inférieure

Affiche :

* événements passés ;
* événements prévus ;
* jobs IA planifiés ;
* pic attendu ;
* météo prévue ;
* niveau batterie futur estimé.

La timeline est très importante pour montrer que le jeu n’est pas seulement réactif. Le joueur doit anticiper.

---

### Zone 5 — Panneau assistant IA

Affiche :

* conseils ;
* explications ;
* alertes ;
* débriefs ;
* boutons de recommandations rapides.

L’assistant ne doit pas simplement être un chatbot libre. Il doit être lié à l’état du jeu.

Il doit pouvoir dire :

* “risque détecté” ;
* “meilleure action probable” ;
* “pourquoi cette action marche” ;
* “ce que tu aurais pu faire”.

---

## 12.2. Panneau d’un actif énergétique

Quand le joueur clique sur un élément de la carte, un panneau latéral ou modal s’ouvre.

### Exemple : Datacenter IA

Informations affichées :

* charge actuelle ;
* consommation actuelle ;
* jobs en cours ;
* jobs en attente ;
* deadline des jobs ;
* criticité ;
* options d’optimisation ;
* impact estimé de chaque action.

Actions :

* prioriser ;
* reporter ;
* réduire modèle ;
* cache ;
* timeout ;
* externaliser ;
* batcher.

---

### Exemple : Batterie

Informations affichées :

* niveau actuel ;
* capacité maximale ;
* puissance maximale de charge ;
* puissance maximale de décharge ;
* rendement ;
* prévision de besoin.

Actions :

* charger ;
* décharger ;
* réserver pour pic ;
* mode automatique.

---

### Exemple : Véhicules électriques

Informations affichées :

* nombre de véhicules branchés ;
* demande totale ;
* flexibilité ;
* satisfaction estimée ;
* niveau de charge cible.

Actions :

* recharge normale ;
* recharge intelligente ;
* réduction temporaire ;
* priorité véhicules essentiels.

---

## 12.3. Système d’alertes

Les alertes doivent être courtes, visibles, et actionnables.

Types d’alertes :

* déficit production ;
* surplus ;
* batterie faible ;
* pic prévu ;
* job IA urgent ;
* agent IA anormal ;
* import coûteux ;
* CO₂ en hausse ;
* souveraineté en baisse ;
* service critique menacé.

Chaque alerte doit proposer au moins une action possible.

Exemple :

> **Alerte : surcharge IA détectée.**
> L’agent “Code Runner” a généré 42 appels en 5 minutes.
> Actions : activer timeout, activer cache, réduire modèle, mettre en pause.

---

# 13. Architecture technique générale

## 13.1. Type d’application

Architecture recommandée :

> **Application web front-end avec moteur de simulation local, backend léger pour IA et leaderboard.**

Pour un hackathon, le moteur de jeu doit pouvoir fonctionner sans backend lourd. Le backend sert surtout à :

* appeler un modèle IA ;
* sauvegarder les scores ;
* gérer éventuellement un leaderboard ;
* fournir des scénarios ;
* recevoir des métriques anonymes.

---

## 13.2. Stack recommandée

### Front-end

* React ou Next.js ;
* TypeScript ;
* bibliothèque de graphiques : Recharts, ECharts ou Visx ;
* state management : Zustand, Redux Toolkit ou équivalent ;
* animations : Framer Motion ou animations CSS simples ;
* composants UI : Tailwind, shadcn/ui, ou design maison.

Recommandation hackathon :

> Next.js + TypeScript + Tailwind + Zustand + Recharts.

---

### Simulation

Deux options possibles.

Option A recommandée :

> Moteur de simulation en TypeScript côté client.

Avantages :

* rapide ;
* pas besoin de serveur ;
* très réactif ;
* facile à déployer ;
* parfait pour une démo.

Option B :

> Moteur de simulation Python côté backend.

Avantages :

* plus naturel pour modèles de données / IA ;
* plus facile pour calculs avancés.

Inconvénients :

* temps réel moins simple ;
* plus de plomberie API.

Pour le hackathon, privilégier l’option A.

---

### Backend

Backend léger :

* Next.js API routes ;
* ou serveur Node ;
* ou FastAPI Python.

Fonctions :

* génération de conseils IA ;
* débrief ;
* sauvegarde leaderboard ;
* chargement de scénarios ;
* éventuelle récupération de données externes.

Pour un MVP, il est possible de ne pas avoir de backend dédié et d’utiliser uniquement des routes serverless.

---

### Base de données

Pour le MVP :

* pas obligatoire ;
* stockage local navigateur possible ;
* fichier de scénarios statique ;
* leaderboard en mémoire ou stockage simple.

Pour version avancée :

* Supabase ;
* Firebase ;
* PostgreSQL ;
* SQLite côté serveur.

Données à stocker :

* scores ;
* runs ;
* actions du joueur ;
* paramètres de scénario ;
* profils de difficulté ;
* éventuellement logs anonymes.

---

### IA

Le jeu peut utiliser l’IA à trois niveaux.

Niveau 1 — MVP robuste :

* l’assistant IA est semi-scripté ;
* recommandations basées sur règles ;
* textes générés à partir de templates.

Niveau 2 — Démo enrichie :

* LLM appelé pour reformuler les recommandations ;
* le moteur de simulation calcule les faits ;
* le LLM explique sans inventer.

Niveau 3 — Version avancée :

* LLM analyse l’état complet ;
* génère des stratégies ;
* compare plusieurs actions ;
* produit un débrief personnalisé.

Pour le hackathon, le meilleur compromis :

> Règles déterministes pour les décisions + LLM pour l’explication en langage naturel.

Cela évite que l’IA donne de mauvais conseils ou invente un état du jeu.

---

# 14. Architecture logique

## 14.1. Couches de l’application

L’application doit être pensée en couches séparées.

### Couche 1 — Interface

Responsabilités :

* afficher la carte ;
* afficher les jauges ;
* afficher les cartes d’action ;
* gérer les clics ;
* afficher les animations ;
* afficher les messages IA.

Ne doit pas contenir :

* logique profonde de simulation ;
* calcul du score ;
* règles énergétiques ;
* génération de scénarios.

---

### Couche 2 — État du jeu

Responsabilités :

* stocker l’état courant ;
* appliquer les actions ;
* conserver l’historique ;
* synchroniser l’interface ;
* gérer pause/reprise/vitesse.

Ne doit pas contenir :

* calculs énergétiques détaillés ;
* logique d’IA ;
* composants visuels.

---

### Couche 3 — Moteur de simulation

Responsabilités :

* faire avancer le temps ;
* calculer production ;
* calculer consommation ;
* calculer équilibre réseau ;
* mettre à jour jauges ;
* déclencher conséquences ;
* calculer score.

C’est le cœur du jeu.

---

### Couche 4 — Moteur de scénarios

Responsabilités :

* charger une mission ;
* définir événements prévus ;
* définir objectifs ;
* définir paramètres initiaux ;
* contrôler la progression narrative ;
* déclencher événements conditionnels.

---

### Couche 5 — Moteur d’actions

Responsabilités :

* définir les actions possibles ;
* vérifier si une action est disponible ;
* calculer son coût ;
* appliquer ses effets ;
* générer un feedback immédiat.

---

### Couche 6 — Moteur IA / assistant

Responsabilités :

* détecter les situations intéressantes ;
* choisir une recommandation ;
* expliquer ;
* générer un débrief ;
* éventuellement dialoguer avec le joueur.

---

### Couche 7 — Persistance

Responsabilités :

* sauvegarder run ;
* sauvegarder score ;
* charger progression ;
* exporter logs ;
* gérer leaderboard.

---

# 15. Modèle de données détaillé

## 15.1. GameState

C’est l’objet central du jeu.

Il doit contenir :

* identifiant de la partie ;
* identifiant du scénario ;
* heure simulée actuelle ;
* vitesse de simulation ;
* statut : non démarré, en cours, pause, victoire, échec ;
* liste des actifs de production ;
* liste des actifs de consommation ;
* liste des jobs IA ;
* état météo ;
* état réseau ;
* métriques courantes ;
* score courant ;
* événements actifs ;
* événements passés ;
* actions disponibles ;
* historique des actions joueur ;
* messages assistant ;
* paramètres de difficulté ;
* flags narratifs.

Il doit être possible de recréer une partie à partir de cet état et de l’historique.

---

## 15.2. Scenario

Un scénario décrit une mission.

Champs nécessaires :

* identifiant ;
* nom ;
* description courte ;
* description longue ;
* durée simulée ;
* heure de début ;
* heure de fin ;
* difficulté ;
* objectifs principaux ;
* objectifs secondaires ;
* actifs initiaux ;
* jobs IA initiaux ;
* météo initiale ;
* événements programmés ;
* événements conditionnels ;
* seuils de victoire ;
* seuils d’échec ;
* messages de tutoriel ;
* textes de fin selon score.

---

## 15.3. EnergyAsset

Représente une source de production ou stockage.

Champs nécessaires :

* identifiant ;
* nom ;
* type : nucléaire, solaire, éolien, hydraulique, batterie, import, thermique ;
* zone géographique ;
* puissance maximale ;
* puissance minimale ;
* puissance actuelle ;
* énergie disponible si ressource limitée ;
* coût par MWh ;
* intensité carbone ;
* flexibilité ;
* temps de réaction ;
* disponibilité ;
* état : normal, limité, indisponible, critique ;
* actions supportées ;
* description pédagogique.

---

## 15.4. LoadAsset

Représente un consommateur d’électricité.

Champs nécessaires :

* identifiant ;
* nom ;
* type : résidentiel, industrie, hôpital, EV, salon, datacenter ;
* demande de base ;
* demande actuelle ;
* demande prévue ;
* flexibilité ;
* criticité ;
* satisfaction associée ;
* pénalité en cas de réduction ;
* zone ;
* actions supportées ;
* description pédagogique.

---

## 15.5. AIJob

Représente une tâche IA.

Champs nécessaires :

* identifiant ;
* nom ;
* catégorie : texte, image, vidéo, agent, recherche, cyber, code ;
* propriétaire ;
* criticité ;
* statut : en attente, en cours, terminé, reporté, interrompu, échoué ;
* heure de création ;
* heure de début prévue ;
* deadline ;
* durée estimée ;
* progression ;
* puissance demandée ;
* énergie totale estimée ;
* modèle utilisé ;
* qualité attendue ;
* flexibilité ;
* valeur stratégique ;
* valeur de productivité ;
* impact souveraineté ;
* optimisations disponibles ;
* optimisations déjà appliquées ;
* risque de boucle ;
* nombre d’appels simulés ;
* redondance estimée ;
* explication pédagogique.

---

## 15.6. PlayerAction

Représente une décision du joueur.

Champs nécessaires :

* identifiant ;
* nom ;
* catégorie : réseau, IA, production, consommation, stockage, urgence ;
* cible ;
* coût ;
* durée d’effet ;
* délai d’activation ;
* conditions de disponibilité ;
* effets sur production ;
* effets sur consommation ;
* effets sur métriques ;
* risques ;
* texte de confirmation ;
* texte de feedback ;
* niveau de gravité ;
* possibilité d’annuler ou non.

---

## 15.7. GridMetrics

Représente les métriques courantes.

Champs nécessaires :

* production totale ;
* consommation totale ;
* solde production-consommation ;
* marge de réserve ;
* stabilité ;
* fréquence abstraite ;
* CO₂ instantané ;
* coût instantané ;
* coût cumulé ;
* score souveraineté ;
* score productivité IA ;
* satisfaction publique ;
* services critiques ;
* niveau de batterie total ;
* puissance IA actuelle ;
* part flexible de la demande ;
* nombre d’alertes.

---

## 15.8. GameEvent

Représente un événement.

Champs nécessaires :

* identifiant ;
* nom ;
* catégorie : météo, demande, IA, réseau, cyber, public, politique ;
* heure prévue ou condition de déclenchement ;
* durée ;
* gravité ;
* description ;
* effets ;
* actions recommandées ;
* message d’apparition ;
* message si bien géré ;
* message si mal géré ;
* priorité d’affichage.

---

## 15.9. AssistantMessage

Représente un message de l’assistant IA.

Champs nécessaires :

* identifiant ;
* heure ;
* type : conseil, alerte, explication, débrief, tutoriel ;
* titre ;
* contenu court ;
* contenu détaillé ;
* action liée ;
* métrique liée ;
* niveau d’urgence ;
* source : règles, LLM, tutoriel, scénario ;
* confiance ;
* bouton d’action éventuel.

---

# 16. Moteur de simulation détaillé

## 16.1. Granularité temporelle

Pour le MVP, le jeu doit fonctionner par ticks.

Recommandation :

* 1 tick = 5 minutes simulées ;
* en mode démo, 1 tick toutes les 1 à 2 secondes réelles ;
* en mode pause, aucun tick ;
* en mode accéléré, ticks plus rapides.

Une mission de 12 heures simulées représente 144 ticks de 5 minutes.

Pour une démo de 4 minutes, on peut accélérer fortement ou ne simuler qu’une fenêtre de crise.

---

## 16.2. Étapes d’un tick

À chaque tick, le moteur doit effectuer les étapes suivantes dans cet ordre :

1. Avancer l’heure simulée.
2. Mettre à jour la météo.
3. Mettre à jour la production disponible.
4. Mettre à jour la demande de base.
5. Mettre à jour les jobs IA.
6. Appliquer les effets actifs des actions joueur.
7. Calculer production totale.
8. Calculer consommation totale.
9. Calculer équilibre réseau.
10. Mettre à jour stabilité.
11. Mettre à jour CO₂.
12. Mettre à jour coût.
13. Mettre à jour satisfaction.
14. Mettre à jour souveraineté.
15. Mettre à jour productivité IA.
16. Déclencher événements programmés.
17. Déclencher événements conditionnels.
18. Générer alertes.
19. Mettre à jour score.
20. Vérifier victoire ou échec.
21. Ajouter un snapshot à l’historique.

---

## 16.3. Équilibre réseau

Le réseau est stable lorsque la production disponible couvre la consommation avec une marge suffisante.

Variables conceptuelles :

* production totale ;
* consommation totale ;
* marge ;
* marge de réserve ;
* déficit ;
* surplus.

Règle simplifiée :

* si production ≈ consommation : stabilité stable ;
* si déficit léger : stabilité baisse lentement ;
* si déficit fort : stabilité baisse vite ;
* si surplus léger : stabilité baisse peu ;
* si surplus fort : stabilité baisse aussi, mais moins violemment qu’un déficit ;
* si stabilité trop basse trop longtemps : blackout.

Le jeu doit éviter une simulation trop physique. Il faut une abstraction lisible.

---

## 16.4. CO₂

Le CO₂ doit être calculé à partir du mix de production utilisé.

Chaque source a une intensité carbone simulée.

La valeur affichée peut être :

* intensité instantanée ;
* ou score CO₂ ;
* ou émissions cumulées.

Pour le gameplay, il est important que :

* nucléaire, solaire, éolien, hydraulique soient bas carbone ;
* thermique soit très pénalisant ;
* import varie selon scénario ;
* batteries héritent du mix de charge de manière simplifiée ou neutre pour le MVP.

---

## 16.5. Coût

Le coût augmente selon :

* production utilisée ;
* import ;
* thermique ;
* activation de flexibilité ;
* pénalités économiques ;
* dégradation de services.

Le coût ne doit pas être trop complexe. Il doit surtout rendre visible qu’une solution techniquement efficace peut être chère.

---

## 16.6. Satisfaction publique

La satisfaction baisse si :

* recharge EV trop limitée ;
* salon dégradé ;
* résidentiel trop effacé ;
* blackout ;
* coût public trop élevé ;
* communication mauvaise.

Elle augmente ou se maintient si :

* services stables ;
* explications claires ;
* peu d’impact utilisateur ;
* bonne gestion de crise.

---

## 16.7. Productivité IA

La productivité IA augmente quand :

* jobs terminés ;
* qualité maintenue ;
* deadlines respectées ;
* jobs critiques priorisés.

Elle baisse quand :

* jobs interrompus ;
* deadlines ratées ;
* modèle trop réduit ;
* agent arrêté trop tôt ;
* latence excessive.

Le jeu doit montrer que réduire la consommation IA n’est pas toujours optimal. Il faut réduire intelligemment.

---

## 16.8. Souveraineté

La souveraineté baisse quand :

* jobs stratégiques externalisés ;
* cloud étranger utilisé ;
* calcul critique reporté trop longtemps ;
* service IA public indisponible.

Elle augmente ou reste haute quand :

* datacenter local priorisé ;
* jobs critiques maintenus ;
* réseau stabilisé sans dépendance externe ;
* optimisation locale réussie.

---

# 17. Moteur d’événements

## 17.1. Types d’événements

### Événements programmés

Ils arrivent à une heure précise.

Exemples :

* 12h00 : pic solaire ;
* 14h00 : conférence IA ;
* 18h30 : retour domicile ;
* 19h00 : pic résidentiel ;
* 20h00 : deadline cyber.

---

### Événements conditionnels

Ils arrivent si une condition est remplie.

Exemples :

* si stabilité < 50 pendant 3 ticks : alerte réseau ;
* si agent IA > seuil d’appels : anomalie agent ;
* si batterie < 10 % avant 18h : alerte réserve ;
* si souveraineté < 40 : pression politique ;
* si CO₂ trop élevé : critique publique.

---

### Événements aléatoires contrôlés

Ils ajoutent de la variété.

Exemples :

* baisse de vent ;
* retard industriel ;
* hausse imprévue de recharge ;
* demande urgente de calcul IA ;
* ligne locale saturée.

Important :

Le hasard doit rester juste. Le joueur doit pouvoir réagir.

---

## 17.2. Système de priorité

Les événements doivent être classés par priorité :

1. Événements critiques ;
2. Événements objectifs ;
3. Alertes réseau ;
4. Alertes IA ;
5. Messages pédagogiques ;
6. Messages ambiance.

Si plusieurs événements arrivent en même temps, le jeu doit éviter d’inonder le joueur.

---

## 17.3. Feedback d’événement

Chaque événement doit avoir :

* message d’arrivée ;
* effet visible ;
* actions possibles ;
* feedback si résolu ;
* feedback si ignoré.

Exemple :

Événement :

> “Agent IA en boucle”

Message d’arrivée :

> “Le datacenter signale une hausse anormale des appels sur l’agent Code Runner.”

Effet :

* consommation IA augmente progressivement ;
* productivité n’augmente pas proportionnellement ;
* stabilité peut baisser.

Actions :

* timeout ;
* cache ;
* pause agent ;
* modèle plus petit.

Feedback positif :

> “L’agent a été stabilisé. 38 % des appels redondants ont été évités.”

Feedback négatif :

> “L’agent continue de consommer sans produire de valeur utile. La charge IA pèse maintenant sur le pic réseau.”

---

# 18. Assistant IA intégré

## 18.1. Rôle de l’assistant

L’assistant IA est un copilote pédagogique. Il doit :

* expliquer l’état du réseau ;
* signaler les risques ;
* proposer des actions ;
* expliquer les conséquences ;
* produire un débrief final ;
* rendre les arbitrages compréhensibles.

Il ne doit pas jouer à la place du joueur. Il conseille.

---

## 18.2. Sources de l’assistant

L’assistant doit se baser uniquement sur :

* état courant du jeu ;
* historique récent ;
* objectifs de mission ;
* règles de simulation ;
* événements actifs ;
* actions disponibles.

Il ne doit pas inventer d’événements, de métriques ou de chiffres qui ne sont pas dans l’état du jeu.

---

## 18.3. Deux niveaux d’assistant

### Niveau déterministe

Le moteur de règles détecte des situations :

* stabilité faible ;
* batterie basse ;
* job IA flexible pendant pic ;
* CO₂ élevé ;
* import trop utilisé ;
* satisfaction basse.

Il génère une recommandation structurée.

### Niveau LLM

Le modèle reformule la recommandation dans un langage naturel.

Exemple :

Données factuelles :

* stabilité = 42 ;
* job IA non critique en cours ;
* batterie = 70 % ;
* pic résidentiel actif.

Message généré :

> “La marge réseau est faible. Le job IA de génération vidéo n’est pas prioritaire : le suspendre 30 minutes et décharger partiellement la batterie permettrait de passer le pic sans toucher aux services critiques.”

---

## 18.4. Types de messages

### Conseil tactique

Court, actionnable.

> “Décale le job vidéo : il est flexible et tombe pendant le pic.”

### Explication pédagogique

Plus longue.

> “La difficulté ici vient de la puissance appelée en même temps. Même si l’énergie totale du job IA reste limitée, il aggrave le pic au mauvais moment.”

### Alerte critique

Très visible.

> “Stabilité critique : déficit de production depuis 3 ticks.”

### Débrief final

Analyse de la partie.

> “Tu as maintenu une bonne souveraineté, mais tu as trop utilisé la production thermique. Ta meilleure décision a été de prioriser les jobs cyber et de reporter les générations non urgentes.”

---

# 19. PromptWatt comme module interne

## 19.1. Rôle du module

PromptWatt ne doit pas être le produit principal dans cette version. Il devient un panneau spécialisé dans le datacenter IA.

Son rôle :

> rendre visible la consommation des jobs IA et proposer des optimisations.

---

## 19.2. Affichage PromptWatt

Dans le panneau datacenter, afficher :

* puissance IA actuelle ;
* énergie IA cumulée ;
* nombre de jobs terminés ;
* nombre de jobs reportés ;
* part IA dans la consommation totale ;
* jobs les plus consommateurs ;
* économies obtenues grâce aux optimisations ;
* score d’efficacité IA.

---

## 19.3. Score d’efficacité IA

Le score doit comparer :

* énergie consommée ;
* valeur produite ;
* criticité ;
* respect deadline ;
* optimisations appliquées.

Exemple d’interprétation :

* 90-100 : usage IA très efficace ;
* 70-89 : bon usage ;
* 50-69 : optimisable ;
* 30-49 : surdimensionné ;
* 0-29 : gaspillage probable.

---

## 19.4. Recommandations PromptWatt

Exemples :

* “Ce job est non critique : décalage recommandé.”
* “Ce job présente beaucoup de redondance : cache recommandé.”
* “Le modèle expert semble surdimensionné pour cette tâche.”
* “Ce batch peut être regroupé avec les jobs de 14h.”
* “Cet agent dépasse son budget d’appels : timeout recommandé.”

---

# 20. Energy SOC comme module interne

## 20.1. Rôle du module

Energy SOC détecte les anomalies de consommation.

Il apporte l’angle “defend” :

> défendre le réseau et les ressources numériques contre les comportements anormaux, inefficaces ou suspects.

---

## 20.2. Anomalies détectables

### Agent IA en boucle

Signal :

* nombre d’appels augmente rapidement ;
* progression faible ;
* consommation disproportionnée.

Action :

* timeout ;
* pause ;
* audit ;
* cache.

---

### Cryptomining simulé

Signal :

* charge GPU constante ;
* aucune valeur IA produite ;
* consommation nocturne suspecte.

Action :

* isoler charge ;
* couper processus ;
* alerte sécurité.

Important :

Le jeu ne doit pas expliquer comment miner ou attaquer. Il doit seulement simuler une anomalie défensive.

---

### Surcharge datacenter

Signal :

* trop de jobs simultanés ;
* file d’attente longue ;
* puissance trop élevée.

Action :

* priorisation ;
* décalage ;
* externalisation ;
* modèle plus léger.

---

### Consommation bâtiment anormale

Signal :

* consommation hors profil ;
* pic sans événement connu.

Action :

* diagnostic ;
* effacement ;
* enquête.

---

# 21. Codebase détaillée sans code

## 21.1. Organisation générale recommandée

La codebase doit être organisée par responsabilités, pas uniquement par pages.

Structure logique recommandée :

* application web ;
* composants UI ;
* moteur de jeu ;
* moteur de simulation ;
* moteur de scénario ;
* moteur d’actions ;
* assistant IA ;
* modules data ;
* modules persistence ;
* modules tests ;
* assets visuels ;
* contenu narratif.

---

## 21.2. Module “App Shell”

Responsabilité :

* initialiser l’application ;
* charger les polices, thème, layout global ;
* définir les routes ;
* gérer les erreurs globales ;
* afficher l’écran de chargement.

Éléments à gérer :

* page accueil ;
* page jeu ;
* page résultats ;
* page sandbox ;
* page leaderboard optionnelle.

Critères d’acceptation :

* l’application démarre sans scénario chargé ;
* l’utilisateur peut lancer une mission ;
* une erreur de chargement scénario affiche un message clair ;
* le mode démo est accessible en un clic.

---

## 21.3. Module “Game Store”

Responsabilité :

* stocker l’état courant du jeu ;
* exposer les actions principales ;
* synchroniser l’UI ;
* garder l’historique.

Contenu :

* état de la mission ;
* état du temps ;
* actifs ;
* jobs IA ;
* métriques ;
* événements ;
* messages assistant ;
* historique actions.

Fonctions conceptuelles attendues :

* démarrer une partie ;
* mettre en pause ;
* reprendre ;
* changer vitesse ;
* appliquer action joueur ;
* avancer d’un tick ;
* terminer partie ;
* réinitialiser partie.

Critères d’acceptation :

* toute modification d’état passe par ce module ;
* l’UI ne modifie jamais directement les objets profonds ;
* l’historique permet le débrief.

---

## 21.4. Module “Simulation Engine”

Responsabilité :

* calculer l’évolution du système à chaque tick.

Sous-modules :

1. production ;
2. consommation ;
3. météo ;
4. réseau ;
5. stockage ;
6. IA ;
7. score ;
8. événements conditionnels.

Entrées :

* état courant ;
* actions actives ;
* scénario ;
* tick courant.

Sorties :

* nouvel état ;
* nouvelles métriques ;
* nouvelles alertes ;
* événements déclenchés.

Critères d’acceptation :

* le moteur est déterministe à seed identique ;
* une action produit toujours les mêmes effets dans le même contexte ;
* les calculs sont isolés de l’interface ;
* les règles sont faciles à ajuster.

---

## 21.5. Module “Time Engine”

Responsabilité :

* gérer l’heure simulée ;
* gérer vitesse ;
* gérer pause ;
* déclencher ticks.

Paramètres :

* heure de début ;
* heure de fin ;
* durée d’un tick ;
* vitesse réelle ;
* accélération.

Critères d’acceptation :

* pause stoppe toute simulation ;
* reprise continue proprement ;
* accélération ne casse pas l’ordre des événements ;
* fin de mission détectée correctement.

---

## 21.6. Module “Production Engine”

Responsabilité :

* calculer la production disponible de chaque source.

Par source :

* nucléaire : stable, variation lente ;
* solaire : dépend heure et météo ;
* éolien : dépend météo ;
* hydraulique : dépend activation et réserve ;
* batterie : dépend charge/décharge ;
* import : dépend action ;
* thermique : dépend action.

Critères d’acceptation :

* chaque source a une contribution visible ;
* les sources limitées ne peuvent pas dépasser leur capacité ;
* les indisponibilités sont prises en compte ;
* la production totale est traçable.

---

## 21.7. Module “Demand Engine”

Responsabilité :

* calculer la consommation.

Consommateurs :

* résidentiel ;
* industrie ;
* hôpital ;
* EV ;
* salon ;
* datacenter IA.

Critères d’acceptation :

* chaque charge a un profil horaire ;
* les actions d’effacement modifient la demande ;
* les charges critiques résistent aux réductions ;
* la demande totale est expliquable.

---

## 21.8. Module “AI Workload Engine”

Responsabilité :

* gérer les jobs IA.

Fonctions conceptuelles :

* démarrer jobs ;
* terminer jobs ;
* reporter jobs ;
* interrompre jobs ;
* optimiser jobs ;
* calculer consommation IA ;
* calculer valeur produite ;
* détecter jobs redondants ;
* gérer deadlines.

Critères d’acceptation :

* chaque job a un statut clair ;
* les jobs critiques sont distingués ;
* les optimisations ont un effet mesurable ;
* la productivité IA est calculée à partir des jobs, pas arbitrairement.

---

## 21.9. Module “PromptWatt Engine”

Responsabilité :

* estimer l’efficacité énergétique des jobs IA.

Entrées :

* type de job ;
* modèle ;
* durée ;
* nombre d’appels ;
* criticité ;
* optimisations.

Sorties :

* énergie estimée ;
* score efficacité ;
* recommandations ;
* économies estimées.

Critères d’acceptation :

* les estimations restent pédagogiques ;
* le module indique toujours que c’est une approximation ;
* les recommandations sont cohérentes ;
* le contenu exact des prompts n’est jamais nécessaire.

---

## 21.10. Module “Grid Stability Engine”

Responsabilité :

* calculer la stabilité réseau.

Prend en compte :

* déficit ;
* surplus ;
* marge de réserve ;
* durée de tension ;
* services critiques ;
* congestion éventuelle ;
* actions correctives.

Critères d’acceptation :

* stabilité ne varie pas de manière incompréhensible ;
* un déficit prolongé mène à une crise ;
* les actions ont un effet clair ;
* le joueur comprend pourquoi la jauge baisse.

---

## 21.11. Module “Carbon Engine”

Responsabilité :

* calculer l’impact carbone.

Prend en compte :

* mix de production ;
* import ;
* thermique ;
* énergie totale consommée ;
* part des jobs IA.

Critères d’acceptation :

* le joueur voit quelle source fait monter le CO₂ ;
* l’IA n’est pas automatiquement pénalisée ;
* le timing peut améliorer le score ;
* le thermique est clairement coûteux en CO₂.

---

## 21.12. Module “Cost Engine”

Responsabilité :

* calculer coût instantané et cumulé.

Prend en compte :

* sources utilisées ;
* import ;
* thermique ;
* flexibilité ;
* interruption ;
* pénalités économiques.

Critères d’acceptation :

* les arbitrages coût/stabilité sont visibles ;
* une solution d’urgence a un coût ;
* le coût final est expliqué dans le débrief.

---

## 21.13. Module “Sovereignty Engine”

Responsabilité :

* calculer le score souveraineté.

Prend en compte :

* part de calcul IA local ;
* externalisation ;
* jobs critiques ;
* import énergétique ;
* indisponibilité de services stratégiques.

Critères d’acceptation :

* externaliser n’est pas toujours interdit, mais pénalisé ;
* les choix souverains sont valorisés ;
* la souveraineté reste un arbitrage, pas une morale simple.

---

## 21.14. Module “Action Engine”

Responsabilité :

* gérer toutes les actions joueur.

Sous-responsabilités :

* lister actions disponibles ;
* vérifier conditions ;
* calculer coûts ;
* appliquer effets ;
* gérer durée ;
* générer feedback.

Chaque action doit définir :

* cible ;
* préconditions ;
* effet immédiat ;
* effet différé ;
* durée ;
* impact sur métriques ;
* risque ;
* texte explicatif.

Critères d’acceptation :

* aucune action impossible ne doit être affichée comme disponible ;
* chaque action doit expliquer son impact probable ;
* les effets doivent être visibles après activation.

---

## 21.15. Module “Scenario Engine”

Responsabilité :

* charger et orchestrer les missions.

Fonctions conceptuelles :

* charger scénario ;
* initialiser état ;
* déclencher événements programmés ;
* gérer objectifs ;
* gérer tutoriel ;
* vérifier fin de mission.

Critères d’acceptation :

* ajouter une mission ne demande pas de modifier le moteur ;
* les scénarios sont paramétrables ;
* le scénario peut être testé seul.

---

## 21.16. Module “Event Engine”

Responsabilité :

* gérer événements actifs.

Fonctions conceptuelles :

* déclencher événement ;
* appliquer effet ;
* expirer événement ;
* résoudre événement ;
* prioriser affichage.

Critères d’acceptation :

* pas plus de 2 ou 3 événements majeurs visibles en même temps ;
* les événements ont un effet mesurable ;
* les événements résolus génèrent du feedback.

---

## 21.17. Module “Advisor Engine”

Responsabilité :

* décider quoi conseiller au joueur.

Il doit analyser :

* métriques actuelles ;
* objectifs ;
* événements actifs ;
* actions disponibles ;
* historique récent ;
* état des jobs IA.

Il doit produire :

* recommandations classées ;
* niveau d’urgence ;
* justification ;
* action associée.

Critères d’acceptation :

* les conseils sont pertinents ;
* les conseils ne contredisent pas les règles ;
* l’assistant peut expliquer pourquoi il recommande une action.

---

## 21.18. Module “LLM Adapter”

Responsabilité :

* connecter le jeu à un modèle de langage.

Règles importantes :

* le LLM ne décide pas seul des effets de jeu ;
* le LLM reformule ou explique ;
* les faits sont fournis par le moteur ;
* la réponse doit être courte ;
* en cas d’échec API, fallback sur texte pré-écrit.

Entrées :

* résumé de l’état ;
* recommandation structurée ;
* ton souhaité ;
* longueur maximale.

Sorties :

* message assistant ;
* résumé ;
* débrief.

Critères d’acceptation :

* le jeu reste jouable sans LLM ;
* aucune hallucination bloquante ;
* messages cohérents avec l’état.

---

## 21.19. Module “UI Components”

Responsabilité :

* fournir les composants réutilisables.

Composants nécessaires :

* jauge métrique ;
* carte d’actif ;
* panneau détail ;
* bouton action ;
* timeline ;
* carte événement ;
* message assistant ;
* graphique production/consommation ;
* carte stylisée ;
* modal de résultat ;
* badge de succès ;
* alerte critique.

Critères d’acceptation :

* composants lisibles à distance ;
* états visuels clairs ;
* responsive minimal ;
* cohérence graphique.

---

## 21.20. Module “Map View”

Responsabilité :

* afficher la carte centrale.

Éléments :

* zones ;
* actifs ;
* lignes ;
* flux ;
* alertes ;
* états couleur.

Interactions :

* clic sur actif ;
* hover pour résumé ;
* animation lors d’un incident ;
* zoom optionnel non nécessaire MVP.

Critères d’acceptation :

* le joueur comprend où est le problème ;
* les éléments critiques ressortent immédiatement ;
* la carte reste lisible.

---

## 21.21. Module “Charts”

Responsabilité :

* afficher les courbes et graphes.

Graphiques nécessaires :

* production vs consommation ;
* mix énergétique ;
* puissance IA ;
* stabilité dans le temps ;
* niveau batterie ;
* score final.

Critères d’acceptation :

* les graphes aident à décider ;
* pas de surcharge visuelle ;
* les couleurs sont cohérentes avec le reste.

---

## 21.22. Module “Results & Debrief”

Responsabilité :

* afficher fin de partie.

Contenu :

* score total ;
* badges ;
* courbe stabilité ;
* moments critiques ;
* meilleures décisions ;
* erreurs principales ;
* consommation IA ;
* productivité IA ;
* CO₂ ;
* souveraineté ;
* recommandation finale.

Critères d’acceptation :

* le joueur comprend pourquoi il a gagné ou perdu ;
* le débrief donne envie de rejouer ;
* le message final reste positif sur l’IA.

---

## 21.23. Module “Leaderboard”

Responsabilité :

* comparer les scores.

Pour hackathon :

* nom équipe ;
* score ;
* badge principal ;
* productivité IA ;
* stabilité ;
* CO₂.

Option spéciale :

> classement “meilleure intégration IA-énergie”.

Critères d’acceptation :

* entrée manuelle suffisante pour MVP ;
* pas besoin de compte utilisateur ;
* reset possible.

---

## 21.24. Module “Persistence”

Responsabilité :

* sauvegarder localement ou côté serveur.

Données :

* score ;
* paramètres partie ;
* historique actions ;
* snapshot final ;
* leaderboard.

Critères d’acceptation :

* rafraîchir la page ne détruit pas forcément tout ;
* le mode démo peut être réinitialisé ;
* pas de données personnelles nécessaires.

---

## 21.25. Module “Testing”

Tests prioritaires :

* simulation déterministe ;
* équilibre production/demande ;
* actions principales ;
* scénarios ;
* score final ;
* stabilité ;
* jobs IA ;
* événements.

Critères d’acceptation :

* une mission complète peut tourner automatiquement ;
* aucun score impossible ;
* pas de jauge hors bornes ;
* pas de blocage si LLM indisponible.

---

# 22. Données et scénarios

## 22.1. MVP avec données simulées

Pour le hackathon, il faut utiliser des données simulées réalistes.

Raison :

* plus rapide ;
* plus fiable ;
* pas de dépendance API ;
* meilleur contrôle narratif ;
* plus simple pour équilibrer le gameplay.

Les données doivent représenter :

* profil résidentiel ;
* production solaire ;
* production éolienne ;
* production stable ;
* pic EV ;
* datacenter IA ;
* événement salon ;
* météo.

---

## 22.2. Données réelles optionnelles

Après le MVP, on peut brancher :

* données de mix électrique ;
* intensité carbone ;
* météo ;
* profils de consommation ;
* import CSV Linky ;
* simulation d’usage IA réel.

Mais il ne faut pas en dépendre pour la démo.

---

## 22.3. Générateur de scénarios

À terme, un générateur pourrait produire :

* météo ;
* profils de demande ;
* événements IA ;
* incidents ;
* objectifs.

Pour le MVP, créer manuellement 1 ou 2 scénarios très bien équilibrés.

---

# 23. Design visuel

## 23.1. Direction artistique

Style recommandé :

> **Control room cyber-énergie.**

Références visuelles :

* fond sombre ;
* grille fine ;
* néons verts ;
* alertes rouges ;
* bleu électrique pour IA ;
* jaune/orange pour énergie ;
* typographie compacte ;
* panels type cockpit.

L’image du programme Defend Intelligence que tu as montrée donne une très bonne direction : noir, vert fluo, rouge, blocs très contrastés.

---

## 23.2. Palette fonctionnelle

* Vert : stable, bas carbone, réussite.
* Orange : tension, avertissement.
* Rouge : crise, blackout, surcharge.
* Bleu : IA, datacenter, numérique.
* Violet : événement spécial.
* Gris : inactif, indisponible.
* Blanc : texte principal.

---

## 23.3. Lisibilité salon

L’interface doit être lisible à 1 ou 2 mètres.

Priorités :

* gros chiffres ;
* jauges claires ;
* icônes simples ;
* peu de texte simultané ;
* animations courtes ;
* alertes évidentes.

---

# 24. Parcours utilisateur

## 24.1. Écran d’accueil

Contenu :

* logo Grid Defender ;
* pitch en une phrase ;
* bouton “Lancer démo 3 minutes” ;
* bouton “Mission complète” ;
* bouton “Sandbox” ;
* éventuellement “Leaderboard”.

Texte recommandé :

> “Défendez le réseau. Gardez l’IA en ligne. Évitez le blackout.”

---

## 24.2. Lancement mission

Avant la mission, afficher :

* objectif ;
* contexte ;
* conditions de victoire ;
* indicateurs principaux ;
* conseil initial.

Exemple :

> “Mission : gérer le pic du soir pendant qu’un datacenter IA lance plusieurs jobs. Priorité : stabilité, services critiques, souveraineté.”

---

## 24.3. Pendant la partie

Le joueur doit toujours savoir :

* quelle heure il est ;
* quel est le problème principal ;
* quelle action il peut faire ;
* quel indicateur est en danger ;
* ce qui arrive bientôt.

---

## 24.4. Fin de partie

La partie se termine par :

* victoire ;
* échec ;
* fin de temps avec score.

Écran final :

* score ;
* badges ;
* synthèse ;
* replay des moments clés ;
* message assistant ;
* bouton rejouer ;
* bouton leaderboard.

---

# 25. Conditions de victoire et d’échec

## 25.1. Victoire

Le joueur gagne si :

* la mission atteint l’heure de fin ;
* aucun blackout majeur ;
* services critiques maintenus ;
* stabilité moyenne suffisante.

Score élevé si :

* CO₂ bas ;
* productivité IA haute ;
* souveraineté haute ;
* satisfaction correcte ;
* peu de coûts extrêmes.

---

## 25.2. Échec

Échec immédiat possible si :

* blackout prolongé ;
* hôpital coupé ;
* service cyber critique échoue ;
* stabilité tombe à zéro ;
* souveraineté critique sur mission spéciale.

Échec non immédiat mais pénalisant :

* CO₂ très élevé ;
* coût explosif ;
* public mécontent ;
* jobs IA non critiques ratés.

---

# 26. Équilibrage du jeu

## 26.1. Principes

Le jeu doit être :

* compréhensible ;
* tendu ;
* juste ;
* rejouable ;
* pas trop punitif.

Le joueur doit pouvoir réussir la mission avec plusieurs stratégies.

---

## 26.2. Erreurs fréquentes prévues

Le joueur novice va probablement :

* lancer tous les jobs IA immédiatement ;
* vider les batteries trop tôt ;
* ignorer la timeline ;
* trop importer ;
* oublier les EV ;
* couper des usages trop critiques.

Le jeu doit utiliser ces erreurs pour enseigner, pas pour humilier.

---

## 26.3. Stratégies gagnantes

Stratégies que le jeu doit valoriser :

* charger batterie avant le pic ;
* décaler jobs IA flexibles ;
* protéger jobs IA critiques ;
* activer cache / timeout ;
* lisser recharge EV ;
* utiliser hydraulique au bon moment ;
* éviter thermique sauf urgence ;
* anticiper météo.

---

# 27. Plan MVP hackathon

## 27.1. MVP indispensable

Le MVP doit contenir :

* écran accueil ;
* une mission jouable ;
* carte simplifiée ;
* jauges principales ;
* moteur de simulation ;
* actions principales ;
* jobs IA ;
* assistant IA simple ;
* fin de partie avec score.

Actions MVP minimales :

* décaler job IA ;
* réduire modèle ;
* activer cache ;
* décharger batterie ;
* importer énergie ;
* recharge EV intelligente ;
* activer thermique secours.

Événements MVP :

* pic du soir ;
* job IA non critique ;
* job IA critique ;
* agent IA en boucle ;
* baisse solaire.

---

## 27.2. Ce qui peut être simulé sans backend

* production ;
* demande ;
* jobs IA ;
* score ;
* événements ;
* assistant basé sur règles ;
* débrief simple ;
* leaderboard local.

---

## 27.3. Ce qui nécessite backend ou API

* assistant LLM réel ;
* leaderboard partagé ;
* sauvegarde distante ;
* données temps réel ;
* import utilisateur ;
* génération dynamique de scénarios.

---

## 27.4. Découpage de travail en équipe

### Personne 1 — Front-end principal

Responsabilités :

* layout ;
* carte ;
* jauges ;
* panneaux ;
* interactions.

### Personne 2 — Simulation

Responsabilités :

* moteur tick ;
* production/demande ;
* actions ;
* scoring ;
* équilibrage.

### Personne 3 — IA / assistant / contenu

Responsabilités :

* messages ;
* recommandations ;
* débrief ;
* prompts LLM si utilisé ;
* scénario.

### Personne 4 — Design / pitch / démo

Responsabilités :

* direction artistique ;
* assets ;
* présentation ;
* script démo ;
* vidéo éventuelle.

Si l’équipe est plus petite, fusionner simulation + IA, et front + design.

---

# 28. Backlog détaillé

## 28.1. Priorité P0 — Obligatoire

* créer écran accueil ;
* créer layout jeu ;
* afficher carte ;
* afficher jauges ;
* charger scénario ;
* lancer simulation ;
* gérer pause ;
* gérer actions ;
* calculer stabilité ;
* calculer consommation ;
* calculer production ;
* créer jobs IA ;
* créer pic du soir ;
* finir partie ;
* afficher score ;
* afficher 5 messages assistant clés.

---

## 28.2. Priorité P1 — Très souhaitable

* timeline ;
* animations de flux ;
* module PromptWatt ;
* anomalie agent ;
* débrief détaillé ;
* badges ;
* leaderboard local ;
* mode démo 3 minutes ;
* plusieurs niveaux de difficulté.

---

## 28.3. Priorité P2 — Bonus

* assistant LLM complet ;
* données externes ;
* import CSV ;
* sandbox ;
* génération de scénarios ;
* replay ;
* carte plus avancée ;
* son ;
* mode multi-équipe.

---

# 29. Script de démo recommandé

## 29.1. Démo en 3 minutes

### 0:00 — Introduction

Dire :

> “Grid Defender montre que le sujet n’est pas de couper l’IA, mais de l’orchestrer intelligemment avec le réseau.”

### 0:20 — État initial

Montrer :

* réseau stable ;
* production bas carbone ;
* datacenter IA ;
* pic prévu à 19h.

### 0:45 — Premier événement

Le jeu annonce :

> “Un datacenter IA lance un job vidéo non critique pendant le pic.”

La stabilité baisse.

### 1:10 — Mauvaise décision volontaire

Laisser le job tourner ou activer thermique.

Montrer :

* stabilité sauvée mais CO₂/coût augmente.

### 1:40 — Rejouer ou corriger

Décaler job IA + activer cache + recharge EV intelligente.

Montrer :

* stabilité remonte ;
* CO₂ reste bas ;
* productivité IA préservée.

### 2:20 — Anomalie agent

Energy SOC détecte :

> “Agent IA en boucle.”

Activer timeout.

### 2:45 — Conclusion

Afficher score et débrief.

Dire :

> “L’IA consomme, mais elle est aussi flexible et optimisable. Le bon enjeu, c’est le pilotage intelligent.”

---

# 30. Messages clés pour le jury

Le pitch doit marteler trois idées.

## Message 1

> **On ne fait pas un jeu anti-IA. On fait un jeu pro-orchestration.**

## Message 2

> **L’énergie de l’IA n’est pas seulement une question de quantité, mais de temporalité, flexibilité et valeur produite.**

## Message 3

> **L’IA peut aider à défendre le réseau en priorisant les usages critiques, en détectant les anomalies et en planifiant les charges flexibles.**

---

# 31. Risques projet et solutions

## 31.1. Risque : jeu trop complexe

Solution :

* limiter à 5 jauges ;
* limiter à 7 actions ;
* une seule mission très bien faite ;
* assistant très présent.

---

## 31.2. Risque : message perçu comme anti-IA

Solution :

* montrer des jobs IA utiles ;
* protéger l’IA critique ;
* valoriser productivité IA ;
* expliquer que l’objectif est l’optimisation, pas la réduction aveugle.

---

## 31.3. Risque : simulation peu réaliste

Solution :

* assumer serious game pédagogique ;
* afficher “simulation simplifiée” ;
* utiliser des ordres de grandeur cohérents ;
* privilégier clarté et arbitrages.

---

## 31.4. Risque : LLM hallucine

Solution :

* recommandations calculées par règles ;
* LLM seulement pour reformulation ;
* fallback texte ;
* messages courts.

---

## 31.5. Risque : démo instable

Solution :

* prévoir un mode démo scripté ;
* seed fixe ;
* scénario déterministe ;
* pas de dépendance API obligatoire.

---

# 32. Définition précise du MVP final

À la fin du hackathon, le produit doit permettre :

1. D’ouvrir une page web.
2. De cliquer sur “Lancer la démo”.
3. De voir une carte énergétique.
4. De voir la production, la consommation et les jauges.
5. De subir un pic de demande.
6. De voir un datacenter IA consommer.
7. De choisir entre au moins 5 actions.
8. De voir les conséquences immédiates.
9. De recevoir des conseils IA.
10. De terminer avec un score et un débrief.

Le MVP est réussi si une personne extérieure comprend en moins de 3 minutes :

> “Ah, le sujet c’est de piloter les charges IA intelligemment dans un réseau électrique, pas de dire que l’IA est mauvaise.”

---

# 33. Spécification détaillée d’une mission MVP

## Mission : “Le pic de 19h”

Durée réelle : 4 minutes.
Durée simulée : 17h30 à 20h30.
Contexte : fin de journée, baisse solaire, recharge EV, datacenter IA actif.

### État initial

* Stabilité : 85.
* CO₂ : bon.
* Coût : normal.
* Souveraineté : 90.
* Productivité IA : 60.
* Satisfaction : 80.
* Batterie : 65 %.
* Datacenter : charge moyenne.

### Événement 1 — 18h00

> “La recharge des véhicules électriques commence plus tôt que prévu.”

Effet :

* demande EV augmente ;
* stabilité baisse légèrement.

Bonne action :

* recharge intelligente.

---

### Événement 2 — 18h30

> “Le datacenter veut lancer un job de génération vidéo pour le salon.”

Effet :

* puissance IA augmente ;
* productivité IA potentielle augmente ;
* stabilité baisse si lancé pendant pic.

Bonne action :

* décaler le job ;
* réduire qualité ;
* batcher.

---

### Événement 3 — 18h50

> “Le solaire chute. Le pic résidentiel commence.”

Effet :

* production baisse ;
* demande augmente ;
* stabilité chute.

Bonne action :

* décharger batterie ;
* hydraulique ;
* reporter IA flexible.

---

### Événement 4 — 19h10

> “Un job cyber critique arrive.”

Effet :

* demande IA augmente ;
* mais criticité élevée.

Bonne action :

* prioriser job cyber ;
* réduire autres jobs ;
* ne pas couper le cyber.

---

### Événement 5 — 19h30

> “Agent IA en boucle détecté.”

Effet :

* consommation IA augmente sans valeur ;
* Productivité IA n’augmente presque pas.

Bonne action :

* activer timeout ;
* cache ;
* audit.

---

### Fin — 20h30

Débrief :

* stabilité moyenne ;
* CO₂ ;
* coût ;
* IA critique traitée ou non ;
* énergie économisée par optimisation ;
* score final.

---

# 34. Spécification des actions MVP

## Action 1 — Recharge EV intelligente

Cible :

* bornes EV.

Effet :

* réduit demande immédiate ;
* reporte une partie plus tard ;
* baisse légère satisfaction si trop utilisée.

Feedback :

> “La recharge est lissée. Le pic baisse, mais certains véhicules seront chargés plus tard.”

---

## Action 2 — Décaler job IA

Cible :

* job IA flexible.

Effet :

* baisse consommation immédiate ;
* reporte productivité ;
* risque de deadline si abus.

Feedback :

> “Le job est reporté hors pic. Productivité préservée si la deadline reste respectée.”

---

## Action 3 — Réduire modèle IA

Cible :

* job IA sélectionné.

Effet :

* baisse consommation ;
* baisse légère qualité ;
* job plus rapide.

Feedback :

> “Modèle optimisé. La qualité baisse légèrement, mais l’énergie et le coût diminuent.”

---

## Action 4 — Activer cache IA

Cible :

* datacenter ou agent.

Effet :

* réduit appels redondants ;
* effet progressif ;
* très bon pour agent/chatbot.

Feedback :

> “Cache activé. Les requêtes répétées seront évitées.”

---

## Action 5 — Timeout agent

Cible :

* agent IA.

Effet :

* stoppe la boucle ;
* réduit consommation ;
* peut interrompre certaines explorations.

Feedback :

> “Timeout appliqué. L’agent ne peut plus dépasser son budget d’itérations.”

---

## Action 6 — Décharger batterie

Cible :

* batterie réseau.

Effet :

* augmente production disponible ;
* baisse niveau batterie.

Feedback :

> “Batterie déchargée. La stabilité remonte, mais la réserve diminue.”

---

## Action 7 — Importer énergie

Cible :

* réseau.

Effet :

* stabilité remonte ;
* coût augmente ;
* souveraineté baisse ;
* CO₂ selon scénario.

Feedback :

> “Import activé. Le réseau est sécurisé, mais le coût et la dépendance augmentent.”

---

## Action 8 — Thermique secours

Cible :

* production secours.

Effet :

* stabilité remonte fortement ;
* CO₂ augmente fortement ;
* coût augmente.

Feedback :

> “Production de secours lancée. C’est efficace, mais très pénalisant pour le score CO₂.”

---

# 35. Spécification du débrief final

Le débrief doit contenir 5 blocs.

## Bloc 1 — Résultat

* victoire ou échec ;
* score ;
* badge principal.

## Bloc 2 — Graphique de stabilité

Montrer :

* courbe de stabilité ;
* moments critiques ;
* actions importantes.

## Bloc 3 — IA

Montrer :

* jobs terminés ;
* jobs reportés ;
* jobs critiques réussis ;
* énergie IA estimée ;
* économies via cache/timeout/modèle réduit.

## Bloc 4 — Énergie

Montrer :

* consommation totale ;
* production par source ;
* CO₂ ;
* coût ;
* usage batteries/import/thermique.

## Bloc 5 — Recommandation

Texte généré ou template :

> “Ta meilleure décision a été de décaler le job vidéo pendant le pic. Ta principale amélioration serait de charger davantage les batteries avant 18h30.”

---

# 36. Version avancée après hackathon

Après le MVP, le jeu peut évoluer vers un vrai outil de simulation.

## 36.1. Mode entreprise

Une entreprise configure :

* nombre de serveurs ;
* jobs IA ;
* horaires ;
* contraintes ;
* mix énergétique.

Le jeu devient simulateur de stratégie énergétique IA.

---

## 36.2. Mode développeur

Un SDK mesure :

* appels IA ;
* tokens ;
* latence ;
* coût ;
* énergie estimée ;
* redondance.

Ces données alimentent Grid Defender.

---

## 36.3. Mode événement

Pendant un hackathon, chaque équipe connecte son projet.

Le jeu affiche :

* consommation IA estimée ;
* efficacité ;
* score sobriété ;
* leaderboard.

---

## 36.4. Mode pédagogique écoles

Version simplifiée :

* réseau ;
* météo ;
* batteries ;
* datacenter ;
* quiz IA.

---

# 37. Checklist de livraison

Avant la présentation, vérifier :

* la démo démarre en moins de 5 secondes ;
* le bouton “reset” fonctionne ;
* la mission peut être terminée ;
* les jauges ne se bloquent pas ;
* les actions ont un effet visible ;
* le scénario est compréhensible sans explication longue ;
* l’assistant donne au moins 5 messages pertinents ;
* le score final s’affiche ;
* le pitch tient en 45 secondes ;
* une mauvaise décision visible existe ;
* une bonne décision visible existe ;
* le jeu marche sans connexion API ;
* le mode plein écran est lisible.

---

# 38. Conclusion stratégique

Le projet le plus fort n’est pas simplement “un jeu sur le réseau électrique” ni “un compteur de consommation de l’IA”.

Le projet fort est :

## **un simulateur visuel où l’IA devient une charge flexible, stratégique et optimisable dans un réseau électrique bas carbone.**

Cela permet de défendre une position équilibrée :

* oui, l’IA consomme ;
* non, ce n’est pas automatiquement un problème insoluble ;
* le vrai sujet est l’orchestration ;
* la France a un avantage avec son mix bas carbone ;
* les datacenters IA peuvent devenir des charges pilotables ;
* les agents IA doivent être surveillés pour éviter le gaspillage ;
* l’IA peut aussi aider à défendre le réseau.

La phrase finale à retenir :

> **Grid Defender montre que l’avenir énergétique de l’IA ne se joue pas contre l’IA, mais avec une IA mieux pilotée, mieux priorisée et mieux intégrée au réseau.**



Oui, là il faut trancher techniquement. Pour ce projet, je recommande très clairement :

# Stack recommandée

## **MVP hackathon : React / Next.js + TypeScript + SVG/Canvas, pas full Three.js**

Le jeu doit ressembler à un **cockpit de supervision énergétique**, pas à un jeu 3D complet. Le plus important est d’avoir :

* des jauges lisibles ;
* une carte interactive ;
* des flux d’énergie animés ;
* des événements ;
* des décisions joueur ;
* des graphiques ;
* un assistant IA ;
* un score final.

Donc pour aller vite et faire propre :

> **Next.js + TypeScript + Zustand + Tailwind + Recharts + SVG animé**

C’est, selon moi, la meilleure stack.

---

# 1. Three.js ou pas Three.js ?

## Réponse claire : **pas de Three.js pour le cœur du MVP**

Je ne ferais pas le jeu en full 3D avec Three.js.

Pourquoi ?

* Ça prend vite beaucoup de temps.
* La sélection d’objets, caméra, responsive, raycasting, overlays UI deviennent pénibles.
* Le gameplay est surtout un jeu de **décision + data visualisation**, pas un jeu d’exploration 3D.
* Les graphiques, jauges, panels, timeline, assistant IA sont plus importants que la 3D.
* En hackathon, Three.js peut devenir un piège à temps.

Le bon rendu pour Grid Defender, c’est plutôt :

> **une carte 2D/2.5D stylisée façon centre de contrôle**, avec des nœuds, des lignes électriques, des flux animés, des alertes, et des panels de données.

Visuellement, ça peut être très beau sans Three.js.

---

## Quand utiliser Three.js quand même ?

Three.js peut être utilisé seulement en **bonus visuel**, pas comme base du gameplay.

Par exemple :

* écran d’accueil avec une Terre / grille électrique 3D ;
* datacenter stylisé en 3D ;
* vue 3D optionnelle du réseau ;
* animation de fond “cyber grid” ;
* carte isométrique simple.

Mais le cœur doit rester en React/SVG/Canvas.

Si quelqu’un dans l’équipe maîtrise déjà Three.js, on peut faire :

> **React Three Fiber pour la carte centrale uniquement, avec toute l’interface en React classique par-dessus.**

Mais si personne n’est à l’aise, il ne faut pas le choisir.

---

# 2. Stack technique recommandée

## Frontend principal

### Framework

**Next.js + React + TypeScript**

Pourquoi Next.js plutôt que Vite ?

* tu as le front et les routes API au même endroit ;
* pratique pour appeler un LLM côté serveur ;
* facile à déployer ;
* bon pour faire un projet propre rapidement ;
* permet une vraie app présentable.

Alternative plus simple :

**Vite + React + TypeScript**

À choisir si vous voulez un projet purement frontend, sans backend ni API IA.

Mon choix final :

> **Next.js si vous utilisez un assistant IA réel.**
> **Vite si vous voulez tout simuler localement.**

Pour Grid Defender, je prendrais **Next.js**.

---

## Langage

**TypeScript strict**

Obligatoire pour ce projet, parce qu’il y aura beaucoup d’objets :

* `GameState`
* `Scenario`
* `EnergyAsset`
* `LoadAsset`
* `AIJob`
* `PlayerAction`
* `GameEvent`
* `GridMetrics`

Sans TypeScript, ça va vite devenir un enfer.

---

## UI / CSS

**Tailwind CSS**

Très bon choix pour hackathon :

* rapide ;
* facile à styliser ;
* responsive ;
* parfait pour une interface sombre type cockpit.

Option :

**shadcn/ui**

Très utile pour :

* boutons ;
* cards ;
* modals ;
* sliders ;
* tabs ;
* tooltips ;
* panels.

Mais attention : il ne faut pas que l’interface ressemble trop à une app SaaS générique. Il faut customiser pour faire “control room”.

---

## State management

**Zustand**

C’est probablement le meilleur choix ici.

Pourquoi ?

* beaucoup plus simple que Redux ;
* très bon pour un jeu/dashboard ;
* facile à connecter aux composants React ;
* permet de centraliser l’état du jeu ;
* compatible avec une simulation tick par tick.

À éviter :

* trop de `useState` dispersés partout ;
* Redux si l’équipe n’est pas très à l’aise ;
* mettre toute la logique dans les composants React.

Le store Zustand devrait contenir :

* état courant de la partie ;
* heure simulée ;
* vitesse ;
* métriques ;
* assets ;
* jobs IA ;
* événements ;
* historique ;
* actions joueur ;
* messages assistant.

---

## Graphiques

**Recharts**

C’est le choix le plus simple avec React.

À utiliser pour :

* production vs consommation ;
* mix énergétique ;
* stabilité dans le temps ;
* charge IA dans le temps ;
* niveau batterie ;
* score final ;
* émissions CO₂ simulées.

Alternative plus puissante :

**ECharts**

Très bon pour dashboards avancés, mais un peu plus lourd.

Alternative à éviter pour le MVP :

**D3 pur**

Trop long pour un hackathon. Puissant, mais tu perds du temps à refaire toi-même ce que Recharts donne déjà.

Mon choix :

> **Recharts pour tous les graphes.**

---

## Carte du réseau

Je recommande trois options, par ordre de priorité.

---

# Option A — recommandée : **SVG interactif**

La carte centrale est un grand SVG avec :

* nœuds ;
* lignes ;
* icônes ;
* halos d’alerte ;
* flux animés ;
* labels ;
* clic sur les actifs.

Exemples d’éléments :

* centrale nucléaire ;
* parc solaire ;
* parc éolien ;
* batterie ;
* datacenter IA ;
* hôpital ;
* quartier résidentiel ;
* industrie ;
* bornes EV ;
* salon VivaTech fictif.

Avantages :

* très facile à intégrer à React ;
* très lisible ;
* parfait pour les clics ;
* facile à animer ;
* pas besoin de moteur de jeu ;
* très bon rendu “dashboard stratégique”.

Inconvénient :

* moins “wow 3D” que Three.js ;
* il faut soigner le design.

C’est le meilleur compromis.

---

# Option B — **Canvas 2D**

Le Canvas est utile si vous voulez beaucoup de particules ou de flux animés.

Exemples :

* milliers de petites particules qui circulent sur les lignes ;
* effets de surcharge ;
* arcs électriques ;
* bruit visuel ;
* animation fluide.

Mais les interactions sont moins simples qu’en SVG. Il faut gérer soi-même les clics et les zones.

Bonne approche hybride :

> **SVG pour les éléments cliquables + Canvas en arrière-plan pour les particules.**

C’est très puissant visuellement.

---

# Option C — **Three.js / React Three Fiber**

À utiliser seulement si l’équipe est à l’aise.

Rendu possible :

* carte isométrique 3D ;
* datacenter en cube lumineux ;
* lignes électriques en tubes ;
* particules dans l’espace ;
* caméra orthographique ;
* ambiance cyber.

Mais techniquement :

* sélection par raycasting ;
* adaptation mobile ;
* overlay UI ;
* performance ;
* synchronisation état jeu / scène 3D ;
* gestion des textes.

Donc pour hackathon :

> **Three.js uniquement en bonus, pas en cœur produit.**

---

# 3. Architecture front-end recommandée

## Structure générale

L’app doit être séparée en grands domaines.

### 1. `app`

Responsable des pages.

Contient :

* page d’accueil ;
* page jeu ;
* page résultats ;
* routes API ;
* layout global.

---

### 2. `components`

Composants React réutilisables.

Sous-parties :

* composants UI génériques ;
* composants de dashboard ;
* composants de jeu ;
* composants de carte ;
* composants de graphiques ;
* composants de modals.

---

### 3. `game`

Cœur logique du jeu.

Contient :

* moteur de simulation ;
* types du jeu ;
* actions ;
* scoring ;
* événements ;
* scénarios ;
* logique IA déterministe.

Ce dossier ne doit pas dépendre de React.

C’est important : le moteur du jeu doit être testable sans interface.

---

### 4. `store`

Contient Zustand.

Responsable de :

* stocker l’état ;
* lancer les ticks ;
* appliquer les actions ;
* synchroniser l’UI.

---

### 5. `data`

Contient les scénarios et les valeurs initiales.

Exemples :

* mission démo ;
* mission pic de 19h ;
* liste des actifs ;
* profils de demande ;
* profils météo ;
* jobs IA préconfigurés.

---

### 6. `lib`

Fonctions utilitaires.

Exemples :

* formatage des unités ;
* clamp des valeurs ;
* interpolation ;
* génération d’identifiants ;
* conversion heure simulée ;
* calculs simples.

---

### 7. `server`

Si besoin, logique backend.

Contient :

* appel assistant IA ;
* sauvegarde score ;
* leaderboard ;
* génération de débrief.

---

# 4. Découpage précis de la codebase

## Dossier `game/types`

Ce module définit tous les types du domaine.

Il doit décrire :

* état complet du jeu ;
* actifs énergétiques ;
* charges de consommation ;
* jobs IA ;
* événements ;
* actions ;
* métriques ;
* scoring ;
* messages assistant ;
* scénarios.

Objectif :

> donner un vocabulaire unique à toute la codebase.

Règle importante :

Aucun composant React ne doit inventer sa propre structure de données. Tout doit venir des types du jeu.

---

## Dossier `game/engine`

C’est le cœur.

Il contient le moteur qui fait avancer la simulation.

Sous-modules recommandés :

* `timeEngine`
* `productionEngine`
* `demandEngine`
* `aiWorkloadEngine`
* `batteryEngine`
* `gridStabilityEngine`
* `carbonEngine`
* `costEngine`
* `sovereigntyEngine`
* `satisfactionEngine`
* `scoreEngine`

Chaque sous-module fait une seule chose.

Exemple :

* le moteur de production calcule la production ;
* le moteur CO₂ calcule les émissions ;
* le moteur de score calcule le score ;
* le moteur IA gère les jobs IA.

Le moteur ne doit jamais afficher quoi que ce soit.

---

## Dossier `game/actions`

Ce module décrit les actions joueur.

Actions MVP :

* décaler un job IA ;
* réduire un modèle IA ;
* activer cache ;
* activer timeout agent ;
* décharger batterie ;
* importer énergie ;
* activer thermique ;
* lisser recharge EV ;
* effacement résidentiel léger ;
* prioriser services critiques.

Chaque action doit avoir :

* nom ;
* description ;
* cible ;
* conditions de disponibilité ;
* effets immédiats ;
* effets différés ;
* durée ;
* risques ;
* message de feedback ;
* impact estimé.

---

## Dossier `game/scenarios`

Contient les missions.

Pour le MVP :

* scénario tutoriel ;
* scénario “pic de 19h” ;
* scénario démo 3 minutes.

Un scénario doit contenir :

* heure de début ;
* heure de fin ;
* actifs initiaux ;
* jobs IA initiaux ;
* événements programmés ;
* objectifs ;
* seuils d’échec ;
* messages narratifs ;
* difficulté.

L’objectif est de pouvoir créer une nouvelle mission en modifiant seulement un fichier de scénario, pas le moteur.

---

## Dossier `game/events`

Contient la logique des événements.

Types d’événements :

* météo ;
* pic de demande ;
* job IA urgent ;
* anomalie agent ;
* baisse solaire ;
* hausse recharge EV ;
* tension réseau ;
* critique publique ;
* incident datacenter.

Ce module doit :

* vérifier quels événements doivent se déclencher ;
* appliquer leurs effets ;
* générer les alertes ;
* résoudre les événements si le joueur agit correctement.

---

## Dossier `game/advisor`

C’est l’assistant IA côté logique.

Il doit avoir deux parties.

### Partie déterministe

Elle analyse l’état du jeu et sort une recommandation structurée.

Exemple :

* risque : stabilité faible ;
* cause probable : pic EV + job IA non critique ;
* action conseillée : lisser EV + décaler job IA ;
* urgence : élevée.

### Partie génération naturelle

Elle transforme ça en message lisible :

> “La tension vient surtout du cumul recharge EV + job IA vidéo. Décaler ce job et lisser la recharge permettrait de passer le pic sans toucher aux services critiques.”

Important :

Le LLM ne doit pas prendre les décisions tout seul.
Il doit expliquer une décision calculée par le moteur.

---

## Dossier `components/game`

Composants spécifiques au jeu.

Composants principaux :

* `GameScreen`
* `GameHeader`
* `GridMap`
* `MetricPanel`
* `ActionPanel`
* `EventFeed`
* `AssistantPanel`
* `Timeline`
* `AssetInspector`
* `AIJobInspector`
* `EndGameModal`

Chaque composant lit l’état depuis le store et déclenche des actions.

---

## Dossier `components/map`

Composants de la carte.

Éléments :

* nœud de production ;
* nœud de consommation ;
* datacenter ;
* batterie ;
* ligne électrique ;
* flux animé ;
* alerte ;
* label ;
* halo de sélection.

Si SVG :

* chaque asset est un groupe SVG ;
* les lignes sont des paths ;
* les flux sont des animations sur les paths ;
* les alertes sont des cercles pulsants ;
* le clic sélectionne l’asset.

---

## Dossier `components/charts`

Graphiques.

Composants :

* production vs consommation ;
* mix énergétique ;
* stabilité ;
* charge IA ;
* batterie ;
* score final.

Tous ces composants doivent être purement visuels.
Ils ne calculent pas les métriques eux-mêmes. Ils reçoivent des données déjà préparées.

---

## Dossier `components/ui`

Composants basiques.

Exemples :

* bouton ;
* card ;
* badge ;
* jauge ;
* tooltip ;
* modal ;
* progress bar ;
* slider ;
* tabs.

---

## Dossier `store`

Contient le store global.

Responsabilités :

* état courant ;
* partie en pause ou non ;
* vitesse ;
* action sélectionnée ;
* asset sélectionné ;
* messages ;
* historique ;
* lancement tick ;
* dispatch action joueur.

Le store appelle le moteur de simulation, mais ne contient pas lui-même les calculs.

---

## Dossier `api` ou routes serveur

Si Next.js :

* route pour assistant IA ;
* route pour leaderboard ;
* route pour sauvegarde score ;
* route pour génération de débrief.

MVP :

* seule la route assistant IA est utile ;
* le leaderboard peut rester local.

---

# 5. Rendu visuel recommandé

## Carte centrale

Je ferais une carte 2D stylisée.

Composition :

* fond sombre ;
* grille fine ;
* zones semi-transparentes ;
* nœuds lumineux ;
* lignes animées ;
* flux d’énergie ;
* halos rouges lors des crises ;
* bleu électrique pour le datacenter IA.

La carte doit être plus proche d’un **radar / centre de commandement** que d’une carte géographique réaliste.

---

## Datacenter IA

Visuellement, le datacenter doit être très identifiable.

Éléments :

* icône serveur ;
* contour bleu ;
* charge en pourcentage ;
* mini-jauge “AI Load” ;
* alerte si agent en boucle ;
* clic pour ouvrir PromptWatt.

Quand la charge augmente :

* halo bleu plus intense ;
* lignes d’énergie plus épaisses ;
* jauge monte ;
* vibration légère ou pulse.

---

## Flux d’énergie

Les flux peuvent être représentés par :

* lignes entre production et consommateurs ;
* petites particules animées ;
* intensité de ligne proportionnelle à la puissance ;
* couleur selon état : stable, attention, surcharge.

En SVG, on peut faire :

* path entre deux nœuds ;
* animation de tirets ;
* stroke plus épais si puissance élevée ;
* halo en cas de surcharge.

Pas besoin de 3D pour que ce soit beau.

---

# 6. Game loop technique

## Principe

Le jeu doit utiliser une simulation à ticks fixes.

Exemple :

* 1 tick = 5 minutes simulées ;
* 1 tick toutes les 1,5 secondes en réel ;
* vitesse x1, x2, pause.

À chaque tick :

1. avancer heure simulée ;
2. mettre à jour météo ;
3. calculer production ;
4. calculer demande ;
5. mettre à jour jobs IA ;
6. appliquer actions actives ;
7. calculer stabilité ;
8. calculer CO₂ ;
9. calculer coût ;
10. calculer score ;
11. déclencher événements ;
12. générer recommandations ;
13. sauvegarder snapshot historique.

---

## Pourquoi ne pas faire du temps réel continu ?

Parce que :

* plus compliqué ;
* moins lisible ;
* plus difficile à équilibrer ;
* pas nécessaire pour un serious game.

Le tick fixe est parfait pour :

* déboguer ;
* tester ;
* rejouer ;
* expliquer ;
* équilibrer.

---

# 7. Assistant IA technique

## Architecture recommandée

L’assistant doit être en deux couches.

### Couche 1 — Advisor déterministe

Cette couche regarde l’état du jeu et produit des recommandations fiables.

Exemples de règles :

* si stabilité basse et job IA flexible actif : recommander report IA ;
* si batterie haute et déficit réseau : recommander décharge batterie ;
* si agent IA avec appels redondants : recommander cache ou timeout ;
* si CO₂ élevé à cause thermique : recommander alternative ;
* si souveraineté basse : limiter cloud externe ;
* si EV provoque pic : recommander recharge intelligente.

### Couche 2 — LLM

Le LLM sert seulement à rendre le message naturel.

Il reçoit :

* résumé de l’état ;
* recommandation ;
* action conseillée ;
* ton souhaité ;
* limite de longueur.

Il renvoie :

* titre ;
* explication courte ;
* raison ;
* impact attendu.

Important :

> Le LLM ne doit jamais modifier l’état du jeu directement.

---

## Fallback sans IA

Le jeu doit fonctionner même si l’API IA ne répond pas.

Dans ce cas :

* utiliser des messages pré-écrits ;
* garder les recommandations déterministes ;
* désactiver seulement la reformulation naturelle.

C’est crucial en démo.

---

# 8. Backend ou pas backend ?

## Pour le MVP

Backend minimal.

Avec Next.js, vous pouvez faire :

* frontend ;
* route assistant IA ;
* route leaderboard optionnelle.

Pas besoin de serveur complexe.

---

## Ce qui tourne côté client

* simulation ;
* état du jeu ;
* scénarios ;
* actions ;
* scoring ;
* rendu UI ;
* graphiques ;
* démo.

---

## Ce qui tourne côté serveur

* appel LLM ;
* sauvegarde leaderboard si nécessaire ;
* génération de débrief si vous voulez.

---

# 9. Base de données

## MVP

Pas de vraie base de données obligatoire.

Utiliser :

* scénarios statiques ;
* localStorage pour dernier score ;
* leaderboard local ou JSON mocké.

## Version plus avancée

Utiliser Supabase ou SQLite/PostgreSQL.

Tables possibles :

* runs ;
* scores ;
* teams ;
* actions ;
* scenario_results.

Mais pour un hackathon, ne commence pas par ça.

---

# 10. Choix technique final recommandé

Voici la stack que je choisirais vraiment :

## Frontend

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui**
* **Zustand**
* **Recharts**
* **SVG pour la carte**
* **Framer Motion ou animations CSS pour les effets**
* **Zod pour valider les scénarios**

## Backend

* **API routes Next.js**
* assistant IA optionnel ;
* leaderboard optionnel.

## Données

* scénarios en JSON/TypeScript ;
* données simulées ;
* pas de dépendance à une API externe pour la démo.

## Rendu jeu

* carte 2D/2.5D en SVG ;
* flux animés ;
* dashboards React ;
* pas de Three.js obligatoire.

---

# 11. Variante “plus waouh” avec Three.js

Si vous avez du temps ou quelqu’un qui maîtrise, la version premium serait :

* React + Next.js pour l’app ;
* React Three Fiber pour la carte centrale ;
* caméra orthographique ;
* carte isométrique ;
* datacenter, hôpital, batteries en petits objets 3D ;
* lignes lumineuses ;
* particules ;
* interface React classique par-dessus.

Mais il faut garder cette règle :

> **Three.js ne doit afficher que la scène. La logique du jeu reste dans le moteur TypeScript.**

La scène 3D reçoit simplement :

* liste d’assets ;
* positions ;
* état ;
* puissance ;
* alertes ;
* asset sélectionné.

Elle ne calcule rien.

---

# 12. Ce que je ne recommande pas

## Unity

Pas idéal pour un hackathon web/data/IA.

Trop lourd pour :

* dashboards ;
* graphiques ;
* intégration LLM ;
* déploiement web rapide.

## Godot

Très cool, mais pas optimal ici.

Le jeu est plus proche d’un dashboard interactif que d’un jeu d’action.

## Phaser

Possible pour un jeu 2D, mais moins pratique pour l’interface dashboard.

Phaser devient intéressant si tu veux faire un vrai jeu 2D avec sprites, mais Grid Defender a besoin de beaucoup de panels, graphes et interactions UI. React est plus adapté.

## D3 pur

Trop long pour le MVP.

## Full Three.js

Trop risqué sauf si quelqu’un maîtrise très bien.

---

# 13. Architecture de rendu idéale

Je ferais trois couches visuelles.

## Couche 1 — Background

* fond sombre ;
* grille ;
* ambiance cyber ;
* éventuellement Canvas avec particules très légères.

## Couche 2 — Carte SVG

* nœuds ;
* lignes ;
* flux ;
* alertes ;
* sélection ;
* labels.

## Couche 3 — UI React

* jauges ;
* panneaux ;
* timeline ;
* assistant IA ;
* boutons d’action ;
* graphiques.

Cette architecture donne un rendu riche sans complexité excessive.

---

# 14. Données techniques des scénarios

Les scénarios doivent être déclaratifs.

Un scénario doit définir :

* durée ;
* assets initiaux ;
* météo ;
* production initiale ;
* consommation initiale ;
* jobs IA ;
* événements ;
* objectifs ;
* textes narratifs.

L’objectif est qu’un non-développeur puisse presque modifier la mission sans toucher au moteur.

Exemple conceptuel de mission :

* début : 17h30 ;
* fin : 20h30 ;
* solaire en baisse ;
* batterie à 65 % ;
* pic EV à 18h ;
* job IA vidéo à 18h30 ;
* job cyber critique à 19h10 ;
* agent en boucle à 19h30 ;
* objectif : stabilité > 50, services critiques OK.

---

# 15. Tests techniques importants

Il faut tester surtout le moteur, pas l’interface.

Tests à prévoir :

* une mission se termine sans crash ;
* stabilité baisse si demande > production ;
* batterie se vide quand on la décharge ;
* job IA reporté ne consomme plus immédiatement ;
* cache réduit les appels redondants ;
* timeout arrête l’agent en boucle ;
* thermique augmente CO₂ ;
* import baisse souveraineté ;
* score final reste entre 0 et 1000 ;
* aucune jauge ne sort de 0 à 100.

Même en hackathon, quelques tests sur le moteur peuvent éviter une démo cassée.

---

# 16. Plan technique de réalisation en hackathon

## Première demi-journée

Objectif : squelette jouable.

À faire :

* créer projet Next.js ;
* config Tailwind ;
* créer layout jeu ;
* créer store Zustand ;
* créer types principaux ;
* charger un scénario mock ;
* afficher carte statique ;
* afficher jauges mockées.

---

## Deuxième demi-journée

Objectif : simulation.

À faire :

* moteur de tick ;
* production/demande ;
* stabilité ;
* batteries ;
* jobs IA ;
* premières actions ;
* événements simples.

À la fin, le jeu doit déjà bouger.

---

## Troisième demi-journée

Objectif : gameplay.

À faire :

* mission “pic de 19h” ;
* actions joueur ;
* événements IA ;
* assistant déterministe ;
* feedback ;
* graphiques.

---

## Dernière demi-journée

Objectif : démo.

À faire :

* polish visuel ;
* écran de fin ;
* débrief ;
* mode reset ;
* script de démo ;
* fallback si API IA KO ;
* correction bugs.

---

# 17. Décision finale

Pour ton projet, je choisirais :

## **Next.js + React + TypeScript + Zustand + Tailwind + Recharts + SVG**

Et je dirais explicitement :

> **Nous avons choisi de ne pas faire un jeu full Three.js, parce que Grid Defender est d’abord une expérience de supervision stratégique et de data visualisation. La priorité est la clarté des arbitrages énergie/IA/réseau. La carte est donc en 2D/2.5D interactive, avec des flux animés et une interface cockpit. Three.js pourra être ajouté ensuite comme couche visuelle premium, mais pas comme cœur technique.**

C’est une décision mature. Ça montre que tu sais faire un choix technique adapté au produit, pas juste choisir la techno la plus flashy.


Oui. Là, avec ce que tu viens de dire, **je changerais clairement de direction**.

Avant, je te conseillais d’éviter Three.js parce que je pensais que l’objectif prioritaire était un MVP lisible, rapide, orienté dashboard. Mais là, ton besoin réel est différent : tu veux une app qui impressionne visuellement, qui donne l’impression d’un **centre de commandement énergétique**, avec une **carte de France**, des **lignes haute tension**, des **flux**, des **zones qui chauffent**, des **datacenters IA**, des **points de production/consommation**, et une vraie sensation de contrôle stratégique.

Donc oui : **il faut utiliser Three.js**, mais intelligemment, via **React Three Fiber**, parce que ton projet est déjà en React/Next.

---

# Diagnostic rapide du code actuel

Le projet actuel est techniquement propre dans l’intention, mais il ne correspond pas au produit que tu veux présenter.

Le repo est aujourd’hui sur une stack **Next.js + React + TypeScript + Zustand + Recharts + lucide-react**, sans dépendance Three.js, React Three Fiber, Drei ou postprocessing. C’est donc structurellement une app dashboard React, pas une expérience 3D immersive.

Le cœur de l’app est très simple : `GameShell` affiche soit l’écran de départ, soit le cockpit, soit les résultats, et fait avancer la simulation avec un `setInterval` toutes les `1350 / speed` ms. C’est correct pour une simulation tick-by-tick, mais ce n’est pas une vraie boucle visuelle 3D/caméra/interaction spatiale.

Le modèle de données actuel a déjà de bonnes bases : `EnergyAsset`, `AIJob`, `Scenario`, `GameMetrics`, `GameState`, etc. Mais `EnergyAsset` se contente d’une position `{ x, y }`, d’une puissance, d’un statut et d’une catégorie. Il n’y a pas de vraie notion de **nœud réseau**, **ligne haute tension**, **capacité de ligne**, **flux régional**, **surcharge locale**, **connexion entre entreprises**, ou **graphe électrique spatial**.

Le problème principal est dans la carte : `GridMap` est une carte SVG abstraite, avec un hub central `{ x: 50, y: 52 }`, puis chaque asset est relié au hub par une courbe calculée automatiquement. Ce n’est donc pas une carte de France, ni un réseau haute tension, ni une topologie crédible ; c’est un radar stylisé avec des icônes reliées à un centre.

Le gameplay actuel est aussi trop “boutons globaux”. Le `ActionPanel` affiche des actions génériques et appelle seulement `applyAction(action.type)`, sans cible précise sélectionnée par le joueur. Autrement dit, le joueur ne choisit pas vraiment “je clique sur cette ligne rouge” ou “je décale ce datacenter-là” ; il clique sur un bouton global.

Exemple très parlant : l’action “Décaler job IA” choisit automatiquement le job non critique le plus lourd et le reporte. Le joueur ne prend donc pas une décision spatiale ou stratégique fine ; il déclenche une règle automatique.

Enfin, la simulation est encore très centralisée et très scriptée : la production est calculée avec des constantes comme nucléaire, solaire, vent, hydraulique, batterie, import, thermique ; la demande est calculée par grands blocs résidentiel, industrie, hôpital, événement, EV, IA. C’est acceptable pour un MVP, mais ce n’est pas encore un jeu de réseau électrique spatial.

Conclusion : **ce n’est pas de la merde techniquement, mais c’est le mauvais produit visuel**. C’est un cockpit dashboard 2D. Toi, tu veux un **jeu de supervision 3D sur carte de France**.

---

# Nouvelle direction produit

Le nouveau concept doit être :

# **Grid Defender — France Energy Command Center**

Pitch :

> **Grid Defender est une application 3D de commandement énergétique où le joueur pilote une carte de France stylisée, observe les lignes haute tension qui se chargent en temps réel, anticipe les pics de consommation, orchestre les datacenters IA et prend des décisions pour éviter la saturation du réseau.**

L’écran principal ne doit plus ressembler à un dashboard avec une carte au milieu.

Il doit ressembler à ça :

> Une carte 3D de la France en plein écran, sombre, lumineuse, cyber-énergie, avec des lignes haute tension animées. Les lignes deviennent vertes, orange ou rouges selon leur charge. Les centrales, datacenters, villes, industries, batteries et hôpitaux sont des objets 3D cliquables. Quand un pic arrive, la caméra se déplace, une zone s’allume, une ligne surchauffe, et le joueur doit agir directement sur la carte.

C’est ça qui peut donner un effet “wow”.

---

# Stack technique cible

Tu dois garder :

* **Next.js**
* **React**
* **TypeScript**
* **Zustand**
* **Tailwind**
* **Recharts**, mais seulement pour les petits graphiques secondaires

Tu dois ajouter :

* **three**
* **@react-three/fiber**
* **@react-three/drei**
* **@react-three/postprocessing**
* éventuellement **framer-motion**
* éventuellement **zod**
* éventuellement **d3-geo** ou un asset GeoJSON/TopoJSON simplifié de la France

React Three Fiber est le bon choix parce que c’est un renderer React pour Three.js, donc tu peux construire une scène Three.js en composants React tout en gardant Zustand et ton architecture existante. La doc officielle indique aussi que l’installation se fait avec `three` et `@react-three/fiber`. ([Poimandres][1])

Point important : ton repo est déjà en React 19, et la doc React Three Fiber précise que `@react-three/fiber@9` correspond à React 19, alors que `@react-three/fiber@8` correspond à React 18.  ([Poimandres][2])

Avec Next.js, la doc R3F indique que ça peut fonctionner directement, mais qu’il faut parfois ajouter `three` dans `transpilePackages` dans `next.config.js` pour éviter les soucis liés aux add-ons Three.js non transpilés. ([Poimandres][2])

Drei et Postprocessing sont aussi cohérents : la doc R3F liste `@react-three/drei` comme bibliothèque d’helpers utile, et `@react-three/postprocessing` pour les effets visuels. ([Poimandres][1])

---

# Ce qu’il faut garder du projet actuel

Il ne faut pas tout jeter.

À garder :

* le principe de simulation par ticks ;
* le store Zustand ;
* les types de base ;
* les jobs IA ;
* les événements scénarisés ;
* les métriques : stabilité, CO₂, coût, souveraineté, productivité IA ;
* l’idée d’assistant ATHENA ;
* l’idée du scénario “pic de 19h”.

À remplacer :

* la carte SVG ;
* le layout cockpit trop dashboard ;
* les actions globales sans cible ;
* les positions abstraites `{ x, y }` ;
* le hub central artificiel ;
* le système de lignes qui relie tout au centre ;
* le gameplay “je clique sur un bouton et le jeu choisit pour moi”.

Le nouveau jeu doit être **spatial** : le joueur voit un problème sur la carte, clique dessus, comprend la cause, puis agit localement.

---

# Nouvelle architecture globale

## 1. Couche 3D

Créer une vraie scène 3D en plein écran.

Nouveau module :

```txt
src/features/map3d/
```

Sous-modules à prévoir :

```txt
src/features/map3d/FranceGridCanvas
src/features/map3d/scene/FranceTerrain
src/features/map3d/scene/TransmissionNetwork
src/features/map3d/scene/EnergyNode
src/features/map3d/scene/EnergyNodeInstances
src/features/map3d/scene/TransmissionLine
src/features/map3d/scene/FlowParticles
src/features/map3d/scene/CameraRig
src/features/map3d/scene/SelectionLayer
src/features/map3d/scene/CrisisEffects
src/features/map3d/scene/LabelsLayer
```

Le composant principal ne doit pas calculer la logique du jeu. Il doit seulement afficher l’état du store.

---

## 2. Couche HUD

Créer une interface par-dessus la carte.

Nouveau module :

```txt
src/features/hud/
```

Composants :

```txt
CommandTopBar
MissionBrief
SelectedEntityInspector
ContextualActionWheel
CrisisFeed
MiniTimeline
MetricStrip
AIAssistantOverlay
BottomEventRail
```

L’interface doit être plus légère que le dashboard actuel. La carte doit occuper 70 à 85 % de l’écran.

---

## 3. Couche simulation

Refactoriser le moteur actuel en vrai graphe réseau.

Nouveaux modules :

```txt
src/game/network/
```

Sous-modules :

```txt
networkTypes
networkState
powerBalanceEngine
flowSolver
lineStatusEngine
regionalDemandEngine
aiWorkloadScheduler
incidentEngine
actionResolver
scoreEngine
```

Objectif : passer d’un calcul global production/demande à un calcul spatial par nœuds et lignes.

---

# Nouveau modèle de données

Il faut ajouter trois entités centrales.

## 1. `GridNode`

Un nœud représente un point sur la carte.

Exemples :

* centrale nucléaire ;
* parc éolien ;
* parc solaire ;
* batterie ;
* datacenter IA ;
* hôpital ;
* zone industrielle ;
* grande ville ;
* nœud d’interconnexion.

Champs nécessaires :

```txt
id
label
kind
region
lat
lon
position3D
productionMw
demandMw
maxProductionMw
maxDemandMw
flexibilityMw
criticality
status
selected
connectedLineIds
aiWorkloadIds
description
```

---

## 2. `TransmissionLine`

Une ligne représente une liaison haute tension.

Champs nécessaires :

```txt
id
label
fromNodeId
toNodeId
voltageKv
capacityMw
currentFlowMw
utilizationRatio
status
path
isControllable
isCritical
overloadDuration
incidentIds
```

Statuts :

```txt
stable
loaded
overloaded
critical
offline
```

Couleurs :

```txt
0-70 %       vert / cyan
70-90 %      jaune
90-110 %     orange / rouge
110 %+       rouge intense avec pulse
offline      gris
```

---

## 3. `AIWorkload`

Un job IA doit être attaché à un datacenter précis.

Champs :

```txt
id
datacenterNodeId
name
kind
criticality
powerMw
durationMinutes
deadlineMinute
flexibility
status
progress
modelTier
canBeDeferred
canBeReduced
canUseCache
canBeExternalized
sovereigntyImpact
energySavedMw
description
```

Cela permet enfin de faire le lien entre :

* géographie ;
* datacenter ;
* ligne haute tension locale ;
* surcharge ;
* décision IA.

---

# Nouveau gameplay

Le joueur ne doit plus cliquer sur des boutons globaux.

Le joueur doit faire ceci :

1. Voir une ligne haute tension devenir orange puis rouge.
2. Cliquer sur cette ligne.
3. Voir pourquoi elle est en surcharge.
4. Voir les nœuds responsables : par exemple Paris, datacenter IA Paris-Saclay, recharge EV Île-de-France.
5. Choisir une action contextuelle.
6. Voir la ligne refroidir visuellement.
7. Voir le score évoluer.

Exemple concret :

Une ligne **Normandie → Île-de-France** devient rouge.

Le joueur clique.

Le panneau affiche :

```txt
Ligne Normandie → Île-de-France
Charge : 112 %
Capacité : 850 MW
Flux actuel : 952 MW
Cause principale :
- demande résidentielle Île-de-France +180 MW
- datacenter IA Paris-Saclay +90 MW
- recharge EV +120 MW
Actions possibles :
- Décaler batch IA non critique
- Activer batterie locale
- Lisser recharge EV
- Importer via interconnexion nord
- Lancer secours thermique
```

Le joueur choisit :

> Décaler batch IA non critique.

Effet visuel :

* le datacenter bleu baisse d’intensité ;
* les particules sur la ligne ralentissent ;
* la ligne passe de rouge à orange puis vert ;
* ATHENA explique l’action.

C’est beaucoup plus satisfaisant.

---

# Direction visuelle précise

L’écran principal doit être un **war room énergétique**.

## Carte de France

La France doit être :

* vue du dessus ou en 2.5D ;
* légèrement extrudée ;
* sombre ;
* avec contours lumineux ;
* éventuellement découpée en régions énergétiques ;
* posée sur un fond noir/grille.

Pas besoin d’une carte géographique ultra réaliste au départ. Une silhouette stylisée très propre suffit.

---

## Lignes haute tension

Les lignes doivent être le cœur visuel.

Chaque ligne doit avoir :

* une courbe 3D ;
* une épaisseur proportionnelle au flux ;
* une couleur proportionnelle à la charge ;
* des particules animées ;
* un halo lumineux ;
* un effet de pulse rouge en surcharge ;
* un label au hover/clic.

C’est l’élément qui doit donner le “waouh”.

---

## Nœuds

Chaque nœud doit être identifiable visuellement.

Exemples :

* nucléaire : tour/cylindre lumineux vert ;
* solaire : plaque dorée ;
* éolien : petite turbine stylisée ;
* batterie : bloc violet ;
* datacenter IA : cube bleu avec lignes internes ;
* hôpital : croix rouge/blanche ;
* industrie : usine ;
* ville : cluster de bâtiments ;
* EV : station/borne.

Même si les assets sont simples géométriquement, ils doivent avoir une vraie identité visuelle.

---

## Caméra

La caméra doit rendre l’app immédiatement plus impressionnante.

Comportements :

* fly-in au lancement ;
* zoom automatique vers la première crise ;
* focus sur une ligne sélectionnée ;
* rotation lente en mode idle ;
* mode “overview” pour revenir à toute la France ;
* shake léger lors d’une crise réseau ;
* travelling vers le datacenter IA quand un job critique arrive.

---

# Structure d’écran cible

## Ancien écran

Dashboard en grille :

```txt
Mission
Timeline
Carte 2D
Graphiques
Actions
Assistant
Jobs IA
```

## Nouvel écran

Expérience 3D plein écran :

```txt
[HUD haut : heure, score, stabilité, CO₂, souveraineté, IA]
[Carte de France 3D plein écran avec lignes haute tension]
[Panneau contextuel à droite seulement si un élément est sélectionné]
[Timeline événementielle en bas]
[Assistant ATHENA en overlay court, pas gros chatbot]
[Action wheel contextuelle près du nœud/ligne sélectionné]
```

Le dashboard ne doit plus dominer. La carte doit dominer.

---

# Architecture technique détaillée

## `FranceGridCanvas`

Responsabilité :

* créer le `<Canvas>` React Three Fiber ;
* gérer la caméra ;
* charger les assets ;
* afficher la scène ;
* connecter Zustand à la scène.

Doit contenir :

* lumière ambiante ;
* lumière directionnelle ;
* fog léger ;
* postprocessing bloom ;
* caméra orthographique ou perspective contrôlée ;
* fallback loading.

Décision recommandée :

> Caméra orthographique pour une carte stratégique lisible, avec léger angle 2.5D.

---

## `FranceTerrain`

Responsabilité :

* afficher la France.

MVP rapide :

* utiliser une silhouette de France simplifiée ;
* la convertir en forme 3D ou l’afficher comme mesh plat texturé ;
* ajouter un contour lumineux.

Version plus avancée :

* charger un GeoJSON de la France ;
* projeter les coordonnées ;
* créer des shapes Three.js ;
* extruder légèrement les régions.

---

## `TransmissionNetwork`

Responsabilité :

* afficher toutes les lignes haute tension.

Il reçoit :

```txt
lines
nodes
selectedLineId
hoveredLineId
```

Il affiche :

* chaque ligne ;
* couleur selon charge ;
* particules selon flux ;
* effet rouge si surcharge ;
* événements pointer over / click.

---

## `TransmissionLine`

Responsabilité :

* afficher une seule ligne.

Entrées :

```txt
fromPosition
toPosition
pathControlPoints
flowMw
capacityMw
utilizationRatio
status
selected
```

Rendu :

* courbe 3D ;
* matériau emissive ;
* épaisseur dynamique ;
* animation de flux ;
* halo en surcharge.

Important :

La ligne doit être cliquable facilement. Il faut prévoir une hitbox invisible plus large que la ligne visible.

---

## `FlowParticles`

Responsabilité :

* afficher les flux d’énergie.

Approche MVP :

* petites sphères ou sprites qui se déplacent le long d’une courbe ;
* vitesse proportionnelle au flux ;
* couleur liée au type de source ou à la charge ;
* nombre de particules limité.

Approche performance :

* instancing ;
* pas un composant React par particule ;
* calcul position dans `useFrame`.

---

## `EnergyNode`

Responsabilité :

* afficher un point de production/consommation.

Entrées :

```txt
node
status
productionMw
demandMw
selected
```

Rendu :

* mesh simple ;
* halo ;
* label ;
* jauge verticale ;
* icône ou géométrie spécifique.

Interactions :

* hover ;
* click ;
* focus caméra ;
* ouverture panneau inspecteur.

---

## `CameraRig`

Responsabilité :

* gérer les mouvements caméra.

Fonctions :

* overview France ;
* focus node ;
* focus line ;
* crisis zoom ;
* idle rotation ;
* reset view.

Le store ne doit pas manipuler directement la caméra. Il doit seulement dire :

```txt
cameraTarget = { type: "line", id: "line-normandie-paris" }
```

Puis `CameraRig` anime.

---

## `SelectionLayer`

Responsabilité :

* gérer l’état hover/selected.

L’utilisateur peut sélectionner :

```txt
node
line
aiWorkload
region
incident
```

Le store doit remplacer :

```txt
selectedAssetId
selectedJobId
```

par :

```txt
selectedEntity:
  kind: "node" | "line" | "workload" | "incident"
  id: string
```

C’est beaucoup plus extensible.

---

## `SelectedEntityInspector`

Responsabilité :

* afficher le détail de ce qui est sélectionné.

Si c’est une ligne :

* capacité ;
* flux ;
* charge ;
* risque ;
* cause de surcharge ;
* actions disponibles.

Si c’est un datacenter :

* jobs IA ;
* puissance ;
* flexibilité ;
* deadlines ;
* souveraineté ;
* actions IA.

Si c’est une ville :

* demande ;
* EV ;
* satisfaction ;
* flexibilité.

Si c’est une centrale :

* production ;
* disponibilité ;
* coût ;
* carbone ;
* ramp-up.

---

## `ContextualActionWheel`

Responsabilité :

* afficher des actions adaptées à la sélection.

Exemple pour une ligne rouge :

```txt
Rerouter flux
Activer batterie régionale
Décaler job IA responsable
Lisser recharge EV
Importer énergie
Secours thermique
```

Exemple pour un datacenter :

```txt
Décaler batch non critique
Réduire modèle
Activer cache
Timeout agent
Prioriser cyber
Externaliser non critique
```

Exemple pour une ville :

```txt
Lisser EV
Effacement léger
Prioriser hôpital
Réduire événement public
```

Le gameplay devient enfin compréhensible et tangible.

---

# Nouveau moteur réseau

Le moteur actuel calcule seulement une production totale et une demande totale. Il faut passer à un graphe.

## Étape 1 — calcul par nœud

À chaque tick :

* chaque nœud calcule sa production ;
* chaque nœud calcule sa demande ;
* chaque nœud calcule son solde local.

```txt
balanceMw = productionMw - demandMw
```

Un nœud avec balance positive est une source.
Un nœud avec balance négative est un puits.

---

## Étape 2 — routage simplifié

MVP recommandé :

* identifier les nœuds en surplus ;
* identifier les nœuds en déficit ;
* router le surplus vers les déficits via les chemins les plus courts ;
* accumuler les flux sur les lignes ;
* calculer le taux de charge des lignes.

Pas besoin de faire un vrai calcul électrique physique au départ. Il faut une simulation compréhensible et stable.

---

## Étape 3 — surcharge

Pour chaque ligne :

```txt
utilizationRatio = abs(currentFlowMw) / capacityMw
```

Effets :

* si utilisation < 70 % : stable ;
* 70-90 % : chargée ;
* 90-110 % : surchargée ;
* > 110 % : critique ;
* surcharge prolongée : incident ;
* incident prolongé : baisse stabilité.

---

## Étape 4 — impacts gameplay

Une ligne surchargée :

* devient rouge ;
* pulse ;
* augmente le risque de stabilité ;
* peut réduire la continuité des services ;
* déclenche ATHENA ;
* débloque des actions contextuelles.

---

# Nouveau scénario MVP

## Mission : “France sous tension — pic de 19h”

Durée réelle : 4 à 5 minutes.

Carte :

* France entière visible ;
* 10 à 14 nœuds ;
* 12 à 18 lignes ;
* 2 datacenters IA ;
* 1 hôpital critique ;
* 2 zones résidentielles ;
* 1 zone industrielle ;
* 1 zone EV ;
* batteries ;
* production bas carbone.

Nœuds recommandés, fictifs mais plausibles :

```txt
Nord Production
Normandie Production
Atlantique Éolien
Sud-Ouest Solaire
Rhône Production
Paris-Saclay Datacenter IA
Lyon Industrie
Marseille Consommation
Toulouse Industrie
Nantes/Bordeaux Résidentiel + EV
Hôpital Île-de-France
Batterie Centre
Interconnexion Nord
```

Événements :

1. **18h00 — recharge EV massive Ouest/Sud-Ouest**
2. **18h30 — datacenter IA Paris-Saclay lance génération vidéo**
3. **18h50 — chute solaire**
4. **19h05 — ligne Normandie → Paris à 108 %**
5. **19h10 — job cyber critique arrive**
6. **19h30 — agent IA en boucle**
7. **20h00 — débrief**

La démo doit absolument contenir une ligne qui passe au rouge et que le joueur peut faire repasser à l’orange/vert.

---

# Prompt clair à donner au développeur / à l’agent de code

Tu peux copier-coller ceci :

---

## PROMPT DE CHANGEMENT DE DIRECTION

Nous devons pivoter radicalement le projet Grid Defender.

Le projet actuel est trop proche d’un dashboard 2D. Il faut transformer l’application en expérience visuelle impressionnante de type **France Energy Command Center**.

Objectif produit : créer un jeu/simulateur 3D où l’utilisateur pilote une carte de France stylisée avec des lignes haute tension animées. Les lignes deviennent vertes, oranges ou rouges selon leur charge. Les centrales, villes, batteries, hôpitaux, industries et datacenters IA sont des nœuds cliquables. Le joueur doit résoudre des surcharges réseau en agissant localement : décaler des jobs IA, lisser la recharge EV, activer des batteries, rerouter des flux, importer de l’énergie ou lancer une production de secours.

Important : l’application doit être impressionnante visuellement. La carte 3D doit dominer l’écran. Les panneaux dashboard doivent devenir secondaires.

### Stack à utiliser

Conserver :

* Next.js
* React
* TypeScript
* Zustand
* Tailwind
* Recharts pour les petits graphiques uniquement

Ajouter :

* three
* @react-three/fiber, version compatible React 19
* @react-three/drei
* @react-three/postprocessing
* framer-motion optionnel
* zod optionnel pour valider les scénarios
* d3-geo ou un asset GeoJSON simplifié pour projeter la France

Le Canvas Three.js doit être encapsulé dans un composant client. La logique de simulation ne doit jamais dépendre de Three.js. Three.js affiche l’état ; il ne calcule pas le jeu.

### Ce qu’il faut supprimer ou remplacer

Remplacer complètement `src/components/map/GridMap.tsx`.

Ne plus utiliser une carte SVG abstraite avec un hub central. Ne plus relier tous les assets vers un point central. Ne plus afficher une simple carte radar.

Remplacer le système d’actions globales. Les actions doivent devenir contextuelles : elles dépendent de l’élément sélectionné sur la carte.

Remplacer `selectedAssetId` et `selectedJobId` par un système plus général :

* sélection d’un nœud ;
* sélection d’une ligne ;
* sélection d’un job IA ;
* sélection d’un incident.

### Nouvelle structure à créer

Créer :

```txt
src/features/map3d/
src/features/map3d/FranceGridCanvas.tsx
src/features/map3d/scene/FranceTerrain.tsx
src/features/map3d/scene/TransmissionNetwork.tsx
src/features/map3d/scene/TransmissionLine.tsx
src/features/map3d/scene/FlowParticles.tsx
src/features/map3d/scene/EnergyNode.tsx
src/features/map3d/scene/CameraRig.tsx
src/features/map3d/scene/CrisisEffects.tsx
src/features/map3d/scene/LabelsLayer.tsx
```

Créer aussi :

```txt
src/features/hud/
src/features/hud/CommandTopBar.tsx
src/features/hud/SelectedEntityInspector.tsx
src/features/hud/ContextualActionWheel.tsx
src/features/hud/CrisisFeed.tsx
src/features/hud/BottomTimeline.tsx
src/features/hud/AIAssistantOverlay.tsx
```

Refactoriser le domaine jeu :

```txt
src/game/network/
src/game/network/networkTypes.ts
src/game/network/powerBalanceEngine.ts
src/game/network/flowSolver.ts
src/game/network/lineStatusEngine.ts
src/game/network/actionResolver.ts
src/game/network/incidentEngine.ts
```

### Nouveau modèle de données

Ajouter `GridNode` :

* id
* label
* kind
* region
* lat
* lon
* position3D
* productionMw
* demandMw
* maxProductionMw
* maxDemandMw
* flexibilityMw
* criticality
* status
* connectedLineIds
* aiWorkloadIds
* description

Ajouter `TransmissionLine` :

* id
* label
* fromNodeId
* toNodeId
* voltageKv
* capacityMw
* currentFlowMw
* utilizationRatio
* status
* path
* isControllable
* isCritical
* overloadDuration
* incidentIds

Ajouter `AIWorkload` attaché à un datacenter :

* id
* datacenterNodeId
* name
* kind
* criticality
* powerMw
* durationMinutes
* deadlineMinute
* flexibility
* status
* progress
* modelTier
* canBeDeferred
* canBeReduced
* canUseCache
* canBeExternalized
* sovereigntyImpact
* description

### Rendu 3D attendu

L’écran doit montrer une carte de France en 2.5D, sombre, avec contours lumineux. Sur cette carte, afficher des nœuds énergétiques et des lignes haute tension.

Les lignes doivent :

* être des courbes 3D ;
* avoir une couleur liée à leur charge ;
* avoir des particules animées dans le sens du flux ;
* devenir rouges en surcharge ;
* pulser en cas de crise ;
* être cliquables avec une hitbox large.

Les nœuds doivent :

* être cliquables ;
* avoir une identité visuelle selon leur type ;
* changer d’intensité selon leur production/demande ;
* afficher un label court ;
* ouvrir un panneau de détail au clic.

Le datacenter IA doit être visuellement spécial : cube bleu/cyan, halo, flux numérique, intensité liée à la charge IA.

### Gameplay attendu

Le joueur doit pouvoir :

1. Observer une ligne qui devient rouge.
2. Cliquer sur cette ligne.
3. Voir la cause de surcharge.
4. Voir les nœuds responsables.
5. Choisir une action contextuelle.
6. Voir l’impact visuel immédiatement.

Exemple :

La ligne Normandie → Paris passe à 112 %.

Le joueur clique.

Le panneau affiche :

* flux actuel ;
* capacité ;
* surcharge ;
* cause : recharge EV + datacenter IA + baisse solaire ;
* actions disponibles.

Le joueur choisit “Décaler batch IA non critique”.

Effet :

* charge du datacenter baisse ;
* flux de la ligne diminue ;
* ligne passe rouge → orange ;
* ATHENA explique l’action.

### Simulation MVP

À chaque tick :

1. Mettre à jour l’heure.
2. Mettre à jour production et demande de chaque nœud.
3. Mettre à jour les jobs IA.
4. Calculer le solde local de chaque nœud.
5. Router les flux entre nœuds en surplus et nœuds en déficit.
6. Calculer la charge de chaque ligne.
7. Mettre à jour les couleurs/statuts.
8. Appliquer les incidents.
9. Calculer les scores.
10. Générer les conseils ATHENA.

Pour le MVP, le flow solver peut être heuristique. Pas besoin d’un vrai modèle électrique physique. L’objectif est une simulation crédible, visuelle et jouable.

### Scénario MVP

Créer une mission “France sous tension — pic de 19h”.

Elle doit contenir :

* une carte de France ;
* 10 à 14 nœuds ;
* 12 à 18 lignes ;
* au moins deux datacenters IA ;
* au moins une ligne qui passe au rouge ;
* au moins un job IA flexible ;
* au moins un job cyber critique ;
* au moins un agent IA en boucle ;
* au moins une action qui fait visiblement baisser la surcharge.

Événements :

* recharge EV massive ;
* job IA vidéo non critique ;
* chute solaire ;
* surcharge ligne Normandie → Paris ;
* job cyber critique ;
* agent IA en boucle.

### UX cible

La carte 3D occupe presque tout l’écran.

HUD minimal :

* haut : heure, score, stabilité, CO₂, souveraineté, productivité IA ;
* droite : inspecteur de l’élément sélectionné ;
* bas : timeline d’événements ;
* overlay court : conseils ATHENA ;
* action wheel près de la sélection.

Ne pas refaire un dashboard plein de cartes. La carte doit être l’expérience principale.

### Critères d’acceptation

Le résultat est réussi si :

* en ouvrant l’app, on voit immédiatement une carte de France 3D impressionnante ;
* les lignes haute tension sont visibles et animées ;
* au moins une ligne passe au rouge pendant la mission ;
* le joueur peut cliquer sur cette ligne ;
* le joueur comprend pourquoi elle est rouge ;
* le joueur peut agir sur un datacenter IA ou une zone EV ;
* l’action change visiblement la couleur ou l’intensité des lignes ;
* le jeu conserve stabilité, CO₂, coût, souveraineté et productivité IA ;
* le jeu reste jouable même sans backend IA ;
* la démo tient en 3 à 5 minutes.

Priorité absolue : effet visuel, clarté du gameplay, carte 3D, actions contextuelles.
Priorité secondaire : exhaustivité de la simulation.

---

# Plan de réalisation concret

## Étape 1 — Ne pas casser le moteur actuel

Garder le store et le moteur actuel comme base temporaire.

Objectif immédiat :

* intégrer React Three Fiber ;
* créer une carte France statique ;
* afficher des nœuds ;
* afficher des lignes.

Même si la simulation n’est pas encore refactorisée, il faut très vite obtenir le “wow visual”.

---

## Étape 2 — Remplacer la carte SVG

Le fichier actuel `GridMap.tsx` doit être remplacé dans le cockpit par un composant du type :

```txt
FranceGridCanvas
```

Visuellement, le jeu doit déjà changer complètement.

La carte 2D actuelle n’est pas suffisante : elle repose sur un SVG avec lignes, hub central, icônes lucide et animations CSS.

---

## Étape 3 — Ajouter les vraies lignes

Créer 12 à 18 lignes entre nœuds.

Chaque ligne doit avoir :

* capacité ;
* flux ;
* pourcentage de charge ;
* couleur ;
* particules ;
* sélection.

Même avec des données fictives, l’effet sera beaucoup plus fort.

---

## Étape 4 — Rendre les actions contextuelles

Actuellement, les actions sont globales. Il faut changer ça.

Nouveau principe :

* si aucune sélection : afficher actions globales limitées ;
* si ligne sélectionnée : afficher actions réseau ;
* si datacenter sélectionné : afficher actions IA ;
* si ville/EV sélectionnée : afficher actions demande ;
* si batterie sélectionnée : afficher actions stockage.

C’est ce changement qui va améliorer le gameplay.

---

## Étape 5 — Refaire le scénario autour d’une surcharge visible

Le scénario doit être écrit pour produire un moment spectaculaire :

> “La ligne Normandie → Paris passe à 112 % pendant que Paris-Saclay lance un job IA non critique et que la recharge EV explose.”

Le joueur voit la ligne en rouge, clique, agit, et la ligne revient à l’orange.

C’est la boucle de jeu principale.

---

# Ce que je dirais au développeur

Le problème n’est pas “ajoute un peu de Three.js”.

Le problème est :

> **Le projet actuel est un dashboard. Il faut le transformer en carte stratégique 3D.**

Donc il ne faut pas simplement mettre un canvas décoratif derrière l’app actuelle. Il faut déplacer le centre de gravité du projet.

La carte devient le produit.
Les panels deviennent des aides.
Les actions deviennent contextuelles.
Les lignes deviennent le gameplay.
Les datacenters IA deviennent des objets énergétiques visibles.

La phrase de direction à garder :

> **On ne joue plus à cliquer sur des boutons dans un dashboard. On joue à défendre la carte énergétique de la France.**

[1]: https://r3f.docs.pmnd.rs/getting-started/introduction "Introduction - React Three Fiber"
[2]: https://r3f.docs.pmnd.rs/getting-started/installation "Installation - React Three Fiber"
