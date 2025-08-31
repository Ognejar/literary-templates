/**
 * @file       TemporalAPI.js
 * @description API для работы с версиями лора и временными слоями
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, TimelineService, TemporalEntityService, TemporalContextService, MigrationService
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class TemporalAPI {
	constructor(plugin) {
		this.plugin = plugin;
		// Используем глобальные классы, доступные после сборки
		this.timelineService = new TimelineService(plugin);
		this.entityService = new TemporalEntityService(plugin);
		this.contextService = new TemporalContextService(plugin);
		this.migrationService = new MigrationService(plugin);
	}

	/**
	 * Получить список всех эпох
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Array} Массив эпох
	 */
	async getEpochs(projectRoot) {
		return await this.timelineService.getEpochs(projectRoot);
	}

	/**
	 * Получить информацию об эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @returns {Object} Объект эпохи
	 */
	async getEpoch(projectRoot, epochId) {
		return await this.timelineService.getEpoch(projectRoot, epochId);
	}

	/**
	 * Создать новую эпоху
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {Object} epochData - Данные новой эпохи
	 * @returns {Object} Созданная эпоха
	 */
	async createEpoch(projectRoot, epochData) {
		return await this.timelineService.createEpoch(projectRoot, epochData);
	}

	/**
	 * Обновить информацию об эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @param {Object} epochData - Обновленные данные эпохи
	 * @returns {Object} Обновленная эпоха
	 */
	async updateEpoch(projectRoot, epochId, epochData) {
		return await this.timelineService.updateEpoch(projectRoot, epochId, epochData);
	}

	/**
	 * Удалить эпоху
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 */
	async deleteEpoch(projectRoot, epochId) {
		return await this.timelineService.deleteEpoch(projectRoot, epochId);
	}

	/**
	 * Получить активную эпоху
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Активная эпоха
	 */
	async getActiveEpoch(projectRoot) {
		return await this.timelineService.getActiveEpoch(projectRoot);
	}

	/**
	 * Установить активную эпоху
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 */
	async setActiveEpoch(projectRoot, epochId) {
		return await this.timelineService.setActiveEpoch(projectRoot, epochId);
	}

	/**
	 * Получить сущность в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи (опционально)
	 * @returns {Object} Данные сущности
	 */
	async getEntityAtEpoch(projectRoot, entityId, epochId = null) {
		return await this.entityService.getEntityAtEpoch(projectRoot, entityId, epochId);
	}

	/**
	 * Создать или обновить версию сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи
	 * @param {Object} entityData - Данные сущности
	 * @param {string} userId - Идентификатор пользователя (опционально)
	 * @returns {Object} Обновленная версионированная сущность
	 */
	async upsertEntityVersion(projectRoot, entityId, epochId, entityData, userId = null) {
		return await this.entityService.upsertEntityVersion(projectRoot, entityId, epochId, entityData, userId);
	}

	/**
	 * Получить все версии сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Array} Массив версий
	 */
	async getEntityVersions(projectRoot, entityId) {
		return await this.entityService.getEntityVersions(projectRoot, entityId);
	}

	/**
	 * Получить все сущности в эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @returns {Array} Массив сущностей
	 */
	async getEntitiesAtEpoch(projectRoot, epochId) {
		return await this.entityService.getEntitiesAtEpoch(projectRoot, epochId);
	}

	/**
	 * Удалить версию сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} versionId - Идентификатор версии
	 */
	async deleteEntityVersion(projectRoot, entityId, versionId) {
		return await this.entityService.deleteEntityVersion(projectRoot, entityId, versionId);
	}

	/**
	 * Получить временной контекст сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Object} Временной контекст
	 */
	async getTemporalContext(projectRoot, entityId) {
		return await this.contextService.getTemporalContext(projectRoot, entityId);
	}

	/**
	 * Получить временные зависимости сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Object} Временные зависимости
	 */
	async getTemporalDependencies(projectRoot, entityId) {
		return await this.contextService.getTemporalDependencies(projectRoot, entityId);
	}

	/**
	 * Проверить целостность временных зависимостей
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @returns {Array} Список конфликтов
	 */
	async checkTemporalIntegrity(projectRoot, epochId) {
		return await this.contextService.checkTemporalIntegrity(projectRoot, epochId);
	}

	/**
	 * Проверить, нужна ли миграция
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {boolean} true, если нужна миграция
	 */
	async isMigrationNeeded(projectRoot) {
		return await this.migrationService.isMigrationNeeded(projectRoot);
	}

	/**
	 * Мигрировать проект на новую модель данных
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} baseEpochId - Идентификатор базовой эпохи (опционально)
	 * @returns {Object} Результат миграции
	 */
	async migrateProject(projectRoot, baseEpochId = null) {
		return await this.migrationService.migrateProject(projectRoot, baseEpochId);
	}

	/**
	 * Откатить миграцию
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Результат отката
	 */
	async rollbackMigration(projectRoot) {
		return await this.migrationService.rollbackMigration(projectRoot);
	}

	/**
	 * Проверить целостность данных после миграции
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Результат проверки
	 */
	async validateMigration(projectRoot) {
		return await this.migrationService.validateMigration(projectRoot);
	}

	/**
	 * Создать отчет о миграции
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Отчет о миграции
	 */
	async generateMigrationReport(projectRoot) {
		return await this.migrationService.generateMigrationReport(projectRoot);
	}

	/**
	 * Получить сводную информацию о состоянии временных слоев
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Сводная информация
	 */
	async getTemporalSummary(projectRoot) {
		const epochs = await this.getEpochs(projectRoot);
		const activeEpoch = await this.getActiveEpoch(projectRoot);
		const migrationNeeded = await this.isMigrationNeeded(projectRoot);
		
		return {
			epochsCount: epochs.length,
			activeEpoch: activeEpoch ? activeEpoch.name : null,
			migrationNeeded: migrationNeeded,
			epochsList: epochs.map(e => ({
				id: e.id,
				name: e.name,
				startDate: e.startDate,
				endDate: e.endDate,
				active: e.id === (activeEpoch ? activeEpoch.id : null)
			}))
		};
	}
}

module.exports = { TemporalAPI };