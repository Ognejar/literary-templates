/**
 * @file       TemporalEntityService.js
 * @description Сервис для работы с версионированными сущностями
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, LoreDBService, TimelineService
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class TemporalEntityService {
	constructor(plugin) {
		this.plugin = plugin;
	}

	/**
	 * Получить сущность в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи (опционально, по умолчанию активная)
	 * @returns {Object|null} Данные сущности или null, если не найдена
	 */
	async getEntityAtEpoch(projectRoot, entityId, epochId = null) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const TimelineService = require('./TimelineService').TimelineService;
		
		const dbService = new LoreDBService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		
		// Если не указана эпоха, получаем активную
		if (!epochId) {
			const activeEpoch = await timelineService.getActiveEpoch(projectRoot);
			if (!activeEpoch) return null;
			epochId = activeEpoch.id;
		}
		
		// Ищем версионированную сущность
		const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		if (!temporalEntity) return null;
		
		// Ищем версию, соответствующую заданной эпохе
		// Сначала ищем прямое совпадение по эпохе
		let version = temporalEntity.versions.find(v => v.epochId === epochId);
		
		// Если нет точного совпадения, ищем последнюю версию до этой эпохи
		if (!version) {
			// Получаем все эпохи и сортируем их по дате
			const timeline = await timelineService.loadTimeline(projectRoot);
			const sortedEpochs = timeline.epochs.sort((a, b) => 
				new Date(a.startDate) - new Date(b.startDate));
			
			// Находим индекс текущей эпохи
			const epochIndex = sortedEpochs.findIndex(e => e.id === epochId);
			
			// Ищем последнюю версию в предыдущих эпохах
			for (let i = epochIndex - 1; i >= 0; i--) {
				const prevEpochId = sortedEpochs[i].id;
				version = temporalEntity.versions.find(v => v.epochId === prevEpochId);
				if (version) break;
			}
		}
		
		if (!version) return null;
		
		return this.mergeVersionData(version, temporalEntity.versions);
	}
	
	/**
	 * Создать или обновить версию сущности в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи
	 * @param {Object} entityData - Данные сущности
	 * @param {string} userId - Идентификатор пользователя (опционально)
	 * @returns {Object} Обновленная версионированная сущность
	 */
	async upsertEntityVersion(projectRoot, entityId, epochId, entityData, userId = null) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const TimelineService = require('./TimelineService').TimelineService;
		
		const dbService = new LoreDBService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		
		// Проверяем, что эпоха существует
		const epoch = await timelineService.getEpoch(projectRoot, epochId);
		if (!epoch) {
			throw new Error(`Эпоха с ID ${epochId} не найдена`);
		}
		
		const db = await dbService.loadDB(projectRoot);
		
		// Ищем существующую версионированную сущность
		let temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		
		if (!temporalEntity) {
			// Создаем новую версионированную сущность
			temporalEntity = {
				entityId: entityId,
				type: entityData.type || 'unknown',
				versions: []
			};
			db.temporalEntities.push(temporalEntity);
		}
		
		// Создаем новую версию
		const newVersion = {
			versionId: this.generateVersionId(),
			epochId: epochId,
			data: entityData,
			createdAt: new Date().toISOString(),
			createdBy: userId || 'system'
		};
		
		// Если у сущности уже есть версии в этой эпохе, наследуемся от последней
		const existingVersionsInEpoch = temporalEntity.versions
			.filter(v => v.epochId === epochId)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
			
		if (existingVersionsInEpoch.length > 0) {
			const latestVersion = existingVersionsInEpoch[0];
			newVersion.basedOn = latestVersion.versionId;
		}
		
		temporalEntity.versions.push(newVersion);
		
		await dbService.saveDB(projectRoot, db);
		return temporalEntity;
	}
	
	/**
	 * Получить все версии сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Array} Массив версий сущности
	 */
	async getEntityVersions(projectRoot, entityId) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		return temporalEntity ? temporalEntity.versions : [];
	}
	
	/**
	 * Получить все сущности в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} epochId - Идентификатор эпохи
	 * @returns {Array} Массив сущностей
	 */
	async getEntitiesAtEpoch(projectRoot, epochId) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		const entities = [];
		
		for (const temporalEntity of db.temporalEntities) {
			const version = temporalEntity.versions.find(v => v.epochId === epochId);
			if (version) {
				entities.push({
					entityId: temporalEntity.entityId,
					type: temporalEntity.type,
					data: this.mergeVersionData(version, temporalEntity.versions)
				});
			}
		}
		
		return entities;
	}
	
	/**
	 * Удалить версию сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} versionId - Идентификатор версии
	 */
	async deleteEntityVersion(projectRoot, entityId, versionId) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		
		if (!temporalEntity) {
			throw new Error(`Сущность с ID ${entityId} не найдена`);
		}
		
		const versionIndex = temporalEntity.versions.findIndex(v => v.versionId === versionId);
		if (versionIndex === -1) {
			throw new Error(`Версия с ID ${versionId} не найдена`);
		}
		
		// Проверяем, не является ли эта версия базовой для других версий
		const isBaseVersion = temporalEntity.versions.some(v => v.basedOn === versionId);
		if (isBaseVersion) {
			throw new Error(`Невозможно удалить версию, которая является базовой для других версий`);
		}
		
		temporalEntity.versions.splice(versionIndex, 1);
		
		await dbService.saveDB(projectRoot, db);
	}
	
	/**
	 * Сгенерировать ID для версии
	 * @returns {string} Сгенерированный ID
	 */
	generateVersionId() {
		return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
	
	/**
	 * Объединить данные версии с базовой версией (если есть)
	 * @param {Object} version - Версия сущности
	 * @param {Array} allVersions - Все версии сущности
	 * @returns {Object} Объединенные данные
	 */
	mergeVersionData(version, allVersions) {
		if (!version.basedOn) {
			return version.data;
		}
		
		// Находим базовую версию
		const baseVersion = allVersions.find(v => v.versionId === version.basedOn);
		if (!baseVersion) {
			// Если базовая версия не найдена, возвращаем данные текущей версии
			return version.data;
		}
		
		// Рекурсивно объединяем с базовой версией
		const baseData = this.mergeVersionData(baseVersion, allVersions);
		
		// Объединяем данные
		return this.deepMerge(baseData, version.data);
	}
	
	/**
	 * Глубокое объединение объектов
	 * @param {Object} target - Целевой объект
	 * @param {Object} source - Источник данных
	 * @returns {Object} Объединенный объект
	 */
	deepMerge(target, source) {
		const output = Object.assign({}, target);
		if (this.isObject(target) && this.isObject(source)) {
			Object.keys(source).forEach(key => {
				if (this.isObject(source[key])) {
					if (!(key in target))
						Object.assign(output, { [key]: source[key] });
					else
						output[key] = this.deepMerge(target[key], source[key]);
				} else {
					Object.assign(output, { [key]: source[key] });
				}
			});
		}
		return output;
	}
	
	/**
	 * Проверить, является ли значение объектом
	 * @param {*} item - Значение для проверки
	 * @returns {boolean} true, если значение является объектом
	 */
	isObject(item) {
		return (item && typeof item === 'object' && !Array.isArray(item));
	}
}

module.exports = { TemporalEntityService };