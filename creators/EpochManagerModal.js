/**
 * @file       EpochManagerModal.js
 * @description Модальное окно для управления временными периодами (эпохами)
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, TemporalAPI
 * @created    2025-08-29
 * @updated    2025-08-29
 */

const { Modal, Setting, TextComponent, TextAreaComponent, moment, Notice } = require('obsidian');
const { TemporalAPI } = require('../src/TemporalAPI');

class EpochManagerModal extends Modal {
	constructor(app, plugin, projectRoot) {
		super(app);
		this.plugin = plugin;
		this.projectRoot = projectRoot;
		this.temporalAPI = new TemporalAPI(plugin);
		this.epochs = [];
		this.activeEpoch = null;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('epoch-manager-modal');

		// Заголовок
		contentEl.createEl('h2', { text: 'Управление временными периодами' });

		// Загружаем данные
		await this.loadEpochs();

		// Отображаем активную эпоху
		this.renderActiveEpoch(contentEl);

		// Отображаем список эпох
		this.renderEpochList(contentEl);

		// Форма для создания новой эпохи
		this.renderCreateEpochForm(contentEl);

		// Кнопка закрытия
		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Закрыть')
				.onClick(() => this.close()));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	/**
	 * Загрузить список эпох
	 */
	async loadEpochs() {
		try {
			this.epochs = await this.temporalAPI.getEpochs(this.projectRoot);
			this.activeEpoch = await this.temporalAPI.getActiveEpoch(this.projectRoot);
		} catch (error) {
			console.error('Ошибка загрузки эпох:', error);
			this.epochs = [];
			this.activeEpoch = null;
		}
	}

	/**
	 * Отобразить активную эпоху
	 * @param {HTMLElement} container - Контейнер для отображения
	 */
	renderActiveEpoch(container) {
		const activeEpochEl = container.createEl('div', { cls: 'active-epoch-section' });
		activeEpochEl.createEl('h3', { text: 'Активный период' });

		if (this.activeEpoch) {
			const epochInfo = activeEpochEl.createEl('div', { cls: 'epoch-info' });
			epochInfo.createEl('div', { 
				text: `${this.activeEpoch.name} (${this.activeEpoch.startYear || this.activeEpoch.startDate || 0} - ${this.activeEpoch.endYear || this.activeEpoch.endDate || 1000})`,
				cls: 'epoch-name'
			});
			epochInfo.createEl('div', { 
				text: this.activeEpoch.description || 'Нет описания',
				cls: 'epoch-description'
			});
		} else {
			activeEpochEl.createEl('div', { 
				text: 'Нет активного периода',
				cls: 'no-active-epoch'
			});
		}
	}

	/**
	 * Отобразить список эпох
	 * @param {HTMLElement} container - Контейнер для отображения
	 */
	renderEpochList(container) {
		const epochsSection = container.createEl('div', { cls: 'epochs-list-section' });
		epochsSection.createEl('h3', { text: 'Все периоды' });

		if (this.epochs.length === 0) {
			epochsSection.createEl('div', { 
				text: 'Нет созданных периодов',
				cls: 'no-epochs'
			});
			return;
		}

		const epochsList = epochsSection.createEl('div', { cls: 'epochs-list' });

		// Сортируем эпохи по году начала
		const sortedEpochs = [...this.epochs].sort((a, b) => 
			(a.startYear || a.startDate || 0) - (b.startYear || b.startDate || 0));

		sortedEpochs.forEach(epoch => {
			const epochItem = epochsList.createEl('div', { 
				cls: 'epoch-item' + (epoch.id === (this.activeEpoch ? this.activeEpoch.id : null) ? ' active' : '')
			});

			// Название и даты
			const epochHeader = epochItem.createEl('div', { cls: 'epoch-header' });
			epochHeader.createEl('div', { 
				text: epoch.name,
				cls: 'epoch-title'
			});
			epochHeader.createEl('div', { 
				text: `${epoch.startYear || epoch.startDate || 0} - ${epoch.endYear || epoch.endDate || 1000}`,
				cls: 'epoch-dates'
			});

			// Описание
			if (epoch.description) {
				epochItem.createEl('div', { 
					text: epoch.description,
					cls: 'epoch-description'
				});
			}

			// Кнопки управления
			const actions = epochItem.createEl('div', { cls: 'epoch-actions' });

			// Кнопка активации
			if (epoch.id !== (this.activeEpoch ? this.activeEpoch.id : null)) {
				actions.createEl('button', { 
					text: 'Сделать активным',
					cls: 'activate-btn'
				}).addEventListener('click', async () => {
					await this.setActiveEpoch(epoch.id);
				});
			}

			// Кнопка редактирования
			actions.createEl('button', { 
				text: 'Редактировать',
				cls: 'edit-btn'
			}).addEventListener('click', () => {
				this.openEditEpochModal(epoch);
			});

			// Кнопка удаления
			if (epoch.id !== (this.activeEpoch ? this.activeEpoch.id : null)) {
				actions.createEl('button', { 
					text: 'Удалить',
					cls: 'delete-btn'
				}).addEventListener('click', async () => {
				await this.deleteEpoch(epoch.id);
			});
			}
		});
	}

