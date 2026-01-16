import * as vscode from 'vscode';

export async function diagnosticModeles() {
    const output: string[] = [];
    
    output.push('=== DIAGNOSTIC DES MODÈLES DE LANGAGE ===\n');
    
    // Version de VS Code
    output.push(`Version VS Code: ${vscode.version}`);
    
    // Vérifier si l'API Language Model est disponible
    output.push(`API Language Model disponible: ${vscode.lm ? 'OUI' : 'NON'}`);
    
    if (vscode.lm) {
        try {
            // Essayer de lister tous les modèles
            const allModels = await vscode.lm.selectChatModels();
            output.push(`\nNombre de modèles trouvés: ${allModels.length}`);
            
            if (allModels.length > 0) {
                output.push('\nModèles disponibles:');
                for (const model of allModels) {
                    output.push(`  - ID: ${model.id}`);
                    output.push(`    Vendor: ${model.vendor}`);
                    output.push(`    Family: ${model.family}`);
                    output.push(`    Name: ${model.name || 'N/A'}`);
                    output.push(`    Max Input Tokens: ${model.maxInputTokens || 'N/A'}`);
                    output.push('');
                }
            } else {
                output.push('\n⚠️ Aucun modèle disponible.');
                output.push('\nCauses possibles:');
                output.push('  1. GitHub Copilot n\'est pas installé ou activé');
                output.push('  2. Vous n\'êtes pas connecté à GitHub Copilot');
                output.push('  3. Votre abonnement Copilot n\'inclut pas l\'accès à l\'API Language Model');
                output.push('  4. L\'extension GitHub Copilot Chat n\'est pas installée');
            }
            
            // Vérifier les extensions installées
            const copilotExt = vscode.extensions.getExtension('GitHub.copilot');
            const copilotChatExt = vscode.extensions.getExtension('GitHub.copilot-chat');
            
            output.push('\n=== EXTENSIONS GITHUB COPILOT ===');
            output.push(`GitHub.copilot: ${copilotExt ? 'INSTALLÉE (v' + copilotExt.packageJSON.version + ')' : 'NON INSTALLÉE'}`);
            output.push(`GitHub.copilot-chat: ${copilotChatExt ? 'INSTALLÉE (v' + copilotChatExt.packageJSON.version + ')' : 'NON INSTALLÉE'}`);
            
        } catch (error) {
            output.push(`\n❌ Erreur lors du diagnostic: ${error}`);
        }
    }
    
    return output.join('\n');
}
