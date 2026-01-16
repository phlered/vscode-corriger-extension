# Analyse du Projet : Extension Correcteur LaTeX pour VSCode

## Vue d'ensemble

Le projet "vscode-corriger-extension" est une extension Visual Studio Code qui fournit un agent de correction automatique pour les exercices LaTeX de niveau lycée. L'extension s'intègre à GitHub Copilot Chat et utilise l'IA Claude Sonnet pour générer des corrections pédagogiques détaillées.

## Fonctionnalités Principales

- **Participant de chat `@corriger`** : Agent conversationnel accessible dans Copilot Chat
- **Correction automatique** : Génération de corrections pour exercices mathématiques niveau lycée
- **Génération de diagrammes TikZ** : Création automatique de tableaux de variations, arbres de probabilité, etc.
- **Format standardisé** : Utilisation des environnements `\begin{exercice}` et `\begin{correction}`
- **Vérification des calculs** : Validation automatique des étapes mathématiques
- **Commande VSCode** : Correction directe du document actif

## Architecture Technique

### Structure du Projet
- **Langage** : TypeScript
- **Framework** : API Extensions VSCode
- **Build** : esbuild pour la compilation
- **Modèle IA** : gpt-5.2-codex via GitHub Copilot

### Composants Clés

1. **Extension.ts** : Point d'entrée principal
   - `CORRECTION_INSTRUCTIONS` : Règles détaillées pour l'IA
   - `corrigerTexte()` : Fonction de correction principale
   - `activate()` : Enregistrement des composants

2. **Participant de Chat** :
   - ID : `corriger-latex.corriger`
   - Gestion des requêtes utilisateur
   - Streaming des réponses

3. **Commande VSCode** :
   - ID : `corriger-latex.corrigerDocument`
   - Correction du fichier actif (.tex)

### Flux de Données
```
Utilisateur → Copilot Chat → @corriger → corrigerTexte() → Claude Sonnet → Correction formatée → Affichage
```

## Installation et Configuration

### Prérequis
- VS Code 1.90.0 ou supérieur
- Node.js installé
- GitHub Copilot activé

### Installation pour Développement
```bash
npm install
npm run compile
# Puis F5 pour mode debug
```

### Installation Utilisateur Final
```bash
npx vsce package
code --install-extension corriger-latex-<version>.vsix
```

## Utilisation

### Via Copilot Chat
1. Ouvrir Copilot Chat (Ctrl+Alt+I)
2. Taper `@corriger` suivi de l'exercice
3. Coller le contenu LaTeX à corriger

### Via Commande
1. Ouvrir un fichier .tex
2. Exécuter la commande "Corriger le document LaTeX"

### Exemple d'Utilisation
```
@corriger Corrige cet exercice :

\begin{exercice}
    Résoudre l'équation : $x^2 - 5x + 6 = 0$
\end{exercice}
```

## Formats d'Entrée/Sortie

### Format d'Entrée
```latex
\begin{exercice}
    % Contenu de l'exercice
\end{exercice}
```

Ou avec énoncé explicite :
```latex
\begin{exercice}
\begin{enonce}
    % Contenu de l'exercice
\end{enonce}
\end{exercice}
```

### Format de Sortie
```latex
\begin{exercice}
\begin{enonce}
    % Contenu original
\end{enonce}
\begin{correction} % assistée par IA
    % Correction détaillée avec explications pédagogiques
\end{correction}
\end{exercice}
%%%%%%%%%%%%%%%%%%
% Fin exercice %%
%%%%%%%%%%%%%%%%%%
```

## Règles de Correction

L'extension applique des règles spécifiques pour assurer la qualité pédagogique :

- **Numérotation** : Respect de la structure `\begin{enumerate}`
- **Diagrammes** : Génération TikZ pour graphiques et tableaux
- **Probabilités** : Notation `P_A(B)` pour P(B|A)
- **Calculs** : Vérification systématique avec commentaires `% Calcul vérifié`
- **Niveau** : Adapté au lycée avec explications appropriées
- **Exercices corrigés** : Non modifiés s'ils contiennent déjà une correction

## Cohérence Documentation/Code

La documentation (README.md, INSTALLATION.md) est cohérente avec le code source. Le code TypeScript implémente fidèlement les fonctionnalités décrites, avec les instructions détaillées dans `CORRECTION_INSTRUCTIONS` qui guident l'IA.

## Points Forts

- **Intégration native** : S'intègre parfaitement à l'écosystème VSCode/Copilot
- **IA puissante** : Utilise Claude Sonnet pour des corrections de qualité
- **Format standard** : Respecte les conventions LaTeX pédagogiques
- **Flexibilité** : Fonctionne via chat ou commande directe
- **Vérification** : Assure l'exactitude des calculs

## Améliorations Récentes

Suite aux retours utilisateurs, les améliorations suivantes ont été apportées :

### 1. **Activation Automatique**
- Ajout d'événements d'activation : `"onLanguage:latex"` et `"onCommand:corriger-latex.corrigerDocument"`
- L'extension s'active désormais automatiquement à l'ouverture de fichiers LaTeX

### 2. **Support de la Sélection**
- La commande VSCode et le participant de chat utilisent maintenant la sélection active si elle existe
- Permet de corriger seulement une partie du document LaTeX
- Feedback utilisateur amélioré pour indiquer si c'est une sélection ou le document entier

### 3. **UX Optimisée du Chat**
- Le participant `@corriger` récupère automatiquement le contexte du fichier ouvert
- Différencie visuellement entre correction de sélection et correction complète
- Plus besoin de copier-coller manuellement le contenu

## Limites

- **Dépendance Copilot** : Nécessite GitHub Copilot activé
- **Langue française** : Spécialisé pour le français (instructions en français)
- **Niveau lycée** : Optimisé pour ce niveau spécifique

Cette extension représente une solution innovante pour automatiser la correction d'exercices LaTeX tout en maintenant un niveau pédagogique élevé grâce à l'utilisation intelligente de l'IA.