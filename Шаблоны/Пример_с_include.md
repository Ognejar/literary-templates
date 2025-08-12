---
type: "{{type}}"
project: "{{projectName}}"
created: "{{date}}"
name: "{{name}}"
aliases: ["{{name}}"]
climate: "{{climate}}"
dominantFaction: "{{dominantFaction}}"
tags: [place, {{projectName}}]
---

# {{name}}

{{imageBlock}}

**Тип:** {{type}}  
**Климат:** {{climate}}  
**Доминирующая фракция:** {{dominantFaction}}  
{{provinceSection}}
{{stateSection}}

{{include:Шаблоны/sections/Описание.md}}

{{include:Шаблоны/sections/История.md}}

{{include:Шаблоны/sections/Инфраструктура.md}}

{{include:Шаблоны/sections/Экономика.md}}

{{include:Шаблоны/sections/Культура.md}}

## Автоматические связи

{{include:Шаблоны/sections/Dataview_ГородаПровинции.md}}

## Особенности
{{featuresSection}}
