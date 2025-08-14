<?php
/**
 * Build script for Literary Templates plugin
 * Concatenates JavaScript files and copies templates
 */

// Files to include in main.bundle.js
$files = [
    // Core files
    'main.js',
    'EntityWizardBase.js',
    
    // Modal classes
    'HtmlWizardModal.js',
    'PromptModal.js',
    'SuggesterModal.js',
    'ProjectSelectorModal.js',
    'ChapterSelectorModal.js',
    'WorldSettingsModal.js',
    
    // Wizard modals
    'CityWizardModal.js',
    'LocationWizardModal.js',
    'CastleWizardModal.js',
    'PortWizardModal.js',
    'MineWizardModal.js',
    'FarmWizardModal.js',
    'FactoryWizardModal.js',
    'VillageWizardModal.js',
    'ProvinceWizardModal.js',
    'StateWizardModal.js',
    'PeopleWizardModal.js',
    'CharacterWizardModal.js',
    'ConflictWizardModal.js',
    'OrganizationWizardModal.js',
    'ReligionWizardModal.js',
    'CultWizardModal.js',
    'TradeRouteWizardModal.js',
    'FactionWizardModal.js',
    'QuestWizardModal.js',
    
    // Creator functions
    'creators/createWorld.js',
    'creators/createChapter.js',
    'creators/createCity.js',
    'creators/createLocation.js',
    'creators/createScene.js',
    'creators/createVillage.js',
    'creators/createDeadZone.js',
    'creators/createPort.js',
    'creators/createCastle.js',
    'creators/createPotion.js',
    'creators/createSpell.js',
    'creators/createArtifact.js',
    'creators/createConflict.js',
    'creators/createAlchemyRecipe.js',
    'creators/createState.js',
    'creators/createProvince.js',
    'creators/createPeople.js',
    'creators/createOrganization.js',
    'creators/createReligion.js',
    'creators/createCult.js',
    'creators/createTradeRoute.js',
    'creators/createFaction.js',
    'creators/createQuest.js',
    'creators/createMine.js',
    'creators/createFactory.js',
    'creators/createFarm.js',
    'creators/createCharacter.js',
    'creators/createMonster.js',
];

// Build main.bundle.js
$bundle = '';
foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $bundle .= "// === $file ===\n";
        $bundle .= $content . "\n\n";
    } else {
        echo "Warning: File $file not found\n";
    }
}

file_put_contents('main.bundle.js', $bundle);
echo "Created main.bundle.js\n";

// Copy templates to .obsidian/plugins/literary-templates/templates/
$templatesDir = '.obsidian/plugins/literary-templates/templates';
if (!is_dir($templatesDir)) {
    mkdir($templatesDir, 0755, true);
}

$templates = [
    'templates/Новый_монстр.md',
    'templates/Новый_конфликт.md',
    'templates/Новая_организация.md',
    'templates/Новая_религия.md',
    'templates/Новый_культ.md',
    'templates/Торговый_путь.md',
    'templates/Новая_фракция.md',
    'templates/Новый_персонаж.md',
    'templates/Новый_квест.md',
];

foreach ($templates as $template) {
    if (file_exists($template)) {
        $dest = $templatesDir . '/' . basename($template);
        copy($template, $dest);
        echo "Copied $template to $dest\n";
    }
}

echo "Build complete!\n";
?>