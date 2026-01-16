import * as vscode from 'vscode';
import { diagnosticModeles } from './diagnostic';

const CORRECTION_INSTRUCTIONS = `# Agent de Correction d'Exercices LaTeX

Le but de cet agent personnalisé est de corriger des exercices en LaTeX de niveau lycée.

## Format d'entrée

Les exercices sont fournis dans l'un de ces formats :

\`\`\`latex
\\begin{exercice}
    % Contenu de l'exercice
\\end{exercice}
\`\`\`

ou :

\`\`\`latex
\\begin{exercice}
    \\begin{enonce}
        % Contenu de l'exercice
    \\end{enonce}
\\end{exercice}
\`\`\`

## Format de sortie

Retourner les exercices corrigés au format suivant :

\`\`\`latex
\\begin{exercice}
    \\begin{enonce}
        % Contenu de l'exercice
    \\end{enonce}
    \\begin{correction} % assistée par IA
        % Contenu de la correction
    \\end{correction}
\\end{exercice}
%%%%%%%%%%%%%%%%%
% Fin exercice %%
%%%%%%%%%%%%%%%%%
\`\`\`

## Cas des exercices déjà corrigés
Si l'exercice contient déjà une section non vide \`\\begin{correction} ... \\end{correction}\`, ne rien modifier à cet exercice et retourner l'exercice tel quel.

## Règles de correction

1. **Numérotation** : Le contenu de la correction doit suivre la même numérotation que l'énoncé (\`\\begin{enumerate} ... \\end{enumerate}\`).

2. **Graphiques et diagrammes** : Si un arbre de probabilité, un graphique ou un tableau de variation est demandé, le dessiner en code TikZ.
   - Les arbres de probabilité seront dans le sens horizontal.
   - Voici un exemple simple de tableau de variation obtenu avec le signe de la dérivée :
   \`\`\`latex
        \\begin{center}
          \\begin{tikzpicture}[scale=0.7]
          \\tkzTabInit[lgt=2,espcl=2]{$x$/1, $f'(x)$/1, $f(x)$/2}{$-\\infty$, $2$, $+\\infty$}
          \\tkzTabLine{, -, z, +, }
          \\tkzTabVar{+/, -/$-1$, +/}
          \\end{tikzpicture}
        \\end{center}
    \`\`\`
    - Autre exemple dans le cas où la fonction dérivée est du second degré : 
    \`\`\`latex
        \\begin{center}
          \\begin{tikzpicture}[scale=0.7]
          \\tkzTabInit[lgt=2,espcl=2]{$x$/1, $f'(x)$/1, $f(x)$/2}{$-\\infty$, $-1$, $2$, $+\\infty$}
          \\tkzTabLine{, +, z, -, z, +, }
          \\tkzTabVar{-/, +/$12$, -/$-15$, +/}
          \\end{tikzpicture}
        \\end{center}
    \`\`\`

3. **Notation en probabilité** : Les probabilités conditionnelles seront notées \`P_A(B)\` pour P(B|A).

4. **Racines d'une fonction trinome** : Calculer 'Delta' avec la formule \`b^2 - 4ac\` et utiliser les formules classiques pour les racines.

5. **Niveau** : IMPORTANT - Les exercices sont de niveau lycée. Adapter le niveau des corrections en conséquence avec des explications pédagogiques appropriées, tout en restant assez concis et clair.

6. **Vérification des calculs** : Quand un calcul est effectué (développement, factorisation, résolution d'équation, calcul numérique), vérifier les étapes pour s'assurer de l'exactitude. Après vérification, indiquer discrètement dans un commentaire LaTeX :
   \`\`\`latex
   % Calcul vérifié
   \`\`\`

## Exemple de workflow

1. Lire l'exercice fourni
2. Analyser les questions posées
3. Rédiger une correction détaillée et pédagogique
4. Vérifier tous les calculs
5. Inclure les diagrammes TikZ si nécessaire
6. Formater selon le format de sortie requis`;

