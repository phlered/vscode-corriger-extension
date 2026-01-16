import * as vscode from 'vscode';

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

    // Sélectionner le modèle gpt-5.2-codex
    const [model] = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-5.2-codex'
    });

    if (!model) {
        // Fallback: essayer sans filtre de famille
        const [modelFallback] = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (!modelFallback) {
            const errorMsg = '❌ Aucun modèle de langage disponible. Assurez-vous que GitHub Copilot est activé.';
            if (stream) {
                stream.markdown(errorMsg);
            }
            throw new Error(errorMsg);
        }
        if (stream) {
            stream.markdown(`⚠️ **gpt-5.2-codex non disponible, utilisation de : ${modelFallback.family}**\n\n`);
        }
        const chatResponse = await modelFallback.sendRequest(messages, {}, token);
        let resultat = '';
        for await (const fragment of chatResponse.text) {
            resultat += fragment;
            if (stream) {
                stream.markdown(fragment);
            }
        }
        if (!resultat || resultat.trim() === '') {
            const errorMsg = 'Le modèle n\'a pas généré de correction.';
            if (stream) {
                stream.markdown(`❌ ${errorMsg}`);
            }
            throw new Error(errorMsg);
        }
        return resultat;
    }

    if (stream) {
        stream.markdown(`🔧 Utilisation du modèle : **${model.family}**\n\n`);
    }

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

/**
 * Valide la structure basique du LaTeX
 * @returns true si la structure est valide, false sinon
 */
function validerStructureLaTeX(texte: string): boolean {
    // Vérifications basiques de structure
    const verificateurs = [
        /\\begin\{exercice\}/,
        /\\end\{exercice\}/,
        /\\begin\{enonce\}/,
        /\\end\{enonce\}/,
        /\\begin\{correction\}/,
        /\\end\{correction\}/
    ];

    // Au moins \begin{exercice} et \end{exercice} doivent être présents
    const aDebut = texte.includes('\\begin{exercice}');
    const aFin = texte.includes('\\end{exercice}');
    const aEnonce = texte.includes('\\begin{enonce}') || texte.includes('\\begin{enonce}');
    const aCorrection = texte.includes('\\begin{correction}') || texte.includes('\\begin{correction}');

    // Vérifier que le nombre de \begin et \end correspond
    const countDebutExercice = (texte.match(/\\begin\{exercice\}/g) || []).length;
    const countFinExercice = (texte.match(/\\end\{exercice\}/g) || []).length;
    const countDebutEnonce = (texte.match(/\\begin\{enonce\}/gi) || []).length;
    const countFinEnonce = (texte.match(/\\end\{enonce\}/gi) || []).length;

    const structureValide = aDebut && aFin &&
        countDebutExercice === countFinExercice &&
        countDebutEnonce === countFinEnonce &&
        !texte.includes('x +') &&  // Détecter les corruptions fréquentes
        !texte.includes('x --') &&
        !texte.includes('dfrx');

    return structureValide;
}

/**
 * Écrit le résultat de manière atomique avec vérification d'intégrité
 * @param editor L'éditeur actif
 * @param resultat Le résultat à écrire
 * @param selection La plage de texte à remplacer (si définie, sinon tout le document)
 * @returns true si l'écriture a réussi, false sinon
 */
async function ecrireCorrectionAtomique(
    editor: vscode.TextEditor,
    resultat: string,
    selection?: vscode.Range
): Promise<boolean> {
    const document = editor.document;
    const contenuInitial = document.getText();

    try {
        let range: vscode.Range;

        if (selection) {
            // Remplacer uniquement la sélection
            range = selection;
            console.log('[ATOMIC] Remplacement de la sélection uniquement');
        } else {
            // Remplacer tout le document
            range = new vscode.Range(
                document.positionAt(0),
                document.positionAt(contenuInitial.length)
            );
            console.log('[ATOMIC] Remplacement de tout le document');
        }

        // Effectuer l'édition de manière atomique
        await editor.edit(editBuilder => {
            editBuilder.replace(range, resultat);
        });

        // Vérifier l'intégrité après écriture
        const contenuApres = editor.document.getText();

        // Vérifier que le contenu a bien changé (uniquement si remplacement total)
        if (!selection && contenuApres === contenuInitial) {
            console.error('[ATOMIC] Écriture n\'a pas modifié le document');
            return false;
        }

        // Vérifier la structure LaTeX uniquement si remplacement total
        if (!selection && !validerStructureLaTeX(contenuApres)) {
            console.error('[ATOMIC] Structure LaTeX invalide après écriture');
            console.error('[ATOMIC] Contenu après:', contenuApres.substring(0, 200));
            return false;
        }

        // Vérifier que le résultat attendu est présent (uniquement si remplacement total)
        if (!selection && (!contenuApres.includes('\\begin{correction}') && !contenuApres.includes('\\begin{correction}'))) {
            console.error('[ATOMIC] Correction non trouvée dans le document après écriture');
            return false;
        }

        console.log('[ATOMIC] Écriture atomique réussie');
        return true;

    } catch (error) {
        console.error('[ATOMIC] Erreur lors de l\'écriture atomique:', error);
        return false;
    }
}

/**
 * Restaure le document à son état initial
 */
async function restaurerDocument(editor: vscode.TextEditor, contenuInitial: string): Promise<void> {
    try {
        const document = editor.document;
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, contenuInitial);
        });

        console.log('[RESTORE] Document restauré à son état initial');
    } catch (error) {
        console.error('[RESTORE] Erreur lors de la restauration:', error);
    }
}

export function activate(context: vscode.ExtensionContext) {

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
                    const document = editor.document;
                    const contenuInitial = document.getText();
                    console.log('[DEBUG] Longueur du document avant:', contenuInitial.length);

                    const resultat = await corrigerTexte(texte, undefined, undefined);

                    console.log('[DEBUG] Longueur du résultat:', resultat.length);

                    // Vérifier la structure avant d'écrire (uniquement si remplacement total)
                    if (selection.isEmpty && !validerStructureLaTeX(resultat)) {
                        throw new Error('La correction générée a une structure LaTeX invalide');
                    }

                    // Déterminer si on remplace la sélection ou tout le document
                    const rangeToReplace = selection.isEmpty ? undefined : selection;

                    // Écriture atomique avec vérification
                    const succes = await ecrireCorrectionAtomique(editor, resultat, rangeToReplace);

                    if (!succes) {
                        // Restaurer l'état initial en cas d'échec
                        await restaurerDocument(editor, contenuInitial);
                        throw new Error('Échec de l\'écriture - document restauré');
                    }

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

                const resultat = await corrigerTexte(texteACorriger, stream, token);

                console.log('[DEBUG] Résultat longueur:', resultat.length);

                // Le chat affiche uniquement le résultat dans un bloc de code
                // L'utilisateur peut ensuite copier-coller le résultat dans son fichier
                stream.markdown('\n**Voici la correction générée :**\n\n```latex\n' + resultat + '\n```\n');
                stream.markdown('\n💡 *Copiez ce bloc de code et collez-le dans votre fichier LaTeX.*\n');

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

    context.subscriptions.push(corriger, corrigerDocumentCmd);
}

export function deactivate() { }
