/**
 * @file       TradeRouteWizardModal.js
 * @description Мастер создания торговых путей
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2025-08-13
 * @updated    2025-08-13
 * @docs       docs/functional_card_Торговый_путь.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

class TradeRouteWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, plugin, projectPath, onFinish, options = {}) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.Modal = ModalClass;
        this.Notice = NoticeClass;
        this.plugin = plugin;
        this.projectPath = projectPath;
        this.onFinish = onFinish;
        this.options = options || {};
        this.data = {
            name: '',
            description: '',
            climate: '',
            state: '',
            province: '',
            startPoint: '',
            endPoint: '',
            distance: '',
            travelTime: '',
            goods: '',
            transport: '',
            dangers: '',
            security: '',
            economicValue: '',
            history: '',
            cities: '',
            ports: '',
            organizations: '',
            events: '',
            tags: ''
        };
        this.step = 0;
        this.steps = [
            this.renderBasic.bind(this),
            this.renderLocation.bind(this),
            this.renderRouteDetails.bind(this),
            this.renderTradeDetails.bind(this),
            this.renderGeneralDetails.bind(this),
            this.renderPreview.bind(this)
        ];
        this.config = { climates: [], states: [], provinces: [] };
    }

    async onOpen() {
        this.applyBaseUI();
        this.modalEl.style.maxWidth = '900px';
        this.modalEl.style.width = '900px';
        if (this.options.prefillName && !this.data.name) this.data.name = this.options.prefillName;
        await this.loadConfig();
        this.render();
    }

    async loadConfig() {
        try {
            if (!this.projectPath) return;
            // Климат из настроек
            if (window.litSettingsService) {
                this.config.climates = await window.litSettingsService.getClimates(this.app, this.projectPath) || [];
            } else {
                const settingsFile = this.app.vault.getAbstractFileByPath(`${this.projectPath}/Настройки_мира.md`);
                if (settingsFile instanceof TFile) {
                    const content = await this.app.vault.read(settingsFile);
                    const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                    if (configMatch && configMatch[1]) {
                        const parsed = JSON.parse(configMatch[1]);
                        this.config.climates = parsed.locations?.climates || [];
                    }
                }
            }
            // States
            this.config.states = [];
            const statesFolderObj = this.app.vault.getAbstractFileByPath(`${this.projectPath}/Локации/Государства`);
            if (statesFolderObj && statesFolderObj.children) {
                for (const file of statesFolderObj.children) {
                    if (file instanceof TFile && file.extension === 'md' && !file.basename.startsWith('Index') && !file.basename.startsWith('.')) {
                        try {
                            const content = await this.app.vault.read(file);
                            const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?/m);
                            const name = nameMatch ? nameMatch[1].trim() : file.basename;
                            this.config.states.push(name);
                        } catch (_) {
                            this.config.states.push(file.basename);
                        }
                    }
                }
            }
            // Provinces
            this.config.provinces = [];
            const provincesFolderObj = this.app.vault.getAbstractFileByPath(`${this.projectPath}/Локации/Провинции`);
            if (provincesFolderObj && provincesFolderObj.children) {
                for (const file of provincesFolderObj.children) {
                    if (file instanceof TFile && file.extension === 'md' && !file.basename.startsWith('Index') && !file.basename.startsWith('.')) {
                        try {
                            const content = await this.app.vault.read(file);
                            const stateMatch = content.match(/^state:\s*["']?([^"'\n]+)["']?/m);
                            const state = stateMatch ? stateMatch[1].trim() : '';
                            this.config.provinces.push({ name: file.basename, state });
                        } catch (_) {
                            this.config.provinces.push({ name: file.basename, state: '' });
                        }
                    }
                }
            }
        } catch (_) {}
    }

    render() {
        this.contentEl.empty();
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const fill = progress.createEl('div', { cls: 'lt-progress__fill' });
        fill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        
        this.steps[this.step]();
        
        this.renderNavigation();
    }

    renderBasic() {
        const h = this.contentEl.createEl('h2', { text: 'Основная информация' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Название торгового пути')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new Setting(this.contentEl)
            .setName('Начальная точка')
            .addText(t => t.setValue(this.data.startPoint).onChange(v => this.data.startPoint = v));
        
        new Setting(this.contentEl)
            .setName('Конечная точка')
            .addText(t => t.setValue(this.data.endPoint).onChange(v => this.data.endPoint = v));
    }

    renderLocation() {
        const h = this.contentEl.createEl('h2', { text: 'Расположение' });
        h.classList.add('lt-header');

        new Setting(this.contentEl)
            .setName('Климат')
            .addDropdown(d => {
                const fallbackClimates = ['Тропический', 'Умеренный', 'Холодный', 'Пустынный', 'Горный', 'Прибрежный', 'Субтропический'];
                const climates = (this.config.climates && this.config.climates.length > 0) ? this.config.climates : fallbackClimates;
                d.addOption('', 'Выберите климат (опционально)');
                climates.forEach(c => d.addOption(c, c));
                d.setValue(this.data.climate || '');
                d.onChange(v => this.data.climate = v);
            });

        new Setting(this.contentEl)
            .setName('Государство (опционально)')
            .addDropdown(d => {
                d.addOption('', 'Выберите государство');
                (this.config.states || []).forEach(s => d.addOption(s, s));
                d.setValue(this.data.state || '');
                d.onChange(v => { this.data.state = v; this.render(); });
            });

        new Setting(this.contentEl)
            .setName('Провинция (опционально)')
            .addDropdown(d => {
                d.addOption('', 'Выберите провинцию');
                const filtered = this.data.state ? (this.config.provinces || []).filter(p => p.state === this.data.state) : (this.config.provinces || []);
                filtered.forEach(p => d.addOption(p.name, p.name));
                d.setValue(this.data.province || '');
                d.onChange(v => this.data.province = v);
            });
    }

    renderRouteDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали маршрута' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Расстояние')
            .addText(t => t.setValue(this.data.distance).onChange(v => this.data.distance = v));
        
        new Setting(this.contentEl)
            .setName('Время в пути')
            .addText(t => t.setValue(this.data.travelTime).onChange(v => this.data.travelTime = v));
        
        new Setting(this.contentEl)
            .setName('Транспорт (через запятую)')
            .addTextArea(t => t.setValue(this.data.transport).onChange(v => this.data.transport = v));
        
        new Setting(this.contentEl)
            .setName('Опасности (через запятую)')
            .addTextArea(t => t.setValue(this.data.dangers).onChange(v => this.data.dangers = v));
    }

    renderTradeDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Торговые детали' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Товары (через запятую)')
            .addTextArea(t => t.setValue(this.data.goods).onChange(v => this.data.goods = v));
        
        new Setting(this.contentEl)
            .setName('Безопасность (через запятую)')
            .addTextArea(t => t.setValue(this.data.security).onChange(v => this.data.security = v));
        
        new Setting(this.contentEl)
            .setName('Экономическая ценность')
            .addText(t => t.setValue(this.data.economicValue).onChange(v => this.data.economicValue = v));
    }

    renderGeneralDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Общие детали' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('История')
            .addTextArea(t => t.setValue(this.data.history).onChange(v => this.data.history = v));
        
        new Setting(this.contentEl)
            .setName('Связанные города (через запятую)')
            .addText(t => t.setValue(this.data.cities).onChange(v => this.data.cities = v));
        
        new Setting(this.contentEl)
            .setName('Связанные порты (через запятую)')
            .addText(t => t.setValue(this.data.ports).onChange(v => this.data.ports = v));
        
        new Setting(this.contentEl)
            .setName('Связанные организации (через запятую)')
            .addText(t => t.setValue(this.data.organizations).onChange(v => this.data.organizations = v));
        
        new Setting(this.contentEl)
            .setName('Связанные события (через запятую)')
            .addText(t => t.setValue(this.data.events).onChange(v => this.data.events = v));
        
        new Setting(this.contentEl)
            .setName('Теги (через запятую)')
            .addText(t => t.setValue(this.data.tags).onChange(v => this.data.tags = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр торгового пути' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Маршрут: ${this.data.startPoint || ''} → ${this.data.endPoint || ''}` });
        if (this.data.goods) {
            box.createEl('div', { text: `Товар: ${this.data.goods.split(',')[0] || ''}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название торгового пути');
                return false;
            }
            if (!String(this.data.startPoint || '').trim()) {
                new this.Notice('Укажите начальную точку');
                return false;
            }
            if (!String(this.data.endPoint || '').trim()) {
                new this.Notice('Укажите конечную точку');
                return false;
            }
        }
        return true;
    }

    async finish() {
        const clean = s => String(s || '').trim();
        const list = s => clean(s).split(',').map(x => x.trim().replace(/\s+/g, '_')).filter(Boolean);
        
        const name = clean(this.data.name);
        const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        
        const data = {
            name,
            date,
            description: clean(this.data.description),
            startPoint: clean(this.data.startPoint),
            endPoint: clean(this.data.endPoint),
            distance: clean(this.data.distance),
            travelTime: clean(this.data.travelTime),
            goodsContent: list(this.data.goods).map(x => `- ${x}`).join('\n'),
            transportContent: list(this.data.transport).map(x => `- ${x}`).join('\n'),
            dangersContent: list(this.data.dangers).map(x => `- ${x}`).join('\n'),
            securityContent: list(this.data.security).map(x => `- ${x}`).join('\n'),
            economicValue: clean(this.data.economicValue),
            history: clean(this.data.history),
            citiesContent: list(this.data.cities).map(x => `[[${x}]]`).join(', '),
            portsContent: list(this.data.ports).map(x => `[[${x}]]`).join(', '),
            organizationsContent: list(this.data.organizations).map(x => `[[${x}]]`).join(', '),
            eventsContent: list(this.data.events).map(x => `[[${x}]]`).join(', '),
            tagsContent: list(this.data.tags).join(', '),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Торговый_путь') || '';
            }
        } catch (e) {}
        
        const content = await window.generateFromTemplate('Торговый_путь', data, this.plugin);
        const folder = `${this.projectPath}/Торговые_пути`;
        
        if (this.options.targetFile instanceof TFile) {
            await this.app.vault.modify(this.options.targetFile, content);
            await this.app.workspace.getLeaf(true).openFile(this.options.targetFile);
        } else {
            await window.ensureEntityInfrastructure(folder, cleanName, this.app);
            const path = `${folder}/${cleanName}.md`;
            await window.safeCreateFile(path, content, this.app);
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) await this.app.workspace.getLeaf(true).openFile(file);
        }
        
        new this.Notice(`Торговый путь «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
}

module.exports = TradeRouteWizardModal;