async function corrigerTexte(texte: string, stream?: vscode.ChatResponseStream, token?: vscode.CancellationToken): Promise<string> {
    // Construire le prompt avec les instructions
    const messages = [
        vscode.LanguageModelChatMessage.User(CORRECTION_INSTRUCTIONS),
        vscode.LanguageModelChatMessage.User(
            `Voici l'exercice à corriger :\n\n${texte}`
        )
    ];

    // Sélectionner un modèle de langage disponible
    // Essayer Claude Sonnet 4.5 en priorité
    let models = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'claude-sonnet-4.5'
    });

    // Si pas disponible, essayer Claude Sonnet 4
    if (models.length === 0) {
        models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'claude-sonnet-4'
        });
    }

    // Si toujours pas disponible, prendre n'importe quel modèle Copilot
    if (models.length === 0) {
        models = await vscode.lm.selectChatModels({
            vendor: 'copilot'
        });
    }

    if (models.length === 0) {
        const errorMsg = '❌ Aucun modèle de langage disponible. Vérifiez que GitHub Copilot Chat est activé.';
        if (stream) {
            stream.markdown(errorMsg);
        }
        throw new Error(errorMsg);
    }

    const model = models[0];
    console.log(`Utilisation du modèle: ${model.vendor}/${model.family}/${model.id}`);

    // Envoyer la requête avec gestion du token d'annulation
    const chatResponse = await model.sendRequest(messages, {}, token);

    // Collecter la réponse
    let resultat = '';
    for await (const fragment of chatResponse.text) {
        resultat += fragment;
        if (stream) {
            stream.markdown(fragment);
        }
    }

    // Valider que la réponse n'est pas vide
    if (!resultat || resultat.trim() === '') {
        const errorMsg = 'Le modèle n\'a pas généré de correction.';
        if (stream) {
            stream.markdown(`❌ ${errorMsg}`);
        }
        throw new Error(errorMsg);
    }

    return resultat;
}

export function activate(context: vscode.ExtensionContext) {

    // Commande de diagnostic
    const diagnosticCmd = vscode.commands.registerCommand(
        'corriger-latex.diagnostic',
        async () => {
            const diagnostic = await diagnosticModeles();
            const doc = await vscode.workspace.openTextDocument({
                content: diagnostic,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(doc);
        }
    );

    // Commande pour corriger le document actif
    const corrigerDocumentCmd = vscode.commands.registerCommand(
        'corriger-latex.corrigerDocument',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Aucun fichier actif.');
                return;
            }

            const document = editor.document;
            if (!document.fileName.endsWith('.tex')) {
                vscode.window.showWarningMessage('Ce fichier n\'est pas un fichier LaTeX.');
                return;
            }

            const selection = editor.selection;
            const texte = selection.isEmpty ? document.getText() : document.getText(selection);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Correction en cours...',
                cancellable: false
            }, async (progress) => {
                try {
                    const resultat = await corrigerTexte(texte, undefined, undefined);

                    // Remplacer tout le contenu du document
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(document.getText().length)
                    );

                    await editor.edit(editBuilder => {
                        editBuilder.replace(fullRange, resultat);
                    });

                    vscode.window.showInformationMessage('✅ Document corrigé avec succès !');
                } catch (err) {
                    if (err instanceof vscode.LanguageModelError) {
                        console.error('Erreur du modèle de langage:', err.message, err.code);
                        vscode.window.showErrorMessage(`❌ Erreur : ${err.message}`);
                    } else {
                        console.error('Erreur inattendue:', err);
                        vscode.window.showErrorMessage('❌ Une erreur inattendue s\'est produite.');
                    }
                }
            });
        }
    );

    // Créer le chat participant @corriger
    const corriger = vscode.chat.createChatParticipant(
        'corriger-latex.corriger',
        async (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => {
            try {
                // Si la commande est vide, utiliser le document actif
                let texteACorriger = request.prompt;

                if (!texteACorriger || texteACorriger.trim() === '') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor && editor.document.fileName.endsWith('.tex')) {
                        const selection = editor.selection;
                        const isSelection = !selection.isEmpty;
                        texteACorriger = isSelection ? editor.document.getText(selection) : editor.document.getText();

                        if (isSelection) {
                            stream.markdown('📄 *Correction de la sélection active dans le document LaTeX...*\n\n');
                        } else {
                            stream.markdown('📄 *Correction du document LaTeX actif...*\n\n');
                        }
                    } else {
                        stream.markdown('ℹ️ Veuillez fournir un exercice à corriger ou ouvrir un fichier LaTeX.');
                        return;
                    }
                }

                await corrigerTexte(texteACorriger, stream, token);

            } catch (err) {
                if (err instanceof vscode.LanguageModelError) {
                    console.error('Erreur du modèle de langage:', err.message, err.code);
                    stream.markdown(`❌ Erreur : ${err.message}`);
                } else {
                    console.error('Erreur inattendue:', err);
                    stream.markdown('❌ Une erreur inattendue s\'est produite.');
                }
            }
        }
    );

    // Définir les propriétés du participant
    corriger.iconPath = new vscode.ThemeIcon('mortar-board');

    context.subscriptions.push(corriger, corrigerDocumentCmd, diagnosticCmd);
}

export function deactivate() { }
