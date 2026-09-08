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
assert.match(html, /Предварительная проверка пройдена/, 'Нельзя заявлять о полном соблюдении нормативов');
assert.doesNotMatch(html, /Нормы соблюдены/, 'В интерфейсе не должно быть неподтверждённого заявления о нормативах');
assert.doesNotMatch(html, /#planPane\{display:none!important\}/, 'План не должен безусловно исчезать на узком экране');
assert.match(html, /aria-label=/, 'Интерактивные элементы должны иметь доступные подписи');
assert.match(html, /function openingMetrics\(/, 'Геометрия проёма должна иметь единый расчёт размеров');
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
for (const type of ['instrument', 'compressor', 'camera', 'desk', 'officechair']) {
  assert.match(html, new RegExp(`case '${type}'`), `Для ${type} нужно 2D-представление`);
  assert.match(html, new RegExp(`\\n\\s{2}${type}\\(\\)`), `Для ${type} нужно 3D-представление`);
}

const scriptSource = script[1];
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
  toast() {},
  fmtM: String,
};
vm.runInNewContext(`${engineSection}\nthis.api={state,addNode,addWall,addOpening,openingMetrics,openingFits};`, engine);
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

console.log('DentPlan smoke checks passed');
