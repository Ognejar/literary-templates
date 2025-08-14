/**
 * @file       VillageWizardModal.js
 * @description Модальное окно мастера для создания новой деревни.
 * @author     Cursor
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, ../utils/modals
 * @created    [дата создания]
 * @updated    [дата последнего изменения]
 * @docs       /docs/project.md
 */

const { Modal, Setting } = require('obsidian');
const { EntityWizardBase } = require('./EntityWizardBase.js');

class VillageWizardModal extends EntityWizardBase {
    constructor(app, ModalClass, SettingClass, NoticeClass, autocompleteData, onFinish) {
        super(app, ModalClass, SettingClass, NoticeClass);
        this.autocompleteData = autocompleteData; // { provincesList }
        this.onFinish = onFinish;
        this.state = {
            step: 0,
            villageName: '',
            climate: '',
            faction: '',
            province: '',
            status: 'действует', // действует, заброшено, разрушено
            statusReason: '', // причина заброшенности/разрушения
            description: '',
            population: '',
            mainCrops: [],
            crafts: [],
            features: [],
        };
        this.steps = [
            'Название деревни',
            'Статус деревни',
            'Климат и фракция',
            'Провинция',
            'Описание и население',
            'Сельское хозяйство',
            'Особенности',
            'Предпросмотр',
        ];
    }
    
    onOpen() {
        // Добавляем общие стили для модального окна
        this.applyBaseUI();
        this.modalEl.style.cssText = `
            max-width: 900px !important;
            width: 900px !important;
        `;
        this.contentEl.style.cssText = `
            padding: 20px;
            max-width: 900px !important;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // Загружаем справочники из settingsService, если доступен
        try {
            const svc = window.litSettingsService;
            const projectRoot = this.autocompleteData?.projectRoot;
            if (svc && projectRoot) {
                // Заполняем климат и фракции из текущего проекта
                // Выполняем синхронно-асинхронный запуск: значения подставим при первом рендере
                Promise.all([
                    svc.getClimates(this.app, projectRoot),
                    svc.getFactions(this.app, projectRoot)
                ]).then(([climates, factions]) => {
                    this._climates = climates;
                    this._factions = factions;
                    this.render();
                }).catch(() => this.render());
            }
        } catch {}

        this.render();
    }
    
    render() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Индикатор прогресса
        const progress = contentEl.createDiv('progress-indicator');
        progress.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--background-secondary);
            border-radius: 8px;
        `;
        
        this.steps.forEach((step, index) => {
            const stepEl = progress.createDiv('step');
            stepEl.style.cssText = `
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: ${index === this.state.step ? '600' : '400'};
                color: ${index === this.state.step ? 'var(--text-on-accent)' : 'var(--text-muted)'};
                background: ${index === this.state.step ? 'var(--interactive-accent)' : 'transparent'};
            `;
            stepEl.textContent = step;
        });
        
        // Основной контент
        switch (this.state.step) {
            case 0: this.renderVillageName(contentEl); break;
            case 1: this.renderStatus(contentEl); break;
            case 2: this.renderClimateFaction(contentEl); break;
            case 3: this.renderProvince(contentEl); break;
            case 4: this.renderDescriptionPopulation(contentEl); break;
            case 5: this.renderAgriculture(contentEl); break;
            case 6: this.renderFeatures(contentEl); break;
            case 7: this.renderPreview(contentEl); break;
        }
    }
    
