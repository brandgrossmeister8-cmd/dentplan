const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

const script = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
assert(script, 'В index.html должен быть встроенный JavaScript');
assert.doesNotThrow(() => new Function(script[1]), 'Встроенный JavaScript должен компилироваться');

assert.match(html, /function validateProjectData\(/, 'Импорт должен валидировать файл до изменения состояния');
assert.match(html, /validateProjectData\(p\)/, 'Результат валидации должен использоваться при импорте');
assert.match(html, /function confirmReplaceProject\(/, 'Перед заменой проекта нужно показывать подтверждение');
assert.match(html, /projectDirty/, 'Должен отслеживаться статус несохранённых изменений');
assert.match(html, /document\.createTextNode\(String\(msg\)\)/, 'Текст тоста нельзя вставлять как HTML');
assert.match(html, /if\(!confirmReplaceProject\(\)\)return;/, 'Импорт и шаблоны должны уважать отмену замены проекта');
assert.doesNotMatch(html, /проверка пройдена/i, 'Даже предварительный статус не должен звучать как заключение');
assert.doesNotMatch(html, /Нормы соблюдены/, 'В интерфейсе не должно быть неподтверждённого заявления о нормативах');
assert.doesNotMatch(html, /соответствует требованиям/i, 'Нельзя выдавать юридическое заключение о соответствии');
assert.match(html, /id="projectProfile"/, 'В интерфейсе должен быть переключатель профиля проекта');
assert.match(html, /function normalizeProjectProfile\(/, 'Старые проекты должны получать совместимый профиль');
assert.match(html, /profile:state\.profile/, 'Профиль должен сохраняться в JSON проекта');
assert.match(html, /setProjectProfile\(normalizeProjectProfile\(p\.profile\)/, 'Профиль должен восстанавливаться при загрузке');
assert.match(html, /data-profile="dental"/, 'Стоматологические рекомендации должны быть отдельным блоком');
assert.match(html, /body\.dataset\.profile=profile/, 'General-профиль должен управлять видимостью стоматологических рекомендаций');
assert.match(html, /function templatesForProfile\(/, 'Шаблоны должны фильтроваться по профилю');
assert.match(html, /buildTplGrid\(\)/, 'Переключение профиля должно перерисовывать список шаблонов');
assert.match(html, /p:state\.profile/, 'Профиль должен входить в снимок истории действий');
assert.match(html, /if\(dirty\)commit\(\)/, 'Переключение профиля должно добавляться в историю действий');
assert.doesNotMatch(html, /#planPane\{display:none!important\}/, 'План не должен безусловно исчезать на узком экране');
assert.match(html, /aria-label=/, 'Интерактивные элементы должны иметь доступные подписи');
assert.match(html, /function openingMetrics\(/, 'Геометрия проёма должна иметь единый расчёт размеров');
assert.match(html, /function angleDeviation\(/, 'Для углов нужна единая чистая функция');
assert.match(html, /angleHintForNode\(drawState\.lastNodeId/, 'Подсказка угла должна вызываться в preview цепочного рисования');
assert.match(html, /if\(angleHint\)drawTag\(g,X\(m\.x\),Y\(m\.z\)\+18,angleHintText\(angleHint\)/, 'Preview должен рисовать live-подсказку угла рядом с курсором');
assert.match(html, /drawState\.last=\{x:B\.x,z:B\.z\};drawState\.lastNodeId=B\.id/, 'После фиксации сегмента цепочка должна сохранить узел для следующего preview');
assert.match(html, /function angleCorrectionText\(/, 'Коррекция угла должна быть отдельной чистой функцией');
assert.match(html, /angleHintForNode\(n\.id,\{x:n\.x,z:n\.z\},w\.id\)/, 'Подсказка угла должна вызываться при изменении конца стены');
assert.match(html, /function translateWall\(/, 'Перенос стены должен быть переиспользуемой операцией модели');
assert.match(html, /function moveOpeningTo\(/, 'Перенос проёма должен быть переиспользуемой операцией модели');
assert.match(html, /function shouldPrioritizeOpeningHit\(/, 'Существующий проём должен иметь приоритет над добавлением нового');
assert.match(html, /else\{setTool\('select'\);select\(null\);\}/, 'При входе в режим стен должен включаться выбор существующих объектов');
const openingToolBranch = script[1].slice(script[1].indexOf('if(TOOL_DEF[t])'), script[1].indexOf("if(t==='erase')", script[1].indexOf('if(TOOL_DEF[t])')));
assert.ok(openingToolBranch.indexOf('const existingOpening=openingAt(p)') < openingToolBranch.indexOf('const wh=wallAt(p)'), 'Hit-test существующего проёма должен идти раньше поиска стены');
assert.match(openingToolBranch, /if\(op\)\{setTool\('select'\);selectWallObj/, 'После установки нового проёма инструмент должен перейти в выбор');
assert.match(html, /wallDrag=\{type:'wall',id:wh\.id/, 'Клик по стене должен начинать её drag');
assert.match(html, /wallDrag=\{type:'opening',id:oh\.id/, 'Клик по проёму должен начинать его drag');
assert.match(html, /startM:toMeters\(p\),oa:\{\.\.\.g\.A\},ob:\{\.\.\.g\.B\}/, 'Drag стены должен сохранить исходную точку и оба конца');
assert.match(html, /const dx=m\.x-wallDrag\.startM\.x,dz=m\.z-wallDrag\.startM\.z/, 'Перенос стены должен считаться от начала drag, а не от уже изменённой геометрии');
assert.match(html, /translateWall\(w,dx,dz,wallDrag\.oa,wallDrag\.ob\)/, 'Drag стены должен переносить оба конца');
assert.match(html, /moveOpeningTo\(op,proj\)/, 'Drag проёма должен менять его положение, а не создавать копию');
assert.match(html, /else if\(wallDrag\.type==='opening'\)\{[\s\S]*?refresh\(\);commit\(\);renderWallBar\(\);/, 'Завершённый drag проёма должен обновлять вид, панель и историю');
assert.match(html, /else if\(wallDrag\.type==='wall'\)\{[\s\S]*?staticDirty=true;refresh\(\);commit\(\);/, 'Завершённый drag стены должен обновлять 2D/3D и историю');
assert.match(html, /function wallHoverLabel\(/, 'Для hover нужна единая классификация стены и проёма');
assert.match(html, /endDraw\(\);ghost=null;hoverErase=null;hoverLabel=null;/, 'При смене инструмента старая hover-подпись не должна зависать');
assert.match(html, /const hoverOpening=nodeHit\?null:openingAt\(p\)/, 'Hover должен сначала проверять проём');
assert.match(html, /const hoverWall=hoverOpening\?null:wallAt\(p\)/, 'Линия стены не должна перекрывать подпись проёма');
assert.match(html, /const hoverText=wallHoverLabel\(hoverOpening,hoverWall\)/, 'Hover должен вызывать классификацию элемента');
assert.match(html, /if\(wallsMode&&hoverLabel&&!opts\.plain\)\{[\s\S]*?drawTag\(g,X\(hoverLabel\.x\)/, 'Подпись hover должна рисоваться через canvas drawTag');
assert.match(html, /pointerleave',\(\)=>\{[^}]*hoverLabel=null/, 'Подпись hover должна очищаться при уходе с canvas');
assert.match(html, /слева[\s\S]{0,160}ширина[\s\S]{0,160}справа/i, 'Выбранный проём должен показывать отступы и ширину');
assert.match(html, /от начала[\s\S]{0,120}ширина/i, 'При переносе проёма нужно показывать положение и ширину');

assert.match(html, /camera:\s*\{[^}]*group:'Безопасность'/, 'В каталоге должна быть камера видеонаблюдения');
assert.match(html, /function nudgeSelectedItem\(/, 'Выбранный предмет должен двигаться клавишами');
assert.match(html, /id="ibAngle"[^>]*type="number"/, 'Панель предмета должна принимать точный угол');
assert.match(html, /cameras=cnt\('camera'\)/, 'Камеры должны считаться в статистике');
assert.match(html, /КАМЕР[^\n]*String\(s\.cameras\)/, 'Число камер должно попадать в PDF-экспорт');
assert.match(html, /BUILDERS=\{[\s\S]*camera\(\)/, 'Для камеры нужна 3D-модель');
assert.match(html, /function addItem\([^]*?clampItem\(item\)/, 'Новый предмет должен сразу ограничиваться контуром');
assert.match(html, /function nudgeSelectedItem\([^]*?moveItem\(it\)/, 'Сдвиг клавишами должен сохранять предмет в контуре');
assert.doesNotMatch(html, /\bprice\s*:/i, 'CATALOG не должен содержать ценовые поля');
assert.doesNotMatch(html, /\b(?:budget|estimate|updateEstimate|estimateTotal)\b/i, 'Бюджетные функции должны быть удалены');
assert.doesNotMatch(html, /btnEstimate|estPanel|estBody|estTotal|estSum|cat-price|Смета|Монтаж и пусконаладка|₽|руб\.?/i, 'В UI и экспорте не должно быть сметы');
assert.match(html, /СПЕЦИФИКАЦИЯ ОСНАЩЕНИЯ/, 'В PDF должна остаться спецификация');
assert.match(html, /state\.items\.forEach\(i=>map\[i\.type\]=\(map\[i\.type\]\|\|0\)\+1\)/, 'Экспорт должен сохранять количество единиц');
for (const type of ['instrument', 'compressor', 'camera', 'desk', 'officechair']) {
  assert.match(html, new RegExp(`case '${type}'`), `Для ${type} нужно 2D-представление`);
  assert.match(html, new RegExp(`\\n\\s{2}${type}\\(\\)`), `Для ${type} нужно 3D-представление`);
}
assert.match(html, /accept="\.png,\.jpg,\.jpeg,\.pdf,image\/png,image\/jpeg,application\/pdf"/, 'Выбор подложки должен ограничивать форматы');
assert.match(html, /function underlayFileError\(/, 'Формат подложки нужно проверять до чтения файла');
assert.match(html, /PDF пока нельзя использовать как подложку/, 'Для PDF нужно объяснять ограничение');
assert.match(html, /underlay\.uw\*=k/, 'Калибровка должна менять масштаб подложки');
assert.match(html, /visible:underlay\.visible,opacity:underlay\.opacity/, 'Проект должен сохранять настройки подложки');
assert.match(html, /function shouldSmoothUnderlay\(/, 'Для подложки нужно управлять интерполяцией');
assert.match(html, /imageSmoothingQuality='high'/, 'При уменьшении чертежа нужна качественная фильтрация');
assert.match(html, /setTransform\(backing\.scaleX,0,0,backing\.scaleY,0,0\)/, '2D-canvas должен использовать фактический масштаб backing store');
assert.match(html, /function canvasBackingSize\(/, 'Расчёт backing store должен быть отделён от DOM');
assert.doesNotMatch(html, /if\(v==='both'\)resizeAll\(\)/, 'После любого переключения вида canvas нужно измерить заново');
assert.match(html, /layoutObserver\.observe\(\$\('#planPane'\)\)/, 'ResizeObserver должен следить за размером панели плана');

const underlayValidation = script[1].match(/function underlayFileError\(f\)\{[\s\S]*?\n\}/);
assert(underlayValidation, 'Не найдена валидация формата подложки');
const underlaySandbox = {};
vm.runInNewContext(`${underlayValidation[0]}\nthis.underlayFileError=underlayFileError;`, underlaySandbox);
assert.equal(underlaySandbox.underlayFileError({ name: 'plan.png', type: 'image/png' }), null, 'PNG должен приниматься');
assert.equal(underlaySandbox.underlayFileError({ name: 'plan.jpeg', type: 'image/jpeg' }), null, 'JPEG должен приниматься');
assert.match(underlaySandbox.underlayFileError({ name: 'plan.pdf', type: 'application/pdf' }), /PDF/, 'PDF должен отклоняться с объяснением');
assert.match(underlaySandbox.underlayFileError({ name: 'plan.svg', type: 'image/svg+xml' }), /PNG и JPG/, 'Посторонний формат должен отклоняться');

const smoothingRule = script[1].match(/function shouldSmoothUnderlay\(sourcePixels,destinationPixels\)\{[\s\S]*?\n\}/);
assert(smoothingRule, 'Не найдено правило сглаживания подложки');
const smoothingSandbox = {};
vm.runInNewContext(`${smoothingRule[0]}\nthis.shouldSmoothUnderlay=shouldSmoothUnderlay;`, smoothingSandbox);
assert.equal(smoothingSandbox.shouldSmoothUnderlay(2000, 500), true, 'При уменьшении растра нужна фильтрация');
assert.equal(smoothingSandbox.shouldSmoothUnderlay(500, 1000), false, 'При увеличении растра интерполяция не должна размывать линии');

const backingRule = script[1].match(/function canvasBackingSize\(cssW,cssH,dpr\)\{[\s\S]*?\n\}/);
assert(backingRule, 'Не найден расчёт backing store');
const backingSandbox = {};
vm.runInNewContext(`${backingRule[0]}\nthis.canvasBackingSize=canvasBackingSize;`, backingSandbox);
assert.deepEqual(
  JSON.parse(JSON.stringify(backingSandbox.canvasBackingSize(801.5, 600.25, 2))),
  { width: 1603, height: 1201, scaleX: 2, scaleY: 1201 / 600.25 },
  'Дробный CSS-размер должен давать точный backing store и transform',
);

const scriptSource = script[1];
const templateFilterSource = scriptSource.match(/function templatesForProfile\(templates,profile\)\{[^}]+\}/);
assert(templateFilterSource, 'Не найдена функция безопасного списка шаблонов');
const templateSandbox = {};
vm.runInNewContext(`${templateFilterSource[0]}\nthis.templatesForProfile=templatesForProfile;`, templateSandbox);
const templateFixtures = [{ id: 'start' }, { id: 'family' }, { id: 'flag' }, { id: 'empty' }];
assert.deepEqual(JSON.parse(JSON.stringify(templateSandbox.templatesForProfile(templateFixtures, 'general'))), [{ id: 'empty' }], 'General должен показывать только нейтральный чистый лист');
assert.equal(templateSandbox.templatesForProfile(templateFixtures, 'dental').length, 4, 'Dental должен сохранять стоматологические шаблоны');
const exportSection = scriptSource.slice(
  scriptSource.indexOf('const DATA_EXPORT_SCHEMA='),
  scriptSource.indexOf('/* ═══════════════ ЭКСПОРТ ═══════════════ */'),
);
const exportSandbox = {};
vm.runInNewContext(`${exportSection}\nthis.buildDataExport=buildDataExport;this.dataExportToCsv=dataExportToCsv;`, exportSandbox);
const exportState = {
  room: { w: 4, d: 3 },
  nodes: [
    { id: 'n1', x: 0, z: 0 }, { id: 'n2', x: 4, z: 0 },
    { id: 'n3', x: 4, z: 3 }, { id: 'n4', x: 0, z: 3 },
  ],
  walls: [
    { id: 'w1', a: 'n1', b: 'n2', kind: 'outer' }, { id: 'w2', a: 'n2', b: 'n3', kind: 'outer' },
    { id: 'w3', a: 'n3', b: 'n4', kind: 'outer' }, { id: 'w4', a: 'n4', b: 'n1', kind: 'outer' },
  ],
  openings: [
    { id: 'o1', wallId: 'w1', t: 0.5, w: 1, kind: 'door', flip: false },
    { id: 'o2', wallId: 'w2', t: 0.5, w: 1.2, kind: 'window', flip: false },
    { id: 'o3', wallId: 'w3', t: 0.5, w: 1, kind: 'evac', flip: true },
  ],
  items: [{ id: 'i1', type: 'chair', x: 2, z: 1.5, rot: Math.PI / 2 }],
};
const exportCatalog = { chair: { name: 'Кресло', w: 1.4, d: 1.9 } };
const dataExport = exportSandbox.buildDataExport(exportState, exportCatalog, '2026-09-08T00:00:00.000Z');
assert.equal(dataExport.schema, 'dentplan-data-export');
assert.equal(dataExport.layout.contour.status, 'closed');
assert.equal(dataExport.layout.floorAreaM2, 12);
assert.equal(dataExport.layout.wallArea.netM2, 36);
assert.deepEqual(JSON.parse(JSON.stringify(dataExport.counts)), { doors: 1, windows: 1, evacuationOpenings: 1, equipment: 1, cameras: 0 });
assert.equal(dataExport.items[0].rotationDeg, 90);
assert.equal(dataExport.items[0].rot, 1.570796);
assert.deepEqual(JSON.parse(JSON.stringify(dataExport.items[0].sizeM)), { width: 1.4, depth: 1.9 });
assert.match(exportSandbox.dataExportToCsv(dataExport), /item,i1,chair/);
assert.equal(dataExport.projectProfile, 'dental', 'Старое состояние без профиля экспортируется как dental');
assert.match(exportSandbox.dataExportToCsv(dataExport), /meta,project-profile,dental/);
const generalExport = exportSandbox.buildDataExport({ ...exportState, profile: 'general' }, exportCatalog, '2026-09-08T00:00:00.000Z');
assert.equal(generalExport.projectProfile, 'general');
assert.deepEqual(JSON.parse(JSON.stringify(generalExport.guidance)), { applicability: 'not-applicable', recommendations: [] });
assert.doesNotMatch(exportSandbox.dataExportToCsv(generalExport), /стоматолог/i, 'В CSV general-профиля не должно быть стоматологических рекомендаций');
exportState.items[0].x = 2.5;
exportState.items.push({ id: 'i2', type: 'camera', x: 1, z: 1, rot: 0 });
const editedExport = exportSandbox.buildDataExport(exportState, { ...exportCatalog, camera: { name: 'Камера', w: 0.2, d: 0.2 } }, '2026-09-08T00:01:00.000Z');
assert.equal(editedExport.items[0].x, 2.5, 'Повторная выгрузка должна видеть отредактированные координаты');
assert.equal(editedExport.counts.equipment, 2);
assert.equal(editedExport.counts.cameras, 1);

const openExport = exportSandbox.buildDataExport({ ...exportState, walls: exportState.walls.slice(0, 3), openings: [] }, exportCatalog, '2026-09-08T00:00:00.000Z');
assert.equal(openExport.layout.contour.status, 'open');
assert.equal(openExport.layout.floorAreaM2, null);
const emptyExport = exportSandbox.buildDataExport({ room: { w: 10, d: 8 }, nodes: [], walls: [], openings: [], items: [] }, exportCatalog, '2026-09-08T00:00:00.000Z');
assert.equal(emptyExport.layout.contour.status, 'empty');
assert.equal(emptyExport.layout.floorAreaM2, null);
assert.equal(emptyExport.normativeConclusion, null);

const projectSection = scriptSource.slice(
  scriptSource.indexOf('const PROJECT_LIMITS='),
  scriptSource.indexOf('function saveProject()'),
);
const sandbox = {
  window: { addEventListener() {} },
  CATALOG: { chair: {}, sofa: {}, camera: {} },
  console,
};
vm.runInNewContext(`${projectSection}\nthis.validateProjectData=validateProjectData;`, sandbox);
const validProject = {
  app: 'dentplan',
  layout: {
    nodes: [{ id: 'n1', x: 0, z: 0 }, { id: 'n2', x: 4, z: 0 }],
    walls: [{ id: 'w1', a: 'n1', b: 'n2', kind: 'outer' }],
    openings: [],
  },
  items: [{ type: 'chair', x: 1, z: 0, rot: 0 }],
  brand: '#0E7C7B',
};
assert.equal(sandbox.validateProjectData(validProject), null, 'Корректный проект должен приниматься');
assert.equal(sandbox.validateProjectData({ ...validProject, profile: 'dental' }), null);
assert.equal(sandbox.validateProjectData({ ...validProject, profile: 'general' }), null);
assert.match(sandbox.validateProjectData({ ...validProject, profile: 'unknown' }), /профиль/, 'Неизвестный профиль должен отклоняться');
assert.equal(
  sandbox.validateProjectData({ ...validProject, items: [{ type: 'camera', x: 1, z: 1, rot: Math.PI / 3 }] }),
  null,
  'Камера с произвольным углом должна попадать в JSON проекта',
);
assert.match(
  sandbox.validateProjectData({ ...validProject, layout: { ...validProject.layout, walls: {} } }),
  /геометрия/,
  'Повреждённый layout должен отклоняться',
);
assert.match(
  sandbox.validateProjectData({ ...validProject, items: [{ type: 'unknown', x: 0, z: 0, rot: 0 }] }),
  /предметы/,
  'Неизвестный предмет должен отклоняться',
);
assert.match(
  sandbox.validateProjectData({ ...validProject, layout: { ...validProject.layout, walls: [{ id: 'w1', a: 'missing', b: 'n2', kind: 'outer' }] } }),
  /стены/,
  'Стена со ссылкой на отсутствующий узел должна отклоняться',
);
assert.match(
  sandbox.validateProjectData({ ...validProject, layout: { ...validProject.layout, walls: [{ id: 'w1', a: 'n1', b: 'n1', kind: 'outer' }] } }),
  /стены/,
  'Вырожденная стена должна отклоняться',
);
assert.match(
  sandbox.validateProjectData({
    ...validProject,
    layout: { ...validProject.layout, openings: [{ id: 'o1', wallId: 'w1', t: 0.05, w: 1, kind: 'door' }] },
  }),
  /проёмы/,
  'Проём не должен выходить за край стены',
);
assert.match(
  sandbox.validateProjectData({
    ...validProject,
    layout: { ...validProject.layout, openings: [
      { id: 'o1', wallId: 'w1', t: 0.4, w: 1, kind: 'door' },
      { id: 'o2', wallId: 'w1', t: 0.5, w: 1, kind: 'window' },
    ] },
  }),
  /проёмы/,
  'Пересекающиеся проёмы должны отклоняться',
);

const engineSection = scriptSource.slice(
  scriptSource.indexOf('const state='),
  scriptSource.indexOf('/* ═══════════════ ИСТОРИЯ'),
);
const engine = {
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  D2R: Math.PI / 180,
  toast() {},
  fmtM: String,
  fmt2: value => Number(value).toFixed(2).replace('.', ','),
};
vm.runInNewContext(`${engineSection}\nthis.api={state,addNode,addWall,addOpening,openingMetrics,openingFits,shouldPrioritizeOpeningHit,angleDeviation,angleHintForNode,angleCorrectionText,angleHintText,translateWall,moveOpeningTo,deleteWall,wallHoverLabel};`, engine);
engine.TOOL_DEF = { door: {}, window: {}, evac: {} };
assert.equal(engine.api.shouldPrioritizeOpeningHit('door', { id: 'o1' }), true, 'При клике по двери нужно начать её перенос');
assert.equal(engine.api.shouldPrioritizeOpeningHit('door', null), false, 'Без проёма нужно оставить возможность его добавить');
assert.equal(engine.api.wallHoverLabel(null, { kind: 'outer' }), 'Наружная стена');
assert.equal(engine.api.wallHoverLabel(null, { kind: 'inner' }), 'Перегородка');
assert.equal(engine.api.wallHoverLabel({ kind: 'door' }, { kind: 'outer' }), 'Дверь', 'Проём должен иметь приоритет над стеной в hover');
assert.equal(engine.api.wallHoverLabel({ kind: 'window' }, { kind: 'inner' }), 'Окно');
assert.equal(engine.api.wallHoverLabel({ kind: 'evac' }, { kind: 'outer' }), 'Эвакуационный проём');
assert.equal(engine.api.wallHoverLabel(null, null), '');
assert.equal(engine.api.angleCorrectionText(90, 0), 'перпендикулярно');
assert.equal(engine.api.angleCorrectionText(0, 90), 'увеличьте угол на 90,00° до 90°');
assert.equal(engine.api.angleCorrectionText(180, 90), 'уменьшите угол на 90,00° до 90°');
const previewA = engine.api.addNode(0, 0);
const previewB = engine.api.addNode(4, 0);
engine.api.addWall(previewA, previewB, 'inner');
const preview88 = engine.api.angleHintForNode(previewB.id, {
  x: 4 - Math.cos(88 * Math.PI / 180),
  z: Math.sin(88 * Math.PI / 180),
}, null);
assert.match(engine.api.angleHintText(preview88), /угол 88,00° · отклонение 2,00° · увеличьте угол на 2,00° до 90°/, 'Preview должен объяснять, как исправить угол 88°');
const preview90 = engine.api.angleHintForNode(previewB.id, { x: 4, z: 1 }, null);
assert.match(engine.api.angleHintText(preview90), /отклонение 0,00° · перпендикулярно/, 'Точный прямой угол должен быть явно отмечен');
const angle90 = engine.api.angleDeviation({ x: 1, z: 0 }, { x: 0, z: 1 });
assert.equal(angle90.angle, 90, '90° должны давать нулевое отклонение');
assert.equal(angle90.deviation, 0);
const angle88 = engine.api.angleDeviation({ x: 1, z: 0 }, { x: Math.cos(88 * Math.PI / 180), z: Math.sin(88 * Math.PI / 180) });
assert.ok(Math.abs(angle88.angle - 88) < 1e-9, '88° должны нормализоваться к 0–180°');
assert.ok(Math.abs(angle88.deviation - 2) < 1e-9);
assert.equal(engine.api.angleDeviation({ x: 1, z: 0 }, { x: 1, z: 0 }).deviation, 90, '0° должен давать отклонение 90°');
assert.equal(engine.api.angleDeviation({ x: 1, z: 0 }, { x: -1, z: 0 }).deviation, 90, '180° должен давать отклонение 90°');
const a = engine.api.addNode(0, 0);
const b = engine.api.addNode(4, 0);
const wall = engine.api.addWall(a, b, 'inner');
const door = engine.api.addOpening(wall, 0.5, 1, 'door');
assert.deepEqual(
  { ...engine.api.openingMetrics(door), wall: undefined, g: undefined },
  { wall: undefined, g: undefined, center: 2, left: 1.5, right: 1.5, width: 1 },
  'Размерная цепочка проёма должна считаться от его краёв',
);
assert.equal(engine.api.openingFits(wall.id, 2.4, 1, door.id), true, 'Проём можно двигать в свободном диапазоне');
engine.api.addOpening(wall, 0.85, 0.5, 'window');
assert.equal(engine.api.openingFits(wall.id, 2.9, 1, door.id), false, 'Проёмы не должны пересекаться');
const c = engine.api.addNode(0, 4);
engine.api.addWall(a, c, 'inner');
const nodeHint = engine.api.angleHintForNode(a.id, { x: 0, z: 1 }, null);
assert.equal(nodeHint.angle, 90, 'Узел с соседней стеной должен давать подсказку');
const isolated = engine.api.addNode(8, 8);
assert.equal(engine.api.angleHintForNode(isolated.id, { x: 9, z: 8 }, null), null, 'Без соседней стены нельзя показывать ложную перпендикулярность');

engine.api.state.nodes.length = 0;
engine.api.state.walls.length = 0;
engine.api.state.openings.length = 0;
engine.staticDirty = false;
const wallA = engine.api.addNode(0, 0);
const wallB = engine.api.addNode(10, 0);
const movableWall = engine.api.addWall(wallA, wallB, 'inner');
const movableDoor = engine.api.addOpening(movableWall, 0.3, 1, 'door');
const movableWindow = engine.api.addOpening(movableWall, 0.7, 1, 'window');
const movableEvac = engine.api.addOpening(movableWall, 0.9, 1, 'evac');
const baseA = { ...wallA }, baseB = { ...wallB };
const doorT = movableDoor.t, doorW = movableDoor.w, windowT = movableWindow.t, windowW = movableWindow.w;
const evacT = movableEvac.t, evacW = movableEvac.w;
assert.equal(engine.api.translateWall(movableWall, 2, 3, baseA, baseB), true, 'Перенос стены должен менять оба её конца');
assert.deepEqual({ x: wallA.x, z: wallA.z }, { x: 2, z: 3 });
assert.deepEqual({ x: wallB.x, z: wallB.z }, { x: 12, z: 3 });
const movedDoorMetrics = engine.api.openingMetrics(movableDoor);
assert.deepEqual(
  { x: movedDoorMetrics.g.A.x + movedDoorMetrics.g.ux * movedDoorMetrics.center, z: movedDoorMetrics.g.A.z + movedDoorMetrics.g.uz * movedDoorMetrics.center },
  { x: 5, z: 3 },
  'Связанная дверь должна физически следовать за перенесённой стеной',
);
assert.equal(movableDoor.wallId, movableWall.id, 'Дверь должна оставаться связанной с стеной');
assert.equal(movableWindow.wallId, movableWall.id, 'Окно должно оставаться связанным с стеной');
assert.equal(movableEvac.wallId, movableWall.id, 'Эвакуационный проём должен оставаться связанным с стеной');
assert.equal(movableDoor.t, doorT, 'При переносе стены относительная позиция двери сохраняется');
assert.equal(movableDoor.w, doorW);
assert.equal(movableWindow.t, windowT, 'При переносе стены относительная позиция окна сохраняется');
assert.equal(movableWindow.w, windowW);
assert.equal(movableEvac.t, evacT, 'При переносе стены относительная позиция эвакуационного проёма сохраняется');
assert.equal(movableEvac.w, evacW);
assert.equal(engine.api.state.openings.length, 3, 'При переносе стены количество проёмов не меняется');
assert.equal(engine.api.moveOpeningTo(movableDoor, 4.5), true, 'Проём должен перемещаться по своей стене');
assert.equal(engine.api.state.openings.length, 3, 'Перенос проёма не должен создавать копию');
assert.equal(engine.api.moveOpeningTo(movableWindow, 6), true, 'Окно должно перемещаться по своей стене');
assert.equal(engine.api.moveOpeningTo(movableDoor, 7), false, 'Проём нельзя перемещать через связанный проём');
engine.api.deleteWall(movableWall);
assert.equal(engine.api.state.openings.length, 0, 'Удаление стены должно удалить её проёмы');

const roundTripProject = JSON.parse(JSON.stringify({
  app: 'dentplan',
  layout: {
    nodes: [{ id: 'n1', x: 2, z: 3 }, { id: 'n2', x: 12, z: 3 }],
    walls: [{ id: 'w1', a: 'n1', b: 'n2', kind: 'inner' }],
    openings: [{ id: 'o1', wallId: 'w1', t: 0.45, w: 1, kind: 'door', flip: false }],
  },
  items: [],
}));
assert.equal(sandbox.validateProjectData(roundTripProject), null, 'Сохранённая после переноса геометрия должна загружаться');

console.log('DentPlan smoke checks passed');
