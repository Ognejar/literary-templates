/**
 * @file       LoreDBService.js
 * @description Постоянная база лора проекта: JSON БД + Markdown-индекс, апсерты и полная перестройка
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian
 * @created    2025-08-18
 * @updated    2025-08-29
 * @docs       docs/Карточка функционала.md
 */

class LoreDBService {
	constructor(plugin) {
		this.plugin = plugin;
	}

	// Папка и пути базы лора для заданного корня проекта
	getLorePaths(projectRoot) {
		const folder = `${projectRoot}/_lore`;
		return {
			folder,
			jsonPath: `${folder}/lore.json`,
			indexPath: `${folder}/index.md`
		};
	}

	async ensureLoreFolder(projectRoot) {
		const { folder } = this.getLorePaths(projectRoot);
		const vault = this.plugin.app.vault;
		try {
			const existing = vault.getAbstractFileByPath(folder);
			if (!existing) {
				await vault.createFolder(folder);
			}
		} catch (error) {
			// Игнорируем все ошибки
			console.log('Папка лора уже существует или ошибка создания:', error.message);
		}
	}

	// Загружает или создаёт БД
	async loadDB(projectRoot) {
		await this.ensureLoreFolder(projectRoot);
		const { jsonPath } = this.getLorePaths(projectRoot);
		const vault = this.plugin.app.vault;
		try {
			const file = vault.getAbstractFileByPath(jsonPath);
			if (!file) return this.createEmptyDB();
			const raw = await vault.read(file);
			const parsed = JSON.parse(raw || '{}');
			return this.normalizeDB(parsed);
		} catch {
			return this.createEmptyDB();
		}
	}

	createEmptyDB() {
		return {
			version: 2, // Обновляем версию для поддержки временных слоев
			updatedAt: new Date().toISOString(),
			globals: {
				worldInfo: {}
			},
			entities: [], // Старая структура для обратной совместимости
			temporalEntities: [] // Новая структура для версионированных сущностей
		};
	}

	normalizeDB(db) {
		if (!db || typeof db !== 'object') return this.createEmptyDB();
		if (!Array.isArray(db.entities)) db.entities = [];
		// Добавляем поддержку временных сущностей
		if (!Array.isArray(db.temporalEntities)) db.temporalEntities = [];
		if (!db.globals) db.globals = { worldInfo: {} };
		if (!db.globals.worldInfo) db.globals.worldInfo = {};
		if (!db.version) db.version = 1;
		if (!db.updatedAt) db.updatedAt = new Date().toISOString();
		return db;
	}

	async saveDB(projectRoot, db) {
		const { jsonPath } = this.getLorePaths(projectRoot);
		const vault = this.plugin.app.vault;
		db.updatedAt = new Date().toISOString();
		const json = JSON.stringify(db, null, 2);
		const existing = vault.getAbstractFileByPath(jsonPath);
		if (existing) {
			await vault.modify(existing, json);
		} else {
			await vault.create(jsonPath, json);
		}
		await this.generateIndex(projectRoot, db);
	}

	// Создаёт/обновляет Markdown-индекс для людей
	async generateIndex(projectRoot, db) {
		const { indexPath } = this.getLorePaths(projectRoot);
		const vault = this.plugin.app.vault;
		const grouped = this.groupBy(db.entities, (e) => e.type || 'unknown');
		let md = `# Лор-индекс\n\nОбновлено: ${new Date().toISOString()}\n\n`;
		Object.keys(grouped).sort().forEach((type) => {
			md += `## ${this.getTypeDisplay(type)}\n`;
			grouped[type]
				.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
				.forEach((e) => {
					const relPath = e.path || '';
					const summary = e.summary ? e.summary.replace(/\n+/g, ' ').slice(0, 160) : '';
					md += `- [[${relPath}|${e.title || e.id || relPath}]] — ${summary}\n`;
				});
			md += `\n`;
		});
		const existing = vault.getAbstractFileByPath(indexPath);
		if (existing) {
			await vault.modify(existing, md);
		} else {
			await vault.create(indexPath, md);
		}
	}

	groupBy(arr, fn) {
		return arr.reduce((acc, item) => {
			const key = fn(item);
			(acc[key] = acc[key] || []).push(item);
			return acc;
		}, {});
	}

