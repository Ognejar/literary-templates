/**
 * @file       MenuRegistry.js
 * @description Регистрация контекстных меню (file-menu, folder-menu) и делегирование построения меню
 * @author     AI Assistant
 * @version    1.0.0
 * @license    MIT
 * @dependencies obsidian (workspace events), plugin.addContextMenu
 * @created    2025-09-09
 * @updated    2025-09-09
 * @docs       docs/Карточка функционала.md
 */

class MenuRegistry {
	constructor(plugin) {
		this.plugin = plugin;
	}

	registerAll() {
		try {
			// file-menu
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('file-menu', (menu, file) => {
					try {
						this.addContextMenu(menu, file);
					} catch (e) {
						console.warn('file-menu handler error:', e);
					}
				})
			);

			// folder-menu
			this.plugin.registerEvent(
				this.plugin.app.workspace.on('folder-menu', (menu, folder) => {
					try {
						this.addContextMenu(menu, folder);
					} catch (e) {
						console.warn('folder-menu handler error:', e);
					}
				})
			);
		} catch (e) {
			console.warn('MenuRegistry registerAll error:', e);
		}
	}

	// === Построение контекстного меню ===
	addContextMenu(menu, target) {
		const plugin = this.plugin;
		menu.addItem((item) => {
			item.setTitle('Литературные шаблоны').setIcon('book-open');
			const subMenu = item.setSubmenu();

			// 1) Сюжет и главы
			subMenu.addItem((subItem) => {
				subItem.setTitle('📚 Сюжет и главы').setIcon('book');
				const storySub = subItem.setSubmenu();
				this._addMenuItem(storySub, {
					title: 'Создать главу', icon: 'book',
					onClick: (startPath) => window.createChapter(plugin, startPath)
				}, target);
				this._addMenuItem(storySub, {
					title: 'Создать сцену', icon: 'film',
					onClick: (startPath) => window.createScene(plugin, startPath)
				}, target);
				this._addMenuItem(storySub, {
					title: 'Создать конфликт', icon: 'flame',
					onClick: (startPath) => window.createConflict(plugin, startPath)
				}, target);
				this._addMenuItem(storySub, {
					title: 'Создать произведение', icon: 'book-open',
					onClick: (startPath) => window.createWork && window.createWork(plugin, startPath)
				}, target);
			});

			subMenu.addSeparator();

			// 2) Локации
			subMenu.addItem((subItem) => {
				subItem.setTitle('🗺️ Локации').setIcon('map-pin');
				const locSub = subItem.setSubmenu();
				// Жильё
				locSub.addItem((locItem) => {
					locItem.setTitle('🏠 Жильё').setIcon('home');
					const housingSub = locItem.setSubmenu();
					this._addMenuItem(housingSub, { title: 'Создать государство', icon: 'crown', onClick: (sp) => window.createState(plugin, sp) }, target);
					this._addMenuItem(housingSub, { title: 'Создать провинцию', icon: 'map', onClick: (sp) => window.createProvince(plugin, sp) }, target);
					this._addMenuItem(housingSub, { title: 'Создать город', icon: 'building', onClick: (sp) => window.createCity(plugin, sp) }, target);
					this._addMenuItem(housingSub, { title: 'Создать деревню', icon: 'home', onClick: (sp) => window.createVillage(plugin, sp) }, target);
				});
				// Социальные учреждения
				this._addMenuItem(locSub, {
					title: '🏛️ Социальные учреждения (мастер)', icon: 'library',
					onClick: async () => {
						try { await plugin.app.commands.executeCommandById('create-social-institution'); }
						catch (e) { plugin.logDebug('Ошибка запуска мастера социальных объектов: ' + e.message); }
					}
				}, target);
				// Прочее
				locSub.addItem((locItem) => {
					locItem.setTitle('📍 Прочее').setIcon('map-pin');
					const otherSub = locItem.setSubmenu();
					this._addMenuItem(otherSub, { title: 'Создать мертвую зону', icon: 'skull', onClick: (sp) => window.createDeadZone(plugin, sp) }, target);
					this._addMenuItem(otherSub, { title: 'Создать общую локацию', icon: 'map-pin', onClick: (sp) => window.createLocation(plugin, sp) }, target);
					this._addMenuItem(otherSub, { title: 'Создать монстра', icon: 'skull', onClick: (sp) => window.createMonster(plugin, sp) }, target);
				});
			});

			// 3) Экономика
			subMenu.addItem((subItem) => {
				subItem.setTitle('💰 Экономика').setIcon('factory');
				const ecoSub = subItem.setSubmenu();
				// Производство
				ecoSub.addItem((ecoItem) => {
					ecoItem.setTitle('🏭 Производство').setIcon('factory');
					const prod = ecoItem.setSubmenu();
					this._addMenuItem(prod, { title: 'Создать шахту', icon: 'pickaxe', onClick: (sp) => window.createMine(plugin, sp) }, target);
					this._addMenuItem(prod, { title: 'Создать ферму', icon: 'wheat', onClick: (sp) => window.createFarm(plugin, sp) }, target);
					this._addMenuItem(prod, { title: 'Создать завод', icon: 'factory', onClick: (sp) => window.createFactory(plugin, sp) }, target);
				});
				// Торговля
				ecoSub.addItem((ecoItem) => {
					ecoItem.setTitle('🧾 Торговля').setIcon('map');
					const trade = ecoItem.setSubmenu();
					this._addMenuItem(trade, { title: 'Создать торговый путь', icon: 'map', onClick: (sp) => window.createTradeRoute(plugin, sp) }, target);
				});
				// Логистика
				ecoSub.addItem((ecoItem) => {
					ecoItem.setTitle('🚚 Логистика').setIcon('map-pin');
					const logi = ecoItem.setSubmenu();
					this._addMenuItem(logi, { title: 'Создать порт', icon: 'anchor', onClick: () => plugin.logDebug('Функция createPort временно недоступна') }, target);
				});
			});

			// 4) Магия
			subMenu.addItem((subItem) => {
				subItem.setTitle('✨ Магия').setIcon('sparkles');
				const magicSub = subItem.setSubmenu();
				this._addMenuItem(magicSub, { title: 'Создать зелье', icon: 'potion', onClick: (sp) => window.createPotion(plugin, sp) }, target);
				this._addMenuItem(magicSub, { title: 'Создать заклинание', icon: 'sparkles', onClick: (sp) => window.createSpell(plugin, sp) }, target);
				this._addMenuItem(magicSub, { title: 'Создать алхимический рецепт', icon: 'flask', onClick: (sp) => window.createAlchemyRecipe(plugin, sp) }, target);
				this._addMenuItem(magicSub, { title: 'Создать артефакт', icon: 'sword', onClick: (sp) => window.createArtifact(plugin, sp) }, target);
			});

			// 5) Персонажи
			subMenu.addItem((subItem) => {
				subItem.setTitle('👤 Персонажи').setIcon('user');
				const charSub = subItem.setSubmenu();
				this._addMenuItem(charSub, { title: 'Создать персонажа', icon: 'user', onClick: (sp) => window.createCharacter(plugin, sp) }, target);
			});

			// 6) События
			subMenu.addItem((subItem) => {
				subItem.setTitle('📅 События').setIcon('calendar');
				const eventSub = subItem.setSubmenu();
				this._addMenuItem(eventSub, { title: 'Создать квест', icon: 'target', onClick: (sp) => window.createQuest(plugin, sp) }, target);
				this._addMenuItem(eventSub, { title: 'Создать событие', icon: 'calendar', onClick: (sp) => window.createEvent(plugin, sp) }, target);
			});

			subMenu.addSeparator();

			// 7) Мир и проекты
			subMenu.addItem((subItem) => {
				subItem.setTitle('🌍 Мир и проекты').setIcon('globe');
				const worldSub = subItem.setSubmenu();
				worldSub.addItem((worldItem) => {
					worldItem.setTitle('Управление AI ключами').setIcon('key').onClick(() => plugin.openAIKeysManager());
				});
				worldSub.addSeparator();
				worldSub.addItem((worldItem) => {
					worldItem.setTitle('Создать новый мир/проект').setIcon('globe').onClick(async () => {
						try {
							const parentFolder = await plugin._selectProjectParentFolder();
							if (!parentFolder) return;
							await window.createWorld(plugin, parentFolder);
						} catch (e) {
							plugin.logDebug('Ошибка при создании мира: ' + e.message);
						}
					});
				});
				worldSub.addItem((worldItem) => {
					worldItem.setTitle('Настройки мира').setIcon('settings').onClick(() => {
						let startPath = '';
						if (target && target.parent && target.parent.path) startPath = target.parent.path;
						else if (target && target.path) startPath = target.path;
						plugin.editWorldSettings(startPath);
					});
				});

				worldSub.addSeparator();
				worldSub.addItem((worldItem) => {
					worldItem.setTitle('AI собрать лор по проекту (перезаписать файл)').setIcon('book').onClick(async () => {
						try { await plugin.aiGatherProjectLore(); } catch (e) { plugin.logDebug('Ошибка при сборе лора: ' + e.message); }
					});
				});
				worldSub.addItem((worldItem) => {
					worldItem.setTitle('AI добавить лор из текущего документа').setIcon('book').onClick(async () => {
						try { await plugin.aiAppendCurrentNoteLore(); } catch (e) { plugin.logDebug('Ошибка добавления лора: ' + e.message); }
					});
				});
			});
		});
	}

	// Утилита: добавить пункт меню с вычислением startPath
	_addMenuItem(parentMenu, cfg, target) {
		parentMenu.addItem((item) => {
			item.setTitle(cfg.title).setIcon(cfg.icon).onClick(() => {
				let startPath = '';
				try {
					if (target && target.parent && target.parent.path) startPath = target.parent.path; else if (target && target.path) startPath = target.path;
				} catch (_) {}
				try { cfg.onClick && cfg.onClick(startPath); } catch (e) { console.warn('menu item onClick error:', e); }
			});
		});
	}
}

if (typeof window !== 'undefined') {
	window.MenuRegistry = MenuRegistry;
}

module.exports = { MenuRegistry };
