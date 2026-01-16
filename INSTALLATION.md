# Guide d'Installation - Extension Correcteur LaTeX

## Version

**Version actuelle : 0.0.3**

## Modèle utilisé

Cette extension utilise le modèle **gpt-5.2-codex** de GitHub Copilot pour générer les corrections.

## Étape 1 : Prérequis

Assurez-vous que Node.js est installé sur votre système.

```bash
# Vérifier si Node.js est installé
node --version

# Si non installé, installez-le via Homebrew (macOS)
brew install node
```

## Étape 2 : Installation des dépendances

```bash
cd /chemin/vers/vscode-corriger-extension
npm install
```

## Étape 3 : Compilation

```bash
npm run compile
```

## Étape 4 : Test de l'extension

### Option A : Mode Debug (recommandé pour tester)

1. Ouvrez le dossier de l'extension dans VS Code
2. Appuyez sur **F5**
3. Une nouvelle fenêtre VS Code s'ouvrira avec l'extension activée
4. Ouvrez Copilot Chat et testez avec `@corriger`

### Option B : Installation permanente

```bash
# Installer vsce (outil de packaging)
npm install -g @vscode/vsce

# Créer le package VSIX
vsce package

# Installer l'extension
code --install-extension corriger-latex-0.0.3.vsix
```

## Étape 5 : Utilisation

1. Ouvrez Copilot Chat (Ctrl+Alt+I ou Cmd+Alt+I)
2. Tapez `@corriger` suivi de votre exercice LaTeX
3. L'agent générera la correction selon les règles définies

### Exemple d'utilisation

```
@corriger Corrige cet exercice :

\begin{exercice}
    Soit $f(x) = x^2 - 4x + 3$. 
    \begin{enumerate}
        \item Calculer $f(0)$ et $f(1)$
        \item Résoudre $f(x) = 0$
        \item Dresser le tableau de variations de $f$
    \end{enumerate}
\end{exercice}
```

## Mise à jour

Pour mettre à jour les instructions de correction :

1. Éditez [src/extension.ts](src/extension.ts)
2. Modifiez la constante `CORRECTION_INSTRUCTIONS`
3. Recompilez : `npm run compile`
4. Rechargez l'extension (Ctrl+R dans la fenêtre de debug)

## Désinstallation

```bash
code --uninstall-extension philippe.corriger-latex
```