	/**
	 * Отобразить форму создания новой эпохи
	 * @param {HTMLElement} container - Контейнер для отображения
	 */
	renderCreateEpochForm(container) {
		const formSection = container.createEl('div', { cls: 'create-epoch-section' });
		formSection.createEl('h3', { text: 'Создать новый период' });

		let epochName = '';
		let startDate = '';
		let endDate = '';
		let description = '';

		const form = formSection.createEl('div', { cls: 'epoch-form' });

		// Поле названия
		new Setting(form)
			.setName('Название периода')
			.addText(text => text
				.setPlaceholder('Введите название')
				.onChange(value => epochName = value));

		// Поле года начала
		new Setting(form)
			.setName('Год начала')
			.addText(text => text
				.setPlaceholder('ГГГГ')
				.onChange(value => startDate = value));

		// Поле года окончания
		new Setting(form)
			.setName('Год окончания')
			.addText(text => text
				.setPlaceholder('ГГГГ')
				.onChange(value => endDate = value));

		// Поле описания
		new Setting(form)
			.setName('Описание')
			.addTextArea(text => text
				.setPlaceholder('Введите описание периода')
				.onChange(value => description = value));

		// Кнопка создания
		new Setting(form)
			.addButton(button => button
				.setButtonText('Создать период')
				.setCta()
				.onClick(async () => {
				if (!epochName || !startDate || !endDate) {
					new Notice('Пожалуйста, заполните все обязательные поля');
					return;
				}

					try {
						await this.createEpoch({
							name: epochName,
							startDate: startDate,
							endDate: endDate,
							description: description
						});
					} catch (error) {
					console.error('Ошибка создания периода:', error);
					new Notice('Ошибка создания периода');
				}
				}));
	}

	/**
	 * Создать новую эпоху
	 * @param {Object} epochData - Данные новой эпохи
	 */
	async createEpoch(epochData) {
	try {
		await this.temporalAPI.createEpoch(this.projectRoot, epochData);
		new Notice('Период успешно создан');
		await this.refresh();
	} catch (error) {
			throw new Error('Не удалось создать период: ' + error.message);
		}
	}

	/**
	 * Установить активную эпоху
	 * @param {string} epochId - Идентификатор эпохи
	 */
	async setActiveEpoch(epochId) {
	try {
		await this.temporalAPI.setActiveEpoch(this.projectRoot, epochId);
		new Notice('Активный период успешно изменен');
		await this.refresh();
} catch (error) {
	console.error('Ошибка установки активного периода:', error);
	new Notice('Ошибка установки активного периода');
}
	}

	/**
	 * Удалить эпоху
	 * @param {string} epochId - Идентификатор эпохи
	 */
	async deleteEpoch(epochId) {
	try {
		await this.temporalAPI.deleteEpoch(this.projectRoot, epochId);
		new Notice('Период успешно удален');
		await this.refresh();
} catch (error) {
	console.error('Ошибка удаления периода:', error);
	new Notice('Ошибка удаления периода');
}
	}

	/**
	 * Открыть модальное окно редактирования эпохи
	 * @param {Object} epoch - Объект эпохи для редактирования
	 */
	openEditEpochModal(epoch) {
		const modal = new EditEpochModal(this.app, this.plugin, this.projectRoot, epoch);
		modal.onClose = async () => {
			await this.refresh();
		};
		modal.open();
	}

	/**
	 * Обновить отображение данных
	 */
	async refresh() {
		await this.loadEpochs();
		this.contentEl.empty();
		this.onOpen();
	}
}

class EditEpochModal extends Modal {
	constructor(app, plugin, projectRoot, epoch) {
		super(app);
		this.plugin = plugin;
		this.projectRoot = projectRoot;
		this.temporalAPI = new TemporalAPI(plugin);
		this.epoch = epoch;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('edit-epoch-modal');

		// Заголовок
		contentEl.createEl('h2', { text: 'Редактировать период' });

		let epochName = this.epoch.name;
		let startDate = this.epoch.startYear || this.epoch.startDate || '';
		let endDate = this.epoch.endYear || this.epoch.endDate || '';
		let description = this.epoch.description || '';

		const form = contentEl.createEl('div', { cls: 'epoch-form' });

		// Поле названия
		new Setting(form)
			.setName('Название периода')
			.addText(text => text
				.setPlaceholder('Введите название')
				.setValue(epochName)
				.onChange(value => epochName = value));

		// Поле года начала
		new Setting(form)
			.setName('Год начала')
			.addText(text => text
				.setPlaceholder('ГГГГ')
				.setValue(startDate)
				.onChange(value => startDate = value));

		// Поле года окончания
		new Setting(form)
			.setName('Год окончания')
			.addText(text => text
				.setPlaceholder('ГГГГ')
				.setValue(endDate)
				.onChange(value => endDate = value));

		// Поле описания
		new Setting(form)
			.setName('Описание')
			.addTextArea(text => text
				.setPlaceholder('Введите описание периода')
				.setValue(description)
				.onChange(value => description = value));

		// Кнопки управления
		const buttons = new Setting(form);

		// Кнопка сохранения
		buttons.addButton(button => button
			.setButtonText('Сохранить')
		.setCta()
		.onClick(async () => {
			if (!epochName || !startDate || !endDate) {
				new Notice('Пожалуйста, заполните все обязательные поля');
				return;
			}

				try {
					await this.temporalAPI.updateEpoch(this.projectRoot, this.epoch.id, {
						name: epochName,
						startDate: startDate,
						endDate: endDate,
						description: description
					});
				new Notice('Период успешно обновлен');
				this.close();
			} catch (error) {
				console.error('Ошибка обновления периода:', error);
				new Notice('Ошибка обновления периода');
			}
			}));

		// Кнопка отмены
		buttons.addButton(button => button
			.setButtonText('Отмена')
			.onClick(() => this.close()));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Делаем класс доступным глобально
if (typeof window !== 'undefined') {
window.EpochManagerModal = EpochManagerModal;
}

module.exports = { EpochManagerModal };