	getTypeDisplay(type) {
		const map = {
			potion: 'Зелья',
			artifact: 'Артефакты',
			character: 'Персонажи',
			location: 'Локации',
			event: 'События',
			organization: 'Организации',
			unknown: 'Прочее'
		};
		return map[type] || type;
	}

	// Апсерт одной сущности
	async upsertEntity(projectRoot, entity) {
		const db = await this.loadDB(projectRoot);
		const key = entity.path || entity.id;
		if (!key) return db;
		const idx = db.entities.findIndex((e) => (e.path || e.id) === key);
		entity.updatedAt = new Date().toISOString();
		if (idx >= 0) {
			db.entities[idx] = { ...db.entities[idx], ...entity };
		} else {
			db.entities.push(entity);
		}
		await this.saveDB(projectRoot, db);
		return db;
	}

	// Быстрый режим: добавить текущий файл в лор
	async addCurrentFile(projectRoot, file) {
		if (!file) throw new Error('Нет активного файла');
		const content = await this.plugin.app.vault.read(file);
		const entity = await this.extractEntityFromContent(file, content);
		await this.upsertEntity(projectRoot, entity);
	}

	// Полный режим: перестроить всю БД по проекту
	async rebuild(projectRoot) {
		await this.ensureLoreFolder(projectRoot);
		const vault = this.plugin.app.vault;
		const all = vault.getMarkdownFiles();
		const projectFiles = all.filter((f) => f.path.startsWith(projectRoot) && !f.path.includes('_lore/'));
		const db = this.createEmptyDB();
		// Попытаемся извлечь глобальные настройки мира
		try {
			const ws = projectFiles.find((f) => f.basename === 'Настройки_мира');
			if (ws) {
				const worldContent = await vault.read(ws);
				db.globals.worldInfo = this.extractWorldInfo(worldContent);
			}
		} catch {}
		for (const file of projectFiles) {
			try {
				const content = await vault.read(file);
				const entity = await this.extractEntityFromContent(file, content);
				db.entities.push(entity);
			} catch {}
		}
		await this.saveDB(projectRoot, db);
		return db;
	}

	// Извлекает сущность из содержимого файла
	async extractEntityFromContent(file, content) {
		const path = file.path;
		const title = file.basename || this.extractTitle(content) || path.split('/').pop();
		const type = this.detectType(content, path);
		const tags = this.extractTags(content);
		const summary = this.extractSummary(content);
		const links = this.extractWikiLinks(content);
		const facts = this.extractFacts(content);
		return {
			id: path,
			path,
			title,
			type,
			tags,
			summary,
			facts,
			relations: [],
			links,
			updatedAt: new Date().toISOString()
		};
	}

	detectType(content, path) {
		// По frontmatter/тексту/пути
		const lower = content.toLowerCase();
		if (/(type:\s*персонаж|\*\*имя:\*\*)/i.test(content) || /Персонаж|characters?/i.test(path)) return 'character';
		if (/type:\s*локация/i.test(content) || /Локации|Локация/i.test(path)) return 'location';
		if (/type:\s*артефакт/i.test(content) || /Артефакты/i.test(path)) return 'artifact';
		if (/type:\s*зелье/i.test(content) || /Зелья|Алхимия/i.test(path)) return 'potion';
		if (/type:\s*событие/i.test(content) || /События/i.test(path)) return 'event';
		if (/type:\s*организация/i.test(content) || /Организации/i.test(path)) return 'organization';
		return 'unknown';
	}

