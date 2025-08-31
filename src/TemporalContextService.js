/**
 * @file       TemporalContextService.js
 * @description Сервис для управления временным контекстом
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, TimelineService, TemporalEntityService
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class TemporalContextService {
	constructor(plugin) {
		this.plugin = plugin;
	}

	/**
	 * Получить временной контекст для сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Object} Временной контекст
	 */
	async getTemporalContext(projectRoot, entityId) {
		const TimelineService = require('./TimelineService').TimelineService;
		const TemporalEntityService = require('./TemporalEntityService').TemporalEntityService;
		
		const timelineService = new TimelineService(this.plugin);
		const entityService = new TemporalEntityService(this.plugin);
		
		// Получаем все версии сущности
		const versions = await entityService.getEntityVersions(projectRoot, entityId);
		
		// Получаем все эпохи
		const epochs = await timelineService.getEpochs(projectRoot);
		
		// Создаем временной контекст
		const context = {
			entityId: entityId,
			versions: versions,
			epochs: epochs,
			temporalDependencies: [],
			temporalConstraints: []
		};
		
		// Определяем временные зависимости
		context.temporalDependencies = this.calculateTemporalDependencies(versions, epochs);
		
		// Определяем временные ограничения
		context.temporalConstraints = this.calculateTemporalConstraints(versions, epochs);
		
		return context;
	}

	/**
	 * Обновить временной контекст сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {Object} contextData - Данные временного контекста
	 * @returns {Object} Обновленный контекст
	 */
	async updateTemporalContext(projectRoot, entityId, contextData) {
		// В текущей реализации временной контекст вычисляется динамически
		// В будущем можно добавить возможность сохранения пользовательских настроек
		throw new Error('Временной контекст вычисляется динамически и не может быть обновлен напрямую');
	}

	/**
	 * Получить сущности с временными зависимостями
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Object} Объект с зависимостями
	 */
	async getTemporalDependencies(projectRoot, entityId) {
		const TemporalEntityService = require('./TemporalEntityService').TemporalEntityService;
		const TimelineService = require('./TimelineService').TimelineService;
		
		const entityService = new TemporalEntityService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		
		// Получаем сущность в активной эпохе
		const activeEpoch = await timelineService.getActiveEpoch(projectRoot);
		if (!activeEpoch) return { dependencies: [], dependents: [] };
		
		const entity = await entityService.getEntityAtEpoch(projectRoot, entityId, activeEpoch.id);
		if (!entity) return { dependencies: [], dependents: [] };
		
		// Анализируем связи с другими сущностями
		const dependencies = [];
		const dependents = [];
		
		// Проверяем ссылки на другие сущности в данных
		this.analyzeEntityLinks(entity, entityId, dependencies, dependents, projectRoot, entityService, timelineService);
		
		return {
			dependencies: [...new Set(dependencies)], // Убираем дубликаты
			dependents: [...new Set(dependents)]
		};
	}

	/**
	 * Проверить целостность временных зависимостей
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @returns {Array} Список конфликтов
	 */
	async checkTemporalIntegrity(projectRoot, epochId) {
		const TemporalEntityService = require('./TemporalEntityService').TemporalEntityService;
		const TimelineService = require('./TimelineService').TimelineService;
		
		const entityService = new TemporalEntityService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		
		const conflicts = [];
		
		// Получаем все сущности в эпохе
		const entities = await entityService.getEntitiesAtEpoch(projectRoot, epochId);
		
		// Проверяем каждую сущность на наличие временных конфликтов
		for (const entity of entities) {
			const entityConflicts = await this.checkEntityTemporalIntegrity(
				projectRoot, 
				entity.entityId, 
				epochId, 
				entityService, 
				timelineService
			);
			
			conflicts.push(...entityConflicts);
		}
		
		return conflicts;
	}

	/**
	 * Вычислить временные зависимости
	 * @param {Array} versions - Версии сущности
	 * @param {Array} epochs - Все эпохи
	 * @returns {Array} Временные зависимости
	 */
	calculateTemporalDependencies(versions, epochs) {
		const dependencies = [];
		
		// Сортируем версии по дате создания
		const sortedVersions = versions.sort((a, b) => 
			new Date(a.createdAt) - new Date(b.createdAt));
		
		// Для каждой версии определяем зависимости
		for (let i = 1; i < sortedVersions.length; i++) {
			const currentVersion = sortedVersions[i];
			const previousVersion = sortedVersions[i - 1];
			
			dependencies.push({
				fromVersion: previousVersion.versionId,
				toVersion: currentVersion.versionId,
				type: 'version_evolution',
				description: `Версия ${currentVersion.versionId} основана на версии ${previousVersion.versionId}`
			});
		}
		
		return dependencies;
	}

	/**
	 * Вычислить временные ограничения
	 * @param {Array} versions - Версии сущности
	 * @param {Array} epochs - Все эпохи
	 * @returns {Array} Временные ограничения
	 */
	calculateTemporalConstraints(versions, epochs) {
		const constraints = [];
		
		// Для каждой версии определяем ограничения
		for (const version of versions) {
			const epoch = epochs.find(e => e.id === version.epochId);
			if (epoch) {
				constraints.push({
					versionId: version.versionId,
					epochId: epoch.id,
					validFrom: epoch.startDate,
					validTo: epoch.endDate,
					type: 'temporal_validity',
					description: `Версия ${version.versionId} действительна в период ${epoch.startDate} - ${epoch.endDate}`
				});
			}
		}
		
		return constraints;
	}

	/**
	 * Анализировать ссылки на другие сущности в данных
	 * @param {Object} entity - Данные сущности
	 * @param {string} entityId - Идентификатор текущей сущности
	 * @param {Array} dependencies - Массив для добавления зависимостей
	 * @param {Array} dependents - Массив для добавления зависимых сущностей
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {Object} entityService - Сервис для работы с сущностями
	 * @param {Object} timelineService - Сервис для работы с временной шкалой
	 */
	analyzeEntityLinks(entity, entityId, dependencies, dependents, projectRoot, entityService, timelineService) {
		// Рекурсивно анализируем объект
		const analyzeObject = (obj, path = '') => {
			if (!obj) return;
			
			if (typeof obj === 'object') {
				// Проверяем, является ли объект ссылкой на сущность
				if (obj.entityId && obj.entityId !== entityId) {
					dependencies.push(obj.entityId);
				}
				
				// Рекурсивно анализируем вложенные объекты
				for (const key in obj) {
					if (obj.hasOwnProperty(key)) {
						analyzeObject(obj[key], `${path}.${key}`);
					}
				}
			} else if (typeof obj === 'string') {
				// Проверяем, содержит ли строка ссылки на сущности
				// Например, в формате [[entityId]] или [[entityId|displayText]]
				const entityLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
				let match;
				while ((match = entityLinkRegex.exec(obj)) !== null) {
					const linkedEntityId = match[1];
					if (linkedEntityId !== entityId) {
						dependencies.push(linkedEntityId);
					}
				}
			}
		};
		
		analyzeObject(entity);
	}

	/**
	 * Проверить целостность временных зависимостей для конкретной сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи
	 * @param {Object} entityService - Сервис для работы с сущностями
	 * @param {Object} timelineService - Сервис для работы с временной шкалой
	 * @returns {Array} Список конфликтов
	 */
	async checkEntityTemporalIntegrity(projectRoot, entityId, epochId, entityService, timelineService) {
		const conflicts = [];
		
		// Получаем зависимости сущности
		const dependencies = await this.getTemporalDependencies(projectRoot, entityId);
		
		// Проверяем, существуют ли зависимые сущности в текущей эпохе
		for (const dependencyId of dependencies.dependencies) {
			const dependencyEntity = await entityService.getEntityAtEpoch(projectRoot, dependencyId, epochId);
			if (!dependencyEntity) {
				conflicts.push({
					type: 'missing_dependency',
					entityId: entityId,
					dependencyId: dependencyId,
					epochId: epochId,
					description: `Сущность ${entityId} ссылается на ${dependencyId}, которая отсутствует в эпохе ${epochId}`
				});
			}
		}
		
		return conflicts;
	}
}

module.exports = { TemporalContextService };