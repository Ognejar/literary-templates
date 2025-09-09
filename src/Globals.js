/**
 * @file       Globals.js
 * @description Централизованная глобализация create* функций и wizard-обёрток
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @created    2025-09-09
 * @updated    2025-09-09
 */

// Ожидается, что сборщик уже включил creators/create*.js и классы WizardModal
try {
    if (typeof window !== 'undefined') {
        // create* функции (из creators/create*.js)
        [
            'createWorld','createChapter','createCity','createLocation','createScene','createVillage',
            'createDeadZone','createPort','createCastle','createPotion','createSpell','createArtifact',
            'createAlchemyRecipe','createProvince','createState','createFactory','createFarm','createPeople',
            'createTask','createCharacter','createMonster','createWork','createSocialInstitution'
        ].forEach(name => {
            if (typeof window[name] === 'undefined' && typeof globalThis[name] !== 'undefined') {
                window[name] = globalThis[name];
            }
        });

        // Wizard-обёртки: если нужны — можно добавить по аналогии
        // Пример (закомментировано до явного требования):
        // window.createOrganizationWizard = (plugin, projectPath, options={}) => new OrganizationWizardModal(plugin.app, Modal, Setting, Notice, plugin, projectPath, ()=>{}, options).open();

        // Совместимость: алиас ensureEntityInfrastructure на метод ProjectManager
        if (typeof window.ensureEntityInfrastructure !== 'function' && typeof window.ProjectManager === 'function') {
            window.ensureEntityInfrastructure = async (folder, fileName, app) => {
                try {
                    const pm = new window.ProjectManager({ app });
                    return await pm.ensureEntityInfrastructure(folder, fileName, app);
                } catch (e) {
                    console.error('ensureEntityInfrastructure alias error:', e);
                }
            };
        }
    }
} catch (e) {
    // Мягкая деградация без исключений
}

module.exports = {};