	extractTitle(content) {
		const m = content.match(/^#\s+(.+)/m);
		return m ? m[1].trim() : '';
	}

	extractTags(content) {
		const tags = new Set();
		// YAML frontmatter
		const fm = content.match(/^---[\s\S]*?---/);
		if (fm) {
			const tagLines = fm[0].match(/tags?:\s*\[(.*?)\]/i);
			if (tagLines) {
				const parts = tagLines[1].split(',').map((s) => s.replace(/["'\s]/g, '')).filter(Boolean);
				parts.forEach((p) => tags.add(p.startsWith('#') ? p.slice(1) : p));
			}
		}
		// Хеш-теги в тексте
		const m = content.match(/(^|\s)#([\p{L}\w\-\/]+)/gu);
		if (m) {
			m.forEach((t) => tags.add(t.replace(/(^|\s)#/, '')));
		}
		return Array.from(tags);
	}

	extractSummary(content) {
		// Берем первые 2-3 строки после заголовка
		const lines = content.split(/\r?\n/);
		let start = 0;
		for (let i = 0; i < lines.length; i++) {
			if (/^#\s+/.test(lines[i])) { start = i + 1; break; }
		}
		const chunk = lines.slice(start, start + 5).join(' ').trim();
		return chunk;
	}

	extractWikiLinks(content) {
		const links = [];
		const re = /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g;
		let m;
		while ((m = re.exec(content)) !== null) {
			links.push(m[1]);
		}
		return links;
	}

	extractFacts(content) {
		// Простые факты формата **Ключ:** Значение
		const facts = {};
		const re = /^\*\*([^*]+)\*\*\s*:\s*(.+)$/gm;
		let m;
		while ((m = re.exec(content)) !== null) {
			facts[m[1].trim()] = m[2].trim();
		}
		return facts;
	}

	extractWorldInfo(content) {
		const info = {};
		const patterns = {
			name: /название[:\s]+(.+)/i,
			era: /эпоха[:\s]+(.+)/i,
			magic: /магия[:\s]+(.+)/i,
			technology: /технологии[:\s]+(.+)/i
		};
		Object.keys(patterns).forEach((k) => {
			const m = content.match(patterns[k]);
			if (m) info[k] = m[1].trim();
		});
		return info;
	}
	
	// Новые методы для работы с версионированными сущностями
	
	/**
	 * Получить сущность в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи (опционально, по умолчанию активная)
	 * @returns {Object|null} Данные сущности или null, если не найдена
	 */
	async getEntityAtEpoch(projectRoot, entityId, epochId = null) {
		const db = await this.loadDB(projectRoot);
		
		// Если не указана эпоха, пытаемся получить активную
		if (!epochId) {
			// Здесь нужно импортировать TimelineService, но из-за ограничений 
			// мы просто возвращаем последнюю версию сущности
			const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
			if (temporalEntity && temporalEntity.versions.length > 0) {
				// Возвращаем последнюю версию
				const latestVersion = temporalEntity.versions[temporalEntity.versions.length - 1];
				return this.mergeVersionData(latestVersion);
			}
			return null;
		}
		
		// Ищем версионированную сущность
		const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		if (!temporalEntity) return null;
		
		// Ищем версию, соответствующую заданной эпохе
		const version = temporalEntity.versions.find(v => v.epochId === epochId);
		if (!version) return null;
		
		return this.mergeVersionData(version);
	}
	
	/**
	 * Создать или обновить версию сущности в заданной эпохе
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @param {string} epochId - Идентификатор эпохи
	 * @param {Object} entityData - Данные сущности
	 * @returns {Object} Обновленная база данных
	 */
	async upsertEntityVersion(projectRoot, entityId, epochId, entityData) {
		const db = await this.loadDB(projectRoot);
		
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
			createdAt: new Date().toISOString()
		};
		
		// Если у сущности уже есть версии в этой эпохе, наследуемся от последней
		const existingVersionsInEpoch = temporalEntity.versions.filter(v => v.epochId === epochId);
		if (existingVersionsInEpoch.length > 0) {
			const latestVersion = existingVersionsInEpoch[existingVersionsInEpoch.length - 1];
			newVersion.basedOn = latestVersion.versionId;
		}
		
		temporalEntity.versions.push(newVersion);
		
		await this.saveDB(projectRoot, db);
		return db;
	}
	
	/**
	 * Получить все версии сущности
	 * @param {string} projectRoot - Корневая директория проекта
	 * @param {string} entityId - Идентификатор сущности
	 * @returns {Array} Массив версий сущности
	 */
	async getEntityVersions(projectRoot, entityId) {
		const db = await this.loadDB(projectRoot);
		const temporalEntity = db.temporalEntities.find(te => te.entityId === entityId);
		return temporalEntity ? temporalEntity.versions : [];
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
	 * @returns {Object} Объединенные данные
	 */
	mergeVersionData(version) {
		if (!version.basedOn) {
			return version.data;
		}
		
		// В реальной реализации здесь нужно найти базовую версию и объединить данные
		// Пока просто возвращаем данные текущей версии
		return version.data;
	}
}

module.exports = { LoreDBService };