    renderVillageName(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Название деревни' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🏘️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Введите название деревни. Это будет основным идентификатором для создания файла и навигации в проекте.
            </div>
        `;
        
        const input = el.createEl('input', { 
            type: 'text', 
            value: this.state.villageName, 
            placeholder: 'Введите название деревни' 
        });
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        input.addEventListener('input', e => { this.state.villageName = input.value; });
        
        this.renderNav(el, () => {
            if (!this.state.villageName.trim()) {
                new this.Notice('Название деревни обязательно!');
                return;
            }
            this.state.step++;
            this.render();
        });
    }

    renderStatus(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Статус деревни' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🏚️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите статус деревни. Для заброшенных или разрушенных деревень укажите причину.
            </div>
        `;
        
        // Статус
        el.createEl('h3', { text: 'Статус' });
        const statuses = [
            { value: 'действует', label: '✅ Действует', icon: '✅' },
            { value: 'заброшено', label: '🏚️ Заброшено', icon: '🏚️' },
            { value: 'разрушено', label: '💥 Разрушено', icon: '💥' }
        ];
        const statusContainer = el.createDiv();
        statusContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        `;
        statuses.forEach(status => {
            const btn = statusContainer.createEl('button', { text: status.label });
            btn.style.cssText = `
                padding: 8px 16px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: ${this.state.status === status.value ? 'var(--interactive-accent)' : 'var(--background-primary)'};
                color: ${this.state.status === status.value ? 'var(--text-on-accent)' : 'var(--text-normal)'};
                cursor: pointer;
                font-size: 14px;
            `;
            btn.addEventListener('click', () => {
                this.state.status = status.value;
                this.render();
            });
        });
        
        // Причина (показывается только для недействующих статусов)
        if (this.state.status !== 'действует') {
            el.createEl('h3', { text: 'Причина' });
            const reasonInput = el.createEl('input', { 
                type: 'text', 
                value: this.state.statusReason, 
                placeholder: 'Например: Война, эпидемия, миграция' 
            });
            reasonInput.style.cssText = `
                width: 100%;
                padding: 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 16px;
                background: var(--background-primary);
                color: var(--text-normal);
                margin-bottom: 20px;
            `;
            reasonInput.addEventListener('input', e => { this.state.statusReason = reasonInput.value; });
        }
        
        this.renderNav(el, () => {
            if (this.state.status !== 'действует' && !this.state.statusReason.trim()) {
                new this.Notice('Укажите причину для недействующего статуса!');
                return;
            }
            this.state.step++;
            this.render();
        });
    }
    
    renderClimateFaction(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Климат и фракция' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🌍 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите климатическую зону и политическую фракцию, к которой принадлежит деревня. Это повлияет на экономику, культуру и особенности региона.
            </div>
        `;
        
        // Климат
        el.createEl('h3', { text: 'Климат' });
        const climates = (this._climates && this._climates.length) ? this._climates : ['Умеренный', 'Холодный', 'Тёплый', 'Засушливый', 'Влажный', 'Горный'];
        const climateContainer = el.createDiv();
        climateContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        `;
        climates.forEach(climate => {
            const btn = climateContainer.createEl('button', { text: climate });
            btn.style.cssText = `
                padding: 8px 16px;
                margin: 0;
                background: ${this.state.climate === climate ? 'var(--interactive-accent)' : 'var(--background-secondary)'};
                color: ${this.state.climate === climate ? 'var(--text-on-accent)' : 'var(--text-normal)'};
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            btn.addEventListener('mouseenter', () => {
                if (this.state.climate !== climate) {
                    btn.style.background = 'var(--background-modifier-hover)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (this.state.climate !== climate) {
                    btn.style.background = 'var(--background-secondary)';
                }
            });
            btn.onclick = () => {
                this.state.climate = climate;
                this.render();
            };
        });
        
        // Фракция
        el.createEl('h3', { text: 'Фракция' });
        const factions = (this._factions && this._factions.length) ? this._factions : ['Велюградия', 'Галиндия', 'Драконий хребет', 'Краковей', 'Другое'];
        const factionContainer = el.createDiv();
        factionContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        `;
        factions.forEach(faction => {
            const btn = factionContainer.createEl('button', { text: faction });
            btn.style.cssText = `
                padding: 8px 16px;
                margin: 0;
                background: ${this.state.faction === faction ? 'var(--interactive-accent)' : 'var(--background-secondary)'};
                color: ${this.state.faction === faction ? 'var(--text-on-accent)' : 'var(--text-normal)'};
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            btn.addEventListener('mouseenter', () => {
                if (this.state.faction !== faction) {
                    btn.style.background = 'var(--background-modifier-hover)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (this.state.faction !== faction) {
                    btn.style.background = 'var(--background-secondary)';
                }
            });
            btn.onclick = () => {
                this.state.faction = faction;
                this.render();
            };
        });
        
        this.renderNav(el, () => {
            if (!this.state.climate || !this.state.faction) {
                new this.Notice('Выберите климат и фракцию!');
                return;
            }
            this.state.step++;
            this.render();
        }, true);
    }
    
    renderProvince(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Провинция' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🗺️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Выберите провинцию из списка или введите название вручную. Провинция определяет административную принадлежность и региональные особенности.
            </div>
        `;
        
        // Проверяем, не является ли фракция названием провинции
        if (this.state.faction && (this.state.faction.includes('Велюградия') || this.state.faction.includes('Галиндия') || this.state.faction.includes('Драконий хребет'))) {
            this.state.province = this.state.faction;
            const autoProvince = el.createEl('p', { text: `Автоматически выбрана провинция: ${this.state.province}` });
            autoProvince.style.cssText = `
                padding: 10px;
                background: var(--background-secondary);
                border-radius: 6px;
                color: var(--text-accent);
                font-weight: 500;
            `;
        } else {
            // Список провинций из автозаполнения
            if (this.autocompleteData.provincesList.length > 0) {
                el.createEl('h3', { text: 'Выберите провинцию:' });
                const provinceContainer = el.createDiv();
                provinceContainer.style.cssText = `
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 20px;
                `;
                this.autocompleteData.provincesList.forEach(province => {
                    const btn = provinceContainer.createEl('button', { text: province });
                    btn.style.cssText = `
                        padding: 8px 16px;
                        margin: 0;
                        background: ${this.state.province === province ? 'var(--interactive-accent)' : 'var(--background-secondary)'};
                        color: ${this.state.province === province ? 'var(--text-on-accent)' : 'var(--text-normal)'};
                        border: 1px solid var(--background-modifier-border);
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `;
                    btn.addEventListener('mouseenter', () => {
                        if (this.state.province !== province) {
                            btn.style.background = 'var(--background-modifier-hover)';
                        }
                    });
                    btn.addEventListener('mouseleave', () => {
                        if (this.state.province !== province) {
                            btn.style.background = 'var(--background-secondary)';
                        }
                    });
                    btn.onclick = () => {
                        this.state.province = province;
                        this.render();
                    };
                });
            }
            
            // Ручной ввод
            el.createEl('h3', { text: 'Или введите вручную:' });
            const input = el.createEl('input', { 
                type: 'text', 
                value: this.state.province, 
                placeholder: 'Название провинции' 
            });
            input.style.cssText = `
                width: 100%;
                padding: 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 16px;
                background: var(--background-primary);
                color: var(--text-normal);
            `;
            input.addEventListener('input', e => { this.state.province = input.value; });
        }
        
        this.renderNav(el, () => {
            if (!this.state.province.trim()) {
                new this.Notice('Укажите провинцию!');
                return;
            }
            this.state.step++;
            this.render();
        }, true);
    }
    
    renderDescriptionPopulation(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Описание и население' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">📝 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Опишите внешний вид, атмосферу и особенности деревни. Укажите примерную численность населения для понимания масштаба поселения.
            </div>
        `;
        
        // Описание
        el.createEl('h3', { text: 'Описание деревни' });
        const descInput = el.createEl('textarea', { 
            value: this.state.description, 
            placeholder: 'Опишите деревню' 
        });
        descInput.style.cssText = `
            width: 100%;
            height: 100px;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
            resize: vertical;
        `;
        descInput.addEventListener('input', e => { this.state.description = descInput.value; });
        
        // Население
        el.createEl('h3', { text: 'Численность населения' });
        const popInput = el.createEl('input', { 
            type: 'text', 
            value: this.state.population, 
            placeholder: 'Например: 150 человек' 
        });
        popInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        popInput.addEventListener('input', e => { this.state.population = popInput.value; });
        
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    
    renderAgriculture(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Сельское хозяйство' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🌾 Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Укажите основные сельскохозяйственные культуры и ремёсла, которыми занимаются жители деревни. Это определяет экономическую специализацию поселения.
            </div>
        `;
        
        // Основные культуры
        el.createEl('h3', { text: 'Основные культуры' });
        const cropsInput = el.createEl('input', { 
            type: 'text', 
            value: this.state.mainCrops.join(', '), 
            placeholder: 'Пшеница, рожь, картофель' 
        });
        cropsInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        cropsInput.addEventListener('input', e => { 
            this.state.mainCrops = cropsInput.value.split(',').map(s => s.trim()).filter(Boolean); 
        });
        
        // Ремёсла
        el.createEl('h3', { text: 'Ремёсла' });
        const craftsInput = el.createEl('input', { 
            type: 'text', 
            value: this.state.crafts.join(', '), 
            placeholder: 'Кузнечное дело, ткачество, гончарство' 
        });
        craftsInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        craftsInput.addEventListener('input', e => { 
            this.state.crafts = craftsInput.value.split(',').map(s => s.trim()).filter(Boolean); 
        });
        
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    
    renderFeatures(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Особенности деревни' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">🏛️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Укажите уникальные особенности деревни: достопримечательности, важные здания, природные объекты или исторические события, связанные с этим местом.
            </div>
        `;
        
        el.createEl('h3', { text: 'Особенности деревни' });
        const featuresInput = el.createEl('input', { 
            type: 'text', 
            value: this.state.features.join(', '), 
            placeholder: 'Старая мельница, священная роща, торговый путь' 
        });
        featuresInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            font-size: 16px;
            background: var(--background-primary);
            color: var(--text-normal);
        `;
        featuresInput.addEventListener('input', e => { 
            this.state.features = featuresInput.value.split(',').map(s => s.trim()).filter(Boolean); 
        });
        
        this.renderNav(el, () => {
            this.state.step++;
            this.render();
        }, true);
    }
    
    renderPreview(el) {
        // Стилизованный заголовок
        const header = el.createEl('h2', { text: 'Предпросмотр' });
        header.style.cssText = `
            margin: 20px 0;
            color: var(--text-accent);
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid var(--background-modifier-border);
            padding-bottom: 10px;
        `;
        
        // Справка
        const help = el.createDiv('help-section');
        help.style.cssText = `
            background: var(--background-secondary-alt);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--interactive-accent);
        `;
        help.innerHTML = `
            <div style="font-weight: 600; color: var(--text-accent); margin-bottom: 8px;">👁️ Справка</div>
            <div style="color: var(--text-muted); font-size: 14px;">
                Проверьте итоговый результат перед созданием файла. Все данные будут сохранены в формате Markdown с автоматическими связями и метаданными.
            </div>
        `;
        
        const cleanName = this.state.villageName.trim().replace(/[^а-яА-ЯёЁ\w\s-.]/g, '').replace(/\s+/g, '_');
        const mainCropsContent = this.state.mainCrops.map(crop => `- ${crop}`).join('\n');
        const craftsContent = this.state.crafts.map(craft => `- ${craft}`).join('\n');
        const featuresContent = this.state.features.map(feature => `- ${feature}`).join('\n');
        const descriptionBlock = this.state.description.trim() ? this.state.description : `[[${cleanName}_Описание|Описание деревни]]`;
        const preview = `---\ncreated: "${window.moment().format('YYYY-MM-DD')}"\nname: "${cleanName}"\naliases: ["${cleanName}"]\ntype: "Деревня"\nclimate: "${this.state.climate}"\ntags: [place, village]\nfaction: "${this.state.faction}"\nprovince: "${this.state.province}"\n---\n\n# ${this.state.villageName}\n\n**Тип:** Деревня  \n**Климат:** ${this.state.climate}  \n**Фракция:** ${this.state.faction}  \n**Провинция:** [[${this.state.province}]]\n\n## Описание\n${descriptionBlock}\n\n## Население\n- **Численность:** ${this.state.population}\n- **Основные занятия:** Сельское хозяйство, ремёсла\n\n## Сельское хозяйство\n### Основные культуры\n${mainCropsContent}\n\n### Ремёсла\n${craftsContent}\n\n## Экономика\n- **Основные отрасли:** Сельское хозяйство\n- **Торговля:** Продукты питания, ремесленные изделия\n- **Связи:** Зависимость от ближайшего города\n\n## Культура\n- **Религия:** Обычно связана с ближайшим храмом\n- **Обычаи:** Сельские традиции\n- **Праздники:** Связаны с сельскохозяйственным циклом\n\n## Современные проблемы\n- **Затопление:** \n- **Миграция в города:** \n- **Экономические трудности:** \n\n## Автоматические связи\n### Обитатели\n\`\`\`dataview\nLIST FROM #people OR #character\nWHERE (\n    contains(file.outlinks, [[${cleanName}]]) OR\n    contains(file.tags, "${cleanName}") OR\n    regexmatch(file.text, "#${cleanName}") OR\n    regexmatch(file.text, "\\[\\[${cleanName}(\\||\\]\\])")\n) AND file.name != this.file.name\n\`\`\`\n\n### Населённые пункты\n\`\`\`dataview\nLIST FROM #place\nWHERE (\n    contains(file.outlinks, [[${cleanName}]]) OR\n    contains(file.tags, "${cleanName}") OR\n    regexmatch(file.text, "#${cleanName}") OR\n    regexmatch(file.text, "\\[\\[${cleanName}(\\||\\]\\])")\n    AND (type = "Город" OR type = "Деревня")\n    AND file.name != this.file.name\n)\n\`\`\`\n\n### Подлокации\n\`\`\`dataview\nLIST FROM #place\nWHERE (\n    (contains(file.outlinks, [[${cleanName}]]) OR\n     contains(file.tags, "${cleanName}") OR\n     regexmatch(file.text, "#${cleanName}") OR\n     regexmatch(file.text, "\\[\\[${cleanName}(\\||\\]\\])")\n    AND (type != "Город" AND type != "Деревня")\n    AND file.name != this.file.name\n)\n\`\`\`\n\n## Особенности\n${featuresContent}`;
        
        // Стилизованный предпросмотр
        const previewContainer = el.createDiv('preview-content');
        previewContainer.style.cssText = `
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        const previewEl = previewContainer.createEl('pre', { text: preview });
        previewEl.style.cssText = `
            margin: 0;
            white-space: pre-wrap;
            font-family: var(--font-monospace);
            font-size: 12px;
            color: var(--text-normal);
        `;
        
        this.renderNav(el, null, true, true);
    }
    
    renderNav(el, onNext, showBack = false, showOnlyBack = false) {
        const nav = el.createDiv('nav-buttons');
        nav.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--background-modifier-border);
        `;
        
        const leftButtons = nav.createDiv('nav-left');
        const rightButtons = nav.createDiv('nav-right');
        
        if (showBack && this.state.step > 0) {
            const prevBtn = leftButtons.createEl('button', { text: '← Назад' });
            prevBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--background-secondary);
                color: var(--text-muted);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            prevBtn.addEventListener('mouseenter', () => {
                prevBtn.style.background = 'var(--background-modifier-hover)';
            });
            prevBtn.addEventListener('mouseleave', () => {
                prevBtn.style.background = 'var(--background-secondary)';
            });
            prevBtn.onclick = () => {
                this.state.step--;
                this.render();
            };
        }
        
        if (onNext && !showOnlyBack) {
            const nextBtn = rightButtons.createEl('button', { text: 'Далее →' });
            nextBtn.style.cssText = `
                padding: 8px 16px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            nextBtn.addEventListener('mouseenter', () => {
                nextBtn.style.background = 'var(--interactive-accent-hover)';
            });
            nextBtn.addEventListener('mouseleave', () => {
                nextBtn.style.background = 'var(--interactive-accent)';
            });
            nextBtn.onclick = onNext;
        } else if (showOnlyBack) {
            const finishBtn = rightButtons.createEl('button', { text: '✓ Создать деревню' });
            finishBtn.style.cssText = `
                padding: 10px 20px;
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
            finishBtn.addEventListener('mouseenter', () => {
                finishBtn.style.background = 'var(--interactive-accent-hover)';
            });
            finishBtn.addEventListener('mouseleave', () => {
                finishBtn.style.background = 'var(--interactive-accent)';
            });
            finishBtn.onclick = () => {
                this.onFinish(this.state);
                this.close();
            };
        }
    }
}

module.exports = VillageWizardModal;