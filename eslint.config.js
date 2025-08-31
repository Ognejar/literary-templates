module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        Plugin: 'readonly',
        Modal: 'readonly',
        Setting: 'readonly',
        Notice: 'readonly',
        TFile: 'readonly',
        TFolder: 'readonly',
        moment: 'readonly',
        window: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        // Modal классы (доступны после сборки)
        PromptModal: 'readonly',
        SuggesterModal: 'readonly',
        ProjectSelectorModal: 'readonly',
        ChapterSelectorModal: 'readonly',
        LocationWizardModal: 'readonly',
        CityWizardModal: 'readonly',
        VillageWizardModal: 'readonly',
        SceneWizardModal: 'readonly',
        PotionWizardModal: 'readonly',
        SpellWizardModal: 'readonly',
        DeadZoneWizardModal: 'readonly',
        PortWizardModal: 'readonly',
        ProvinceWizardModal: 'readonly',
        CastleWizardModal: 'readonly',
        StateWizardModal: 'readonly',
        WorldSettingsModal: 'readonly',
        HtmlWizardModal: 'readonly',
        FactoryWizardModal: 'readonly',
        MineWizardModal: 'readonly',
        // Сервисы (доступны после сборки)
        KeyRotationService: 'readonly',
        TimelineService: 'readonly',
        TemporalEntityService: 'readonly',
        TemporalContextService: 'readonly',
        MigrationService: 'readonly',
        requestUrl: 'readonly',
        // Функции (доступны после сборки)
        findProjectRoot: 'readonly',
        getAllProjectRoots: 'readonly',
        generateFromTemplate: 'readonly',
        ensureEntityInfrastructure: 'readonly',
        safeCreateFile: 'readonly',
        startPath: 'readonly',
        app: 'readonly',
        quickType: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off', // Отключаем предупреждения о неиспользуемых переменных
      'no-console': 'off',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { 'allowTemplateLiterals': true }]
    }
  },
  {
    ignores: [
      'main.bundle.js',
      'node_modules/'
    ]
  }
];

