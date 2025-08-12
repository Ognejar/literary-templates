### Города провинции
```dataview
LIST FROM ""
WHERE tags AND contains(tags, "город") AND province = this.province AND file.name != this.file.name
```
