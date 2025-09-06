/**
 * @file       createSocialInstitution.js
 * @description Создание социальных объектов по мастеру (Храм, Институт, Университет, Больница, Библиотека, Музей, Театр, Школа, Стадион)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies SocialInstitutionWizardModal, main.js helpers
 * @created    2025-08-21
 * @updated    2025-08-21
 * @docs       docs/project.md
 */

/* global SocialInstitutionWizardModal */

var createSocialInstitution = async function(plugin, startPath = '', options = {}) {
    try {
        const activeFile = plugin.app.workspace.getActiveFile();
        const parentPath = startPath || (activeFile && activeFile.parent ? activeFile.parent.path : '');
        // Используем резолвер контекста из настроек
        let projectRoot = '';
        if (window.litSettingsService && typeof window.litSettingsService.resolveContext === 'function') {
            const ctx = await window.litSettingsService.resolveContext(plugin.app, parentPath);
            projectRoot = ctx.projectRoot || '';
        }
        
        // Fallback: старый способ
        if (!projectRoot) {
            projectRoot = findProjectRoot(plugin.app, parentPath) || plugin.activeProjectRoot || '';
            if (!projectRoot) {
                const roots = await getAllProjectRoots(plugin.app);
                if (!roots || roots.length === 0) { plugin.logDebug('[ERROR] Проекты не найдены'); return; }
                projectRoot = roots[0];
            }
        }

        const modal = new SocialInstitutionWizardModal(plugin.app, Modal, Setting, Notice, projectRoot, async (data) => {
            // Без Unicode property escapes для совместимости
            const cleanName = String(data.name || '').trim().replace(/[^A-Za-zА-Яа-яЁё0-9_\-\s]/g, '').replace(/\s+/g, '_');
            const sub = String(data.subtype || 'Объект');
            const folder = `${projectRoot}/Локации/Социальные_объекты/${sub}`;
            await ensureEntityInfrastructure(folder, cleanName, plugin.app);
            const path = `${folder}/${cleanName}.md`;
            const md = await generateFromTemplate('Новый_социальный_объект', {
                name: data.name,
                subtype: sub,
                country: data.country,
                province: data.province,
                city: data.city,
                address: data.address,
                founded: data.founded,
                capacity: data.capacity,
                owner: data.owner,
                affiliation: data.affiliation,
                status: data.status,
                description: data.description,
                date: (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10)),
                projectName: projectRoot.split('/').pop()
            }, plugin);
            const existing = plugin.app.vault.getAbstractFileByPath(path);
            if (existing instanceof TFile) {
                await plugin.app.vault.modify(existing, md);
                await plugin.app.workspace.getLeaf(true).openFile(existing);
            } else {
                const file = await plugin.app.vault.create(path, md);
                await plugin.app.workspace.getLeaf(true).openFile(file);
            }
            new Notice(`Создан объект: ${sub} — ${data.name}`);
        });
        modal.open();
    } catch (e) {
        plugin.logDebug('Ошибка createSocialInstitution: ' + e.message);
    }
};

if (typeof window !== 'undefined') {
    window.createSocialInstitution = createSocialInstitution;
}

module.exports = { createSocialInstitution };


