# Correcteur LaTeX - Extension VS Code

Extension VS Code qui fournit un agent de correction personnalisé `@corriger` pour corriger des exercices LaTeX de niveau lycée dans Copilot Chat.

## Fonctionnalités

- **Participant de chat `@corriger`** : Invocable directement dans Copilot Chat
- **Commande `LaTeX: Corriger le document LaTeX`** : Correction directe du document actif
- **Correction d'exercices LaTeX** : Spécialisé dans les exercices de mathématiques niveau lycée
- **Génération de diagrammes TikZ** : Tableaux de variations, arbres de probabilité, etc.
- **Format standardisé** : Correction au format LaTeX avec environnements `\begin{exercice}` et `\begin{correction}`
- **Support de GitHub Copilot** : Utilise gpt-5.2-codex pour les corrections

## Utilisation

1. Installez l'extension
2. Ouvrez Copilot Chat dans VS Code
3. Tapez `@corriger` suivi de votre requête
4. Collez l'exercice LaTeX à corriger

### Exemple

```
@corriger Corrige cet exercice :

\begin{exercice}
    Résoudre l'équation : $x^2 - 5x + 6 = 0$
\end{exercice}
```

## Installation

### À partir du code source

1. Clonez ce dépôt
2. Installez les dépendances : `npm install`
3. Compilez l'extension : `npm run compile`
4. Appuyez sur F5 pour lancer en mode debug

### Installation locale (VSIX)

1. Packagez l'extension : `npx vsce package`
2. Installez le fichier `.vsix` : Extensions > ⋯ > Install from VSIX...

## Prérequis

- VS Code 1.90.0 ou supérieur
- GitHub Copilot activé avec un modèle disponible (gpt-5.2-codex)

## Historique des versions

### 0.0.3
- **Modifications** : Utilisation du modèle gpt-5.2-codex
- **Corrections** : Bug de corruption de document, erreur de frappe
- **Améliorations** : Validation réponse, token d'annulation, activationEvents

### 0.0.1
- Version initiale

## Développement

```bash
# Installation des dépendances
npm install

# Compilation
npm run compile

# Watch mode
npm run watch

# Package
npm run package
```
