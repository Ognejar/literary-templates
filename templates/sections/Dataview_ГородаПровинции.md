### Города провинции
```dataview
LIST FROM ""
WHERE type = "Город" 
AND province = this.name
AND country = this.country 
AND file.name != this.file.name
```
