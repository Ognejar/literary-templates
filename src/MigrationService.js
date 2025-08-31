/**
 * @file       MigrationService.js
 * @description Сервис для миграции данных на новую модель с временным слоем
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian, LoreDBService, TimelineService, TemporalEntityService
 * @created    2025-08-29
 * @updated    2025-08-29
 */

class MigrationService {
	constructor(plugin) {
		this.plugin = plugin;
	}

	/**
	 * Проверить, нужна ли миграция для проекта
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {boolean} true, если нужна миграция
	 */
	async isMigrationNeeded(projectRoot) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		return db.version < 2 || !db.temporalEntities;
	}

	/**
	 * Мигрировать проект на новую модель данных
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} baseEpochId - Идентификатор базовой эпохи (опционально)
	 * @returns {Object} Результат миграции
	 */
	async migrateProject(projectRoot, baseEpochId = null) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const TimelineService = require('./TimelineService').TimelineService;
		const TemporalEntityService = require('./TemporalEntityService').TemporalEntityService;
		
		const dbService = new LoreDBService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		const entityService = new TemporalEntityService(this.plugin);
		
		// Проверяем, нужна ли миграция
		const needsMigration = await this.isMigrationNeeded(projectRoot);
		if (!needsMigration) {
			return {
				success: true,
				message: 'Миграция не требуется - проект уже использует новую модель данных',
				migratedEntities: 0
			};
		}
		
		// Загружаем текущую базу данных
		const db = await dbService.loadDB(projectRoot);
		
		// Создаем базовую эпоху, если не указана
		if (!baseEpochId) {
			const timeline = await timelineService.loadTimeline(projectRoot);
			if (timeline.epochs.length === 0) {
				const baseEpoch = await timelineService.createEpoch(projectRoot, {
					name: 'Базовая эпоха',
					startDate: '0001-01-01',
					endDate: '9999-12-31',
					description: 'Базовая эпоха для миграции существующих данных'
				});
				baseEpochId = baseEpoch.id;
			} else {
				baseEpochId = timeline.epochs[0].id;
			}
		}
		
		// Мигрируем существующие сущности в версионированные
		let migratedCount = 0;
		for (const entity of db.entities) {
			try {
				await entityService.upsertEntityVersion(
					projectRoot, 
					entity.id || entity.path, 
					baseEpochId, 
					entity
				);
				migratedCount++;
			} catch (error) {
				console.error(`Ошибка миграции сущности ${entity.id || entity.path}:`, error);
			}
		}
		
		// Обновляем версию базы данных
		db.version = 2;
		await dbService.saveDB(projectRoot, db);
		
		return {
			success: true,
			message: `Успешно мигрировано ${migratedCount} сущностей`,
			migratedEntities: migratedCount
		};
	}

	/**
	 * Откатить миграцию (только для тестирования)
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Результат отката
	 */
	async rollbackMigration(projectRoot) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		// Загружаем текущую базу данных
		const db = await dbService.loadDB(projectRoot);
		
		// Удаляем временные сущности
		db.temporalEntities = [];
		
		// Восстанавливаем старую версию
		db.version = 1;
		
		await dbService.saveDB(projectRoot, db);
		
		return {
			success: true,
			message: 'Миграция успешно откачена'
		};
	}

	/**
	 * Проверить целостность данных после миграции
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Результат проверки
	 */
	async validateMigration(projectRoot) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const dbService = new LoreDBService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		
		const validation = {
			success: true,
			issues: [],
			stats: {
				oldEntities: db.entities.length,
				temporalEntities: db.temporalEntities.length,
				totalVersions: 0
			}
		};
		
		// Проверяем структуру временных сущностей
		for (const temporalEntity of db.temporalEntities) {
			if (!temporalEntity.entityId) {
				validation.issues.push(`Версионированная сущность без entityId`);
				validation.success = false;
			}
			
			if (!Array.isArray(temporalEntity.versions)) {
				validation.issues.push(`Сущность ${temporalEntity.entityId} имеет некорректную структуру версий`);
				validation.success = false;
			} else {
				validation.stats.totalVersions += temporalEntity.versions.length;
				
				for (const version of temporalEntity.versions) {
					if (!version.versionId || !version.epochId || !version.data) {
						validation.issues.push(`Версия в сущности ${temporalEntity.entityId} имеет некорректную структуру`);
						validation.success = false;
					}
				}
			}
		}
		
		// Проверяем, что все старые сущности были мигрированы
		const migratedEntityIds = db.temporalEntities.map(te => te.entityId);
		const unmigratedEntities = db.entities.filter(e => 
			!migratedEntityIds.includes(e.id || e.path));
			
		if (unmigratedEntities.length > 0) {
			validation.issues.push(`Не мигрировано ${unmigratedEntities.length} сущностей`);
			validation.success = false;
		}
		
		return validation;
	}

	/**
	 * Создать отчет о миграции
	 * @param {string} projectRoot - Корневая директория проекта
	 * @returns {Object} Отчет о миграции
	 */
	async generateMigrationReport(projectRoot) {
		const LoreDBService = require('./LoreDBService').LoreDBService;
		const TimelineService = require('./TimelineService').TimelineService;
		const dbService = new LoreDBService(this.plugin);
		const timelineService = new TimelineService(this.plugin);
		
		const db = await dbService.loadDB(projectRoot);
		const timeline = await timelineService.loadTimeline(projectRoot);
		
		const report = {
			timestamp: new Date().toISOString(),
			projectRoot: projectRoot,
			databaseVersion: db.version,
			entitiesCount: {
				old: db.entities.length,
				temporal: db.temporalEntities.length
			},
			epochsCount: timeline.epochs.length,
			versionsStats: {},
			migrationStatus: await this.isMigrationNeeded(projectRoot) ? 'Требуется' : 'Завершена'
		};
		
		// Собираем статистику по версиям
		for (const temporalEntity of db.temporalEntities) {
			for (const version of temporalEntity.versions) {
				if (!report.versionsStats[version.epochId]) {
					report.versionsStats[version.epochId] = 0;
				}
				report.versionsStats[version.epochId]++;
			}
		}
		
		return report;
	}
}

module.exports = { MigrationService };