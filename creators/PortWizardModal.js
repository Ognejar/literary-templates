/**
 * @file       PortWizardModal.js
 * @description Модальное окно мастера для создания нового порта.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies EntityWizardBase
 * @created    2024-07-29
 * @updated    2025-08-13
 * @docs       /docs/project.md
 */

const { EntityWizardBase } = require('./EntityWizardBase.js');

var PortWizardModal = class extends EntityWizardBase {
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
            dominantFaction: '',
            harborType: '',
            province: '',
            state: '',
            status: 'действует',
            statusReason: '',
            docks: '',
            mainGoods: '',
            ships: '',
            features: '',
        };
        this.step = 0;
        this.steps = [
            this.renderMain.bind(this),
            this.renderStatus.bind(this),
            this.renderLocation.bind(this),
            this.renderDetails.bind(this),
            this.renderPreview.bind(this),
        ];
        this.config = {
            climates: [],
            factions: [],
            provinces: [],
            states: [],
            statuses: [
                { value: 'действует', label: 'Действует', icon: '✅' },
                { value: 'заброшено', label: 'Заброшено', icon: '🏚️' },
                { value: 'разрушено', label: 'Разрушено', icon: '💥' }
            ]
        };
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
            if (!this.projectPath) {
                new this.Notice('Проект не найден. Установите активный проект.');
                this.close();
                return;
            }

            // Загружаем конфигурацию через settingsService
            if (window.litSettingsService) {
                this.config.climates = await window.litSettingsService.getClimates(this.app, this.projectPath) || [];
                this.config.factions = await window.litSettingsService.getFactions(this.app, this.projectPath) || [];
            } else {
                // Fallback к старому методу
                const settingsFile = this.app.vault.getAbstractFileByPath(`${this.projectPath}/Настройки_мира.md`);
                if (settingsFile instanceof TFile) {
                    const content = await this.app.vault.read(settingsFile);
                    const configMatch = content.match(/```json\n([\s\S]*?)\n```/);
                    if (configMatch && configMatch[1]) {
                        const parsedConfig = JSON.parse(configMatch[1]);
                        this.config.climates = parsedConfig.locations?.climates || [];
                        this.config.factions = parsedConfig.locations?.factions || [];
                    }
                }
            }

            // Загружаем провинции
            const provincesFolder = `${this.projectPath}/Локации/Провинции`;
            const provincesFolderObj = this.app.vault.getAbstractFileByPath(provincesFolder);
            if (provincesFolderObj && provincesFolderObj.children) {
                this.config.provinces = provincesFolderObj.children
                    .filter(f => f instanceof TFile && f.extension === 'md')
                    .map(f => f.basename);
            }

            // Загружаем государства
            this.config.states = this.loadFilesFromFolder(`${this.projectPath}/Локации/Государства`, 'Государства');

            // Инициализируем значения по умолчанию
            this.data.climate = this.data.climate || (this.config.climates[0] || '');
            this.data.dominantFaction = this.data.dominantFaction || (this.config.factions[0] || '');
        } catch (e) {
            new this.Notice('Ошибка загрузки конфигурации: ' + e.message);
            console.error('Ошибка загрузки конфигурации:', e);
            this.close();
        }
    }

    render() {
        this.contentEl.empty();
        const progress = this.contentEl.createEl('div', { cls: 'lt-progress' });
        const fill = progress.createEl('div', { cls: 'lt-progress__fill' });
        fill.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;
        
        this.steps[this.step]();
        
        this.renderNavigation();
    }

    renderMain() {
        const h = this.contentEl.createEl('h2', { text: 'Основная информация' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Название порта')
            .addText(t => t.setValue(this.data.name).onChange(v => this.data.name = v));
        
        new Setting(this.contentEl)
            .setName('Описание')
            .addTextArea(t => t.setValue(this.data.description).onChange(v => this.data.description = v));
        
        new Setting(this.contentEl)
            .setName('Тип гавани')
            .addText(t => t.setValue(this.data.harborType).onChange(v => this.data.harborType = v));
        
        new Setting(this.contentEl)
            .setName('Количество причалов')
            .addText(t => t.setValue(this.data.docks).onChange(v => this.data.docks = v));
    }

    renderStatus() {
        const h = this.contentEl.createEl('h2', { text: 'Статус порта' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Статус')
            .addDropdown(d => {
                this.config.statuses = this.ensureStatuses(this.config.statuses);
                this.addDropdownOptions(d, this.config.statuses);
                d.setValue(this.data.status);
                d.onChange(v => this.data.status = v);
            });
        
        if (this.data.status !== 'действует') {
            new Setting(this.contentEl)
                .setName('Причина')
                .addText(t => t.setValue(this.data.statusReason).onChange(v => this.data.statusReason = v));
        }
    }

    renderLocation() {
        const h = this.contentEl.createEl('h2', { text: 'Расположение' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Климат')
            .addDropdown(d => {
                this.config.climates.forEach(climate => d.addOption(climate, climate));
                d.setValue(this.data.climate);
                d.onChange(v => this.data.climate = v);
            });
        
        new Setting(this.contentEl)
            .setName('Доминирующая фракция')
            .addDropdown(d => {
                this.config.factions.forEach(faction => d.addOption(faction, faction));
                d.setValue(this.data.dominantFaction);
                d.onChange(v => this.data.dominantFaction = v);
            });
        
        new Setting(this.contentEl)
            .setName('Государство')
            .addDropdown(d => {
                d.addOption('', 'Выберите государство');
                this.config.states.forEach(state => d.addOption(state, state));
                d.setValue(this.data.state);
                d.onChange(v => this.data.state = v);
            });
        
        new Setting(this.contentEl)
            .setName('Провинция (опционально)')
            .addDropdown(d => {
                d.addOption('', 'Выберите провинцию (опционально)');
                this.config.provinces.forEach(province => d.addOption(province, province));
                d.setValue(this.data.province);
                d.onChange(v => this.data.province = v);
            });
    }

    renderDetails() {
        const h = this.contentEl.createEl('h2', { text: 'Детали' });
        h.classList.add('lt-header');
        
        new Setting(this.contentEl)
            .setName('Основные товары (через запятую)')
            .addTextArea(t => t.setValue(this.data.mainGoods).onChange(v => this.data.mainGoods = v));
        
        new Setting(this.contentEl)
            .setName('Типы судов (через запятую)')
            .addTextArea(t => t.setValue(this.data.ships).onChange(v => this.data.ships = v));
        
        new Setting(this.contentEl)
            .setName('Особенности (каждая с новой строки)')
            .addTextArea(t => t.setValue(this.data.features).onChange(v => this.data.features = v));
    }

    renderPreview() {
        const h = this.contentEl.createEl('h2', { text: 'Предпросмотр' });
        h.classList.add('lt-header');
        
        const box = this.contentEl.createEl('div', { cls: 'lt-card' });
        box.createEl('div', { text: `Название: ${this.data.name || ''}` });
        box.createEl('div', { text: `Климат: ${this.data.climate || ''}` });
        box.createEl('div', { text: `Фракция: ${this.data.dominantFaction || ''}` });
        if (this.data.state) {
            box.createEl('div', { text: `Государство: ${this.data.state}` });
        }
    }

    validate() {
        if (this.step === 0) {
            if (!String(this.data.name || '').trim()) {
                new this.Notice('Введите название порта');
                return false;
            }
            if (!String(this.data.description || '').trim()) {
                new this.Notice('Введите описание порта');
                return false;
            }
        }
        if (this.step === 1) {
            if (!this.data.status) {
                new this.Notice('Выберите статус порта');
                return false;
            }
        }
        if (this.step === 2) {
            if (!this.data.climate) {
                new this.Notice('Выберите климат');
                return false;
            }
            if (!this.data.dominantFaction) {
                new this.Notice('Выберите доминирующую фракцию');
                return false;
            }
            if (!this.data.state) {
                new this.Notice('Выберите государство');
                return false;
            }
        }
        return true;
    }

    async finish() {
        const clean = s => String(s || '').trim();
        const list = s => clean(s).split(',').map(x => x.trim()).filter(Boolean);
        
        const name = clean(this.data.name);
        const cleanName = name.replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const date = (window.moment ? window.moment().format('YYYY-MM-DD') : new Date().toISOString().slice(0, 10));
        
        const data = {
            name,
            date,
            description: clean(this.data.description),
            climate: clean(this.data.climate),
            dominantFaction: clean(this.data.dominantFaction),
            harborType: clean(this.data.harborType),
            province: clean(this.data.province),
            state: clean(this.data.state),
            status: this.data.status,
            statusReason: clean(this.data.statusReason),
            docks: clean(this.data.docks),
            mainGoodsContent: list(this.data.mainGoods).map(x => `- ${x}`).join('\n'),
            shipsContent: list(this.data.ships).map(x => `- ${x}`).join('\n'),
            featuresContent: list(this.data.features).map(x => `- ${x}`).join('\n'),
            tagImage: ''
        };
        
        try {
            if (window.litSettingsService) {
                data.tagImage = window.litSettingsService.findTagImage(this.app, this.projectPath, 'Порт') || '';
            }
        } catch {}
        
        const content = await window.generateFromTemplate('Новый_порт', data, this.plugin);
        const folder = `${this.projectPath}/Порты`;
        
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
        
        new this.Notice(`Порт «${name}» создан.`);
        this.close();
        if (this.onFinish) this.onFinish();
    }
};

module.exports = { PortWizardModal };
