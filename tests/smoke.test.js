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
assert.match(html, /id="btnProjNew"/, 'В блоке проекта должна быть кнопка нового проекта');
assert.match(html, /Новый проект/, 'Кнопка нового проекта должна быть подписана');
assert.match(html, /Сохранённый файл не удаляется/, 'Новый проект не должен удалять сохранённый JSON');
assert.match(html, /data-page="projects"/, 'В верхнем меню должен быть отдельный раздел проектов');
assert.match(html, /id="projectsPage"/, 'Для проектов должна быть отдельная страница');
assert.match(html, /id="projectSearch"/, 'В разделе проектов должен быть поиск по названию');
assert.match(html, /function filterProjectRecords\(/, 'Поиск проектов должен быть отдельной функцией');
assert.match(html, /function saveProjectToLibrary\(/, 'Проект должен сохраняться в локальную библиотеку');
assert.match(html, /\$\('#btnProjNew'\)\.addEventListener\('click',newProject\)/, 'Кнопка нового проекта должна запускать сброс текущего чертежа');
assert.match(html, /projectDirty/, 'Должен отслеживаться статус несохранённых изменений');
assert.match(html, /document\.createTextNode\(String\(msg\)\)/, 'Текст тоста нельзя вставлять как HTML');
assert.match(html, /if\(!confirmReplaceProject\(\)\)return(?: false)?;/, 'Импорт и шаблоны должны уважать отмену замены проекта');
assert.doesNotMatch(html, /проверка пройдена/i, 'Даже предварительный статус не должен звучать как заключение');
assert.doesNotMatch(html, /Нормы соблюдены/, 'В интерфейсе не должно быть неподтверждённого заявления о нормативах');
assert.doesNotMatch(html, /соответствует требованиям/i, 'Нельзя выдавать юридическое заключение о соответствии');
assert.match(html, /id="projectProfile"/, 'В интерфейсе должен быть переключатель профиля проекта');
assert.match(html, /id="btnCatalogToggle"[^>]*aria-controls="catalog"/, 'На мобильном должна быть отдельная кнопка открытия каталога');
assert.match(html, /id="menuBackdrop"/, 'Открытое мобильное меню должно иметь доступный фон для закрытия');
assert.match(html, /function setCatalogOpen\(/, 'Мобильное меню должно открываться и закрываться отдельным состоянием');
assert.match(html, /function applyView\(/, 'Переключение вида должно быть общей функцией для desktop и mobile');
assert.match(html, /isMobileViewport\(\)&&v==='both'\?'plan':v/, 'На мобильном режим Рядом должен заменяться полноэкранным Планом');
assert.match(html, /#catalog\.open\{/, 'Мобильное меню должно иметь открытое состояние');
assert.match(html, /\.menu-backdrop\.open\{/, 'Фон мобильного меню должен иметь открытое состояние');
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

const projectHelpers = script[1].match(/function normalizeProjectName\(value\)\{[\s\S]*?\n\}\nfunction filterProjectRecords\(records,query\)\{[\s\S]*?\n\}/);
assert(projectHelpers, 'Не найдены чистые функции работы с названиями проектов');
const projectHelperSandbox = {};
vm.runInNewContext(`const PROJECT_DEFAULT_NAME='Новый проект';\n${projectHelpers[0]}\nthis.normalizeProjectName=normalizeProjectName;this.filterProjectRecords=filterProjectRecords;`, projectHelperSandbox);
assert.equal(projectHelperSandbox.normalizeProjectName('  Клиника   на   Ленина  '), 'Клиника на Ленина', 'Название проекта должно нормализоваться');
assert.equal(projectHelperSandbox.normalizeProjectName(''), 'Новый проект', 'Пустому проекту должно назначаться понятное имя');
assert.deepEqual(
  JSON.parse(JSON.stringify(projectHelperSandbox.filterProjectRecords([
    { name: 'Стоматология на Ленина' },
    { name: 'Кабинет на Петровской' },
  ], 'лен'))),
  [{ name: 'Стоматология на Ленина' }],
  'Поиск проектов должен находить название без учёта регистра',
);
assert.match(html, /id="calcWallHeight"/, 'В интерфейсе должна быть высота стен');
assert.match(html, /id="calcDoorHeight"/, 'В интерфейсе должна быть высота дверей');
assert.match(html, /id="calcEvacHeight"/, 'В интерфейсе должна быть высота эвакуационных проёмов');
assert.match(html, /id="calcWindowHeight"/, 'В интерфейсе должна быть высота окон');
assert.match(html, /calculation:normalizeCalculationSettings\(state\.calculation\)/, 'Настройки расчёта должны сохраняться в JSON проекта');
assert.match(html, /const loadedCalculation=normalizeCalculationSettings\(p\.calculation\)/, 'Настройки должны загружаться до замены проекта');
assert.match(html, /function openingMetrics\(/, 'Геометрия проёма должна иметь единый расчёт размеров');
assert.match(html, /function angleDeviation\(/, 'Для углов нужна единая чистая функция');
assert.match(html, /angleHintForNode\(drawState\.lastNodeId/, 'Подсказка угла должна вызываться в preview цепочного рисования');
assert.match(html, /if\(angleHint\)drawTag\(g,X\(m\.x\),Y\(m\.z\)\+18,angleHintText\(angleHint\)/, 'Preview должен рисовать live-подсказку угла рядом с курсором');
assert.match(html, /drawState\.last=\{x:B\.x,z:B\.z\};drawState\.lastNodeId=B\.id/, 'После фиксации сегмента цепочка должна сохранить узел для следующего preview');
assert.match(html, /function angleCorrectionText\(/, 'Коррекция угла должна быть отдельной чистой функцией');
assert.match(html, /angleHintForNode\(n\.id,\{x:n\.x,z:n\.z\},w\.id\)/, 'Подсказка угла должна вызываться при изменении конца стены');
assert.match(html, /function translateWall\(/, 'Перенос стены должен быть переиспользуемой операцией модели');
assert.match(html, /function moveOpeningTo\(/, 'Перенос проёма должен быть переиспользуемой операцией модели');
assert.match(html, /function openingHitDistance\(/, 'Hit-test проёма должен учитывать его видимую область');
assert.match(html, /let d=openingHitDistance\(o,m\)/, 'Выбор проёма должен использовать расширенный hit-test');
assert.match(html, /function openingScreenHitDistance\(o,p\)/, 'Выбор проёма должен иметь экранный hit-test видимой графики');
assert.match(html, /d=Math\.min\(d,openingScreenHitDistance\(o,p\)\)/, 'Выбор проёма должен проверять экранную геометрию двери после поворота');
assert.match(html, /function openingMarkerPoint\(/, 'Hit-test должен учитывать видимый маркер двери');
assert.match(html, /d=Math\.min\(d,distSeg\(p,door\.hinge,arcEnd\)\)/, 'Hit-test должен проверять видимое полотно двери в координатах модели');
assert.match(html, /const SELECT_COLOR='#BE4128'/, 'Выбранные элементы должны иметь отдельный контрастный цвет');
assert.match(html, /selW\?SELECT_COLOR/, 'Выбранная стена должна подсвечиваться контрастно');
assert.match(html, /selectedItem\?SELECT_COLOR/, 'Выбранный предмет должен подсвечиваться контрастно');
assert.match(html, /openingVisualColor\(kind,selected,hovered\)/, 'Выбранный проём должен использовать отдельный визуальный цвет');
assert.match(html, /const hovering=!opts\.plain&&openingHoverActive\(wallsMode,o,hoverOpening\)/, 'Отрисовка должна подсвечивать дверь при hover в любом инструменте стен');
assert.match(html, /function deleteOpening\(/, 'Проём должен удаляться как отдельная сущность без копирования');
assert.match(html, /function selectOpening\(/, 'Дверь, окно и эвакуационный проём должны выделяться отдельной сущностью');
assert.match(html, /function deleteSelectedOpening\(/, 'Удаление выбранного проёма должно иметь отдельный безопасный маршрут');
assert.match(html, /if\(act==='del'\)\{[\s\S]*?deleteSelectedOpening\(\)/, 'Кнопка корзины должна удалять именно выбранный проём');
assert.match(html, /if\(e\.key==='Delete'\|\|e\.key==='Backspace'\)\{[\s\S]*?wallBarAct\('del'\)/, 'Delete/Backspace должны удалять выбранный проём через тот же маршрут');
assert.match(html, /if\(openingHit\)\{if\(!selectOpening\(openingHit\)\)return;/, 'Клик по проёму должен выделять именно выбранный проём');
assert.match(html, /function normalizeOpeningRot\(/, 'Угол проёма должен нормализоваться перед сохранением');
assert.match(html, /function rotateOpening\(/, 'Проём должен вращаться независимо от стены');
assert.match(html, /hingeSide:'left',openingDirection:'inside'/, 'Новая дверь должна иметь отдельные начальные значения петель и открывания');
assert.match(html, /function normalizeHingeSide\(/, 'Сторона петель должна иметь нормализованное состояние');
assert.match(html, /function normalizeOpeningDirection\(/, 'Направление открывания должно иметь отдельное состояние');
assert.match(html, /function doorState\(/, 'Поза двери должна быть общей для 2D и 3D');
assert.match(html, /function toggleDoorHingeSide\(/, 'Сторону петель нужно переключать отдельно');
assert.match(html, /function toggleDoorOpeningDirection\(/, 'Направление открывания нужно переключать отдельно');
assert.match(html, /function openingDoorGeometry\(/, 'Геометрия двери должна учитывать петли и направление');
assert.match(html, /const door=openingDoorGeometry\(wall,g2,\{[\s\S]*?hingeSide,openingDirection\}\)/, '2D-дуга должна использовать выбранную сторону петель и направление');
assert.match(html, /const door=o\.kind==='window'\?null:openingDoorGeometry\(w,geo,o\)/, '3D-дверь должна использовать ту же геометрию');
assert.match(html, /data-act="hinge"[^>]*>[^<]*Петли:/, 'Карточка двери должна показывать сторону петель');
assert.match(html, /data-act="flip"[^>]*>[\s\S]*?Открывание:/, 'Карточка двери должна показывать направление открывания');
assert.match(html, /if\(act==='hinge'\)[\s\S]*?toggleDoorHingeSide\(op\)/, 'Кнопка петель должна менять только сторону крепления');
assert.match(html, /if\(act==='flip'\)[\s\S]*?toggleDoorOpeningDirection\(op\)/, 'Кнопка открывания должна менять только направление');
assert.match(html, /hingeSide:normalizeHingeSide\(o\.hingeSide\)/, 'Сторона петель должна сохраняться и загружаться нормализованной');
assert.match(html, /openingDirection:normalizeOpeningDirection\(o\.openingDirection,o\.flip\)/, 'Направление должно сохраняться с совместимостью legacy flip');
assert.match(html, /function rotateOpeningHalfTurn\(/, 'Для двери должна быть отдельная операция поворота на 180°');
assert.match(html, /function doorPose\(/, 'Геометрия двери должна выбирать корректную петлю при развороте');
assert.match(html, /const hinge=pose&&pose\.hingeSide==='right'\?gp\[1\]:gp\[0\]/, '3D-дверь должна использовать выбранную сторону петель');
assert.match(html, /data-opening-angle/, 'Для двери или окна должен быть доступен точный угол');
assert.match(html, /data-act="rot180"/, 'В карточке проёма должна быть отдельная кнопка поворота на 180°');
assert.match(html, /if\(act==='rot180'\)\{[\s\S]*?rotateOpeningHalfTurn\(op\)/, 'Кнопка 180° должна вызывать поворот, а не зеркальное отражение');
assert.match(html, /rot:\+normalizeOpeningRot\(o\.rot\)\.toFixed\(4\)/, 'Независимый угол проёма должен сохраняться в JSON');
assert.match(html, /rotationDeg:roundExport\(rotation\*180\/Math\.PI\)/, 'Угол проёма должен попадать в выгрузку в градусах');
assert.match(html, /hingeSide:normalizeHingeSide\(o\.hingeSide\)/, 'Сторона петель должна попадать в сохранение/выгрузку');
assert.match(html, /openingDirection,?rot:rotation/, 'Направление открывания должно попадать в выгрузку');
assert.match(html, /function wallNeighborDistances\(/, 'Для стены должны вычисляться расстояния до соседних стен');
assert.match(html, /wallNeighborDistanceText\(w\)/, 'Расстояния до соседних стен должны быть видны в панели стены');
assert.match(html, /function wallMotionAxis\(/, 'Направление pointermove должно иметь чистый axis helper');
assert.match(html, /function wallClearance\(segment,motion\)/, 'Для preview и drag нужен расчёт расстояния до внешнего контура с motion hint');
assert.match(html, /function wallClearanceText\(/, 'Пара clearance должна иметь единый формат подписи');
assert.match(html, /wallClearanceText\(wallClearance\(\{A:drawState\.last,B:m\},\{dx:m\.x-drawState\.last\.x,dz:m\.z-drawState\.last\.z\}\)\)/, 'Preview новой стены должен выбирать clearance по направлению протягивания');
assert.match(html, /const clearanceText=wallClearanceText\(wallClearance\(w,\{dx,dz\}\)\)[\s\S]*liveLabel=\{x:m\.x,z:m\.z,text:fmt2\(wallGeom\(w\)\.len\)/, 'Drag целой стены должен обновлять clearance по вектору pointermove');
assert.match(html, /сверху[\s\S]*снизу/, 'Для вертикального движения нужна пара top/bottom');
assert.match(html, /слева[\s\S]*справа/, 'Для горизонтального движения нужна пара left/right');
assert.match(html, /function alignWallToPerpendicular\(/, 'Автоматическое выравнивание стены должно быть отдельной операцией');
assert.match(html, /data-act="orthogonal"[^>]*>[\s\S]*?Выровнять до 90°/, 'У стены должна быть кнопка выравнивания до 90°');
assert.match(html, /const doubleClick=shouldFinishDrawingOnDoubleClick\(e,prev,p,now\)\|\|/, 'Двойной клик должен завершать цепочку рисования только в той же точке');
assert.match(html, /function shouldFinishDrawingOnDoubleClick\(e,previous,current,now\)/, 'Завершение рисования должно проверять координаты повторного клика');
assert.match(html, /function pointNearOpeningArc\(/, 'Hit-test должен учитывать дугу двери');
assert.doesNotMatch(html, /function beginWallDragAt\(/, 'Во время рисования не должно быть отдельной ветки выбора готовой стены');
assert.match(html, /const sp=wallDrawSnapPoint\(m,drawState\.last\)/, 'Цепочное рисование должно привязывать конечную точку к существующей стене');
assert.doesNotMatch(html, /if\(drawState&&!nodeAt\(p\)&&beginWallDragAt\(p\)\)return;/, 'Активная цепочка не должна превращать клик по наружной стене в выбор стены');
assert.match(html, /function shouldPrioritizeOpeningHit\(/, 'Существующий проём должен иметь приоритет над добавлением нового');
assert.match(html, /else\{setTool\('select'\);select\(null\);\}/, 'При входе в режим стен должен включаться выбор существующих объектов');
assert.match(html, /function finishWallDrawing\(/, 'Завершение рисования стены должно возвращать инструмент выбора');
assert.match(html, /finishWallDrawing\(\);toast\('Рисование завершено'\)/, 'Двойной или правый клик должен завершать рисование и включать выбор');
const openingToolBranch = script[1].slice(script[1].indexOf('if(TOOL_DEF[t])'), script[1].indexOf("if(t==='erase')", script[1].indexOf('if(TOOL_DEF[t])')));
assert.ok(openingToolBranch.indexOf('const existingOpening=openingAt(p)') < openingToolBranch.indexOf('const wh=wallAt(p)'), 'Hit-test существующего проёма должен идти раньше поиска стены');
assert.match(openingToolBranch, /if\(op\)\{setTool\('select'\);selectOpening\(op\);selectWallObj/, 'После установки нового проёма инструмент должен перейти в выбор');
const contextMenuBranch = script[1].slice(script[1].indexOf("plan.cv.addEventListener('contextmenu'"), script[1].indexOf("plan.cv.addEventListener('dblclick'"));
assert.ok(contextMenuBranch.indexOf('const oh=openingAt(p)') < contextMenuBranch.indexOf('const wh=wallAt(p)'), 'При удалении правым кликом проём должен иметь приоритет над стеной');
const selectPointerBranch = script[1].slice(script[1].indexOf('/* select */'), script[1].indexOf('/* режим предметов */'));
assert.ok(selectPointerBranch.indexOf('const openingHit=openingAt(p)') < selectPointerBranch.indexOf('const hd=handleAt(p)'), 'При выборе проёма hit-test должен выполняться до ручки стены');
assert.match(selectPointerBranch, /if\(hd&&!\(openingHit&&hd\.type==='wall'\)\)/, 'Ручка стены не должна перехватывать клик по проёму');
assert.match(selectPointerBranch, /if\(openingHit\)\{[^}]*wallDrag=\{type:'opening',id:openingHit\.id/, 'Клик по проёму должен запускать drag только выбранного проёма');
assert.match(html, /wallDrag=\{type:'wall',id:wh\.id/, 'Клик по стене должен начинать её drag');
assert.match(html, /wallDrag=\{type:'opening',id:openingHit\.id/, 'Клик по проёму должен начинать его drag');
assert.match(html, /startM:toMeters\(p\),oa:\{\.\.\.g\.A\},ob:\{\.\.\.g\.B\}/, 'Drag стены должен сохранить исходную точку и оба конца');
assert.match(html, /const dx=m\.x-wallDrag\.startM\.x,dz=m\.z-wallDrag\.startM\.z/, 'Перенос стены должен считаться от начала drag, а не от уже изменённой геометрии');
assert.match(html, /translateWall\(w,dx,dz,wallDrag\.oa,wallDrag\.ob\)/, 'Drag стены должен переносить оба конца');
assert.match(html, /moveOpeningTo\(op,proj\)/, 'Drag проёма должен менять его положение, а не создавать копию');
assert.match(html, /else if\(wallDrag\.type==='opening'\)\{[\s\S]*?refresh\(\);commit\(\);renderWallBar\(\);/, 'Завершённый drag проёма должен обновлять вид, панель и историю');
assert.match(html, /else if\(wallDrag\.type==='wall'\)\{[\s\S]*?staticDirty=true;refresh\(\);commit\(\);/, 'Завершённый drag стены должен обновлять 2D/3D и историю');
assert.match(html, /function wallHoverLabel\(/, 'Для hover нужна единая классификация стены и проёма');
assert.match(html, /function openingHoverActive\(/, 'Hover проёма должен иметь единый предикат для всех инструментов стен');
assert.match(html, /endDraw\(\);ghost=null;hoverErase=null;hoverLabel=null;hoverOpening=null;/, 'При смене инструмента старая hover-подпись не должна зависать');
assert.match(html, /hoverOpening=openingAt\(p\)/, 'Hover должен сначала проверять проём независимо от инструмента');
assert.match(html, /const hoverWall=hoverOpening\?null:wallAt\(p\)/, 'Линия стены не должна перекрывать подпись проёма');
assert.match(html, /const hoverText=wallHoverLabel\(hoverOpening,hoverWall\)/, 'Hover должен вызывать классификацию элемента');
assert.match(html, /plan\.cv\.style\.cursor=hoverOpening\?'pointer'/, 'По существующей двери должен быть pointer-курсор');
assert.match(html, /if\(wallsMode&&hoverLabel&&!opts\.plain\)\{[\s\S]*?drawTag\(g,X\(hoverLabel\.x\)/, 'Подпись hover должна рисоваться через canvas drawTag');
assert.match(html, /pointerleave',\(\)=>\{[^}]*hoverLabel=null/, 'Подпись hover должна очищаться при уходе с canvas');
assert.match(html, /let hoverNode=null,hoverErase=null,hoverLabel=null,hoverOpening=null/, 'Для двери должен храниться отдельный hover-состояние');
assert.match(html, /function openingVisualColor\(/, 'У двери должна быть отдельная визуальная hover-подсветка');
assert.match(html, /const col=openingVisualColor\(kind,selected,hovered\)/, 'Графика проёма должна использовать hover-состояние');
assert.match(html, /glyphOpening\(g,X,Y,fit,w,g2,o\.t,o\.w,o\.kind,o\.flip,selected,o\.rot,hovering,o\.hingeSide,o\.openingDirection\)/, 'Поза двери и hover-состояние должны доходить до графики');
assert.match(html, /pointerleave',\(\)=>\{[^}]*hoverOpening=null/, 'Hover двери должен очищаться при уходе с canvas');
assert.match(html, /слева[\s\S]{0,160}ширина[\s\S]{0,160}справа/i, 'Выбранный проём должен показывать отступы и ширину');
assert.match(html, /от начала[\s\S]{0,120}ширина/i, 'При переносе проёма нужно показывать положение и ширину');
assert.match(html, /id="wallLegend"[^>]*aria-label="Как выбрать элемент стены"/, 'В режиме стен должна быть доступна легенда выбора');
assert.match(html, /#wallLegend\{display:block;margin-top:8px;/, 'Легенда выбора должна занимать место в каталоге, а не перекрывать план');
assert.match(html, /<p class="ul-hint" id="toolHint" hidden><\/p>\s*<div id="wallLegend"/, 'Легенда выбора должна находиться рядом с подсказкой режима стен');
assert.match(html, /Линия стены — стена/, 'Легенда должна объяснять выбор стены по линии');
assert.match(html, /дуга или значок двери\/эвакуационного проёма — проём/, 'Легенда должна объяснять выбор двери и эвакуационного проёма');
assert.match(html, /линия окна — окно/, 'Легенда должна объяснять выбор окна по линии');
assert.match(html, /Выбранное подсвечивается красным, карточка с типом/, 'Легенда должна объяснять подтверждение выбора');
assert.match(html, /\$\('#wallLegend'\)\.hidden=m!==['"]walls['"]/, 'Легенда должна показываться только в режиме стен');

assert.match(html, /camera:\s*\{[^}]*group:'Безопасность'/, 'В каталоге должна быть камера видеонаблюдения');
assert.match(html, /function nudgeSelectedItem\(/, 'Выбранный предмет должен двигаться клавишами');
assert.match(html, /id="ibAngle"[^>]*type="number"/, 'Панель предмета должна принимать точный угол');
assert.match(html, /cameras=cnt\('camera'\)/, 'Камеры должны считаться в статистике');
assert.match(html, /КАМЕР[^\n]*String\(s\.cameras\)/, 'Число камер должно попадать в PDF-экспорт');
assert.match(html, /BUILDERS=\{[\s\S]*camera\(\)/, 'Для камеры нужна 3D-модель');
assert.match(html, /function addItem\([^]*?clampItem\(item\)/, 'Новый предмет должен сразу ограничиваться контуром');
assert.match(html, /function nudgeSelectedItem\([^]*?moveItem\(it\)/, 'Сдвиг клавишами должен сохранять предмет в контуре');
assert.match(html, /data-mode="materials"/, 'Для расчёта материалов должен быть отдельный режим');
assert.match(html, /id="materialPanel"/, 'В боковой панели должен быть раздел материалов');
assert.match(html, /id="materialSelectionStatement"/, 'Должна быть смета выделенной геометрии');
assert.match(html, /id="materialEstimateStatement"/, 'Должна быть смета материалов');
assert.match(html, /id="materialCatalogList"/, 'В интерфейсе должен быть каталог материалов');
assert.match(html, /function materialSelectionSummary\(/, 'Выделение должно иметь единый расчёт площади');
assert.match(html, /function calculateMaterialEstimate\(/, 'Расход и стоимость должны считаться отдельной чистой функцией');
assert.match(html, /function materialWallSegments\(/, 'Выделение стен должно уметь находить отдельные участки');
assert.match(html, /function materialWallSegmentAt\(/, 'Клик по плану должен определять конкретный участок стены');
assert.match(html, /wallSegments/, 'Выбранные участки стен должны сохраняться отдельно от целых стен');
assert.match(html, /В РАСЧЁТ · S/, 'Выделенный участок должен иметь понятную подпись на чертеже');
assert.match(html, /customPrices/, 'Цена материала должна быть изменяемой вручную');
assert.match(html, /sourceUrl/, 'Для ориентировочной цены должен сохраняться источник');
assert.match(html, /consumptionPerM2/, 'Каталог должен хранить расход на единицу площади');
assert.match(html, /consumptionTotal/, 'Смета должна рассчитывать общий расход по норме');
assert.match(html, /materials:normalizeMaterialSettings\(state\.materials\)/, 'Настройки материалов должны сохраняться в JSON проекта');
assert.match(html, /materials:materialStatements\(source\)/, 'Выгрузка должна содержать сметные данные');
assert.match(html, /priceCheckedAt/, 'В каталоге должна быть дата проверки ориентировочной цены');
assert.match(html, /id="btnMaterialAdd"/, 'В каталоге должна быть кнопка добавления пользовательской позиции');
assert.match(html, /function addCustomMaterial\(/, 'Добавление пользовательской позиции должно быть отдельной функцией');
assert.match(html, /customCatalog/, 'Пользовательский каталог должен сохраняться в состоянии проекта');
assert.match(html, /persistCustomMaterialCatalog\(/, 'Пользовательский каталог должен сохраняться между сессиями браузера');
assert.match(html, /СПЕЦИФИКАЦИЯ ОСНАЩЕНИЯ/, 'В PDF должна остаться спецификация');
assert.match(html, /id="btnCatalogAll"[^>]*aria-controls="catList"/, 'У каталога должна быть доступна общая кнопка управления');
assert.match(html, /class="cat-group-toggle"/, 'У каждой группы должна быть отдельная кнопка сворачивания');
assert.match(html, /cat-group-toggle[^]*aria-expanded=/, 'У кнопки группы должно быть состояние раскрытия');
assert.match(html, /cat-group-toggle[^]*aria-controls=/, 'Кнопка группы должна быть связана с содержимым');
assert.match(html, /Свернуть всё|Развернуть всё/, 'Общая кнопка должна показывать действие');
assert.match(html, /const catalogGroupOpen=\{\}/, 'Состояние групп должно жить отдельно от DOM-перерисовки');
assert.match(html, /function setCatalogGroupOpen\(/, 'Должна быть функция переключения группы');
assert.match(html, /function refreshCatalogControls\(/, 'После перерисовки каталога должно восстанавливаться состояние');
assert.match(html, /catalogGroupOpen\[gr\]/, 'Перерисовка каталога должна использовать сохранённое состояние группы');
assert.match(html, /state\.items\.forEach\(i=>map\[i\.type\]=\(map\[i\.type\]\|\|0\)\+1\)/, 'Экспорт должен сохранять количество единиц');
assert.match(html, /id="workspaceNav"/, 'У проекта должна быть верхняя навигация по разделам');
assert.match(html, /data-page="calculations"/, 'Должен быть отдельный раздел расчётов');
assert.match(html, /data-page="catalog"/, 'Должен быть отдельный раздел каталога');
assert.match(html, /data-page="statements"/, 'Должен быть отдельный раздел смет');
assert.match(html, /<span>Сметы<\/span>/, 'Раздел ведомостей должен называться сметами');
assert.match(html, /id="catalogPage"/, 'Каталог материалов должен иметь отдельную страницу');
assert.match(html, /id="statementsPage"/, 'Сметы должны иметь отдельную страницу');
assert.match(html, /id="materialCatalogSearch"/, 'На странице каталога должен быть поиск материалов');
assert.match(html, /id="materialCatalogGroup"/, 'На странице каталога должен быть фильтр категорий');
assert.match(html, /id="materialCatalogSubgroup"/, 'На странице каталога должен быть фильтр подкатегорий');
assert.match(html, /id="materialCatalogBrand"/, 'На странице каталога должен быть фильтр брендов');
assert.match(html, /id="materialCatalogPath"/, 'Каталог должен показывать путь текущего выбора');
assert.match(html, /function materialBrands\(/, 'Поиск бренда должен учитывать бренды карточки');
assert.match(html, /brandOptions/, 'Карточка должна хранить найденные варианты бренда');
assert.match(html, /MATERIAL_RETAIL_SOURCES/, 'Каталог должен хранить вторые розничные источники');
assert.match(html, /secondarySourceUrl/, 'Карточка должна сохранять дополнительную ссылку на источник');
assert.match(html, /priceUnit/, 'Карточка должна отдельно хранить единицу цены');
assert.match(html, /group:'Двери и окна'/, 'В каталоге должен быть отдельный раздел дверей и окон');
assert.match(html, /subgroup:'Межкомнатные двери'/, 'В каталоге должна быть подкатегория межкомнатных дверей');
assert.match(html, /subgroup:'Оконные блоки'/, 'В каталоге должна быть подкатегория оконных блоков');
assert.match(html, /calculationMode:'piece'/, 'Двери и оконные блоки должны иметь поштучный режим расчёта');
assert.match(html, /pieceKind:'window'/, 'Для оконного блока должен сохраняться тип проёма');
assert.match(html, /petrovich\.ru\/catalog\/10050\//, 'Для дверей должен сохраняться источник Петровича');
assert.match(html, /petrovich\.ru\/catalog\/15635\//, 'Для окон должен сохраняться источник Петровича');
assert.match(html, /materialCustomSubgroup/, 'Пользовательская позиция должна принимать подкатегорию');
assert.match(html, /materialCustomBrand/, 'Пользовательская позиция должна принимать бренд');
assert.match(html, /materialCustomFormat/, 'Пользовательская позиция должна принимать формат');
assert.match(html, /materialCustomCalculationMode/, 'Пользовательская позиция должна принимать тип расчёта');
assert.match(html, /materialCustomPieceKind/, 'Пользовательская позиция должна принимать тип проёма');
assert.match(html, /materialCustomConsumption/, 'Пользовательская позиция должна принимать расход на 1 м²');
assert.match(html, /materialCustomConsumptionUnit/, 'Пользовательская позиция должна принимать единицу нормы');
assert.match(html, /id="objectCatalogSearch"/, 'Каталог предметов должен иметь собственный поиск');
assert.match(html, /function setPage\(/, 'Навигация по разделам должна быть централизованной');
assert.match(html, /function buildMaterialCatalogPage\(/, 'Страница каталога должна собираться из актуального каталога');
assert.match(html, /function updateStatementsPage\(/, 'Страница смет должна обновляться из актуального расчёта');
assert.doesNotMatch(html, /Ведомость выделений|Ведомость материалов/, 'В интерфейсе не должно остаться старых названий ведомостей');
for (const type of ['instrument', 'compressor', 'camera', 'desk', 'officechair']) {
  assert.match(html, new RegExp(`case '${type}'`), `Для ${type} нужно 2D-представление`);
  assert.match(html, new RegExp(`\\n\\s{2}${type}\\(\\)`), `Для ${type} нужно 3D-представление`);
}
assert.match(html, /accept="\.png,\.jpg,\.jpeg,\.pdf,image\/png,image\/jpeg,application\/pdf"/, 'Выбор подложки должен ограничивать форматы');
assert.match(html, /function underlayFileError\(/, 'Формат подложки нужно проверять до чтения файла');
assert.match(html, /function isPdfFile\(/, 'Поддержка PDF должна определяться отдельно');
assert.match(html, /getDocument\(/, 'Загрузка PDF должна использовать PDF.js');
assert.match(html, /getPage\(1\)/, 'Минимум должна отображаться первая страница PDF');
assert.match(html, /page\.render\(\{canvasContext:ctx,viewport\}\)/, 'Первая страница PDF должна рендериться в canvas');
assert.match(html, /function pdfRenderScale\(/, 'Масштаб растеризации PDF нужно ограничить');
assert.match(html, /underlay\.uw\*=k/, 'Калибровка должна менять масштаб подложки');
assert.match(html, /visible:underlay\.visible,opacity:underlay\.opacity/, 'Проект должен сохранять настройки подложки');
assert.match(html, /source:underlay\.source,page:underlay\.page/, 'Проект должен сохранять источник и страницу PDF-подложки');
assert.match(html, /underlay\.source=p\.underlay\.source==='pdf'\?'pdf':'image';underlay\.page=/, 'Загрузка проекта должна восстанавливать источник и страницу подложки');
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
underlaySandbox.isPdfFile=f=>String(f&&f.type||'').toLowerCase()==='application/pdf'||/\.pdf$/i.test(String(f&&f.name||''));
assert.equal(underlaySandbox.underlayFileError({ name: 'plan.png', type: 'image/png' }), null, 'PNG должен приниматься');
assert.equal(underlaySandbox.underlayFileError({ name: 'plan.jpeg', type: 'image/jpeg' }), null, 'JPEG должен приниматься');
assert.equal(underlaySandbox.underlayFileError({ name: 'plan.pdf', type: 'application/pdf' }), null, 'PDF должен приниматься');
assert.match(underlaySandbox.underlayFileError({ name: 'plan.svg', type: 'image/svg+xml' }), /PNG, JPG и PDF/, 'Посторонний формат должен отклоняться');

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
const newProjectStart = scriptSource.indexOf('function newProject()');
const saveProjectStart = scriptSource.indexOf('function saveProject()');
assert(newProjectStart >= 0 && saveProjectStart > newProjectStart, 'Сброс нового проекта должен быть отдельной операцией перед сохранением');
const newProjectSection = scriptSource.slice(newProjectStart, saveProjectStart);
assert.match(newProjectSection, /if\(!confirmReplaceProject\(\)\)return(?: false)?;/, 'Новый проект должен спрашивать подтверждение перед сбросом');
assert.match(newProjectSection, /clearItems\(\)/, 'Новый проект должен очищать предметы');
assert.match(newProjectSection, /state\.nodes=\[\];state\.walls=\[\];state\.openings=\[\];/, 'Новый проект должен очищать геометрию и проёмы');
assert.match(newProjectSection, /state\.seq=1;nid=1;wid=1;oid=1;/, 'Новый проект должен сбрасывать идентификаторы');
assert.match(newProjectSection, /removeUnderlay\(\)/, 'Новый проект должен очищать подложку');
assert.match(newProjectSection, /state\.fire=false/, 'Новый проект должен выключать направления эвакуации');
assert.match(newProjectSection, /setMode\('items'\);setTool\('select'\)/, 'Новый проект должен возвращать базовый режим выбора');
assert.match(newProjectSection, /refresh\(\);resetHistory\(\)/, 'Новый проект должен обновлять экран и чистую историю');
const saveProjectSection = scriptSource.slice(saveProjectStart, scriptSource.indexOf('function loadProjectData('));
assert.match(saveProjectSection, /name:normalizeProjectName\(currentProjectName\)/, 'Файл проекта должен сохранять название');
assert.match(saveProjectSection, /saveProjectToLibrary\(proj\)/, 'Сохранение должно обновлять библиотеку проектов');
assert.match(scriptSource, /if\(page==='projects'\)buildProjectsPage\(\)/, 'Переход в проекты должен перерисовывать библиотеку');
const renderCallIndex = scriptSource.indexOf('await page.render({canvasContext:ctx,viewport})');
const underlayAssignmentIndex = scriptSource.indexOf('underlay.img=canvas');
assert(renderCallIndex >= 0 && underlayAssignmentIndex > renderCallIndex, 'Подложка не должна заменяться до успешного render PDF');
const pdfScaleRule = scriptSource.match(/function pdfRenderScale\(pageWidth,pageHeight,maxSide\)\{[\s\S]*?\n\}/);
const pdfErrorRule = scriptSource.match(/function pdfErrorMessage\(e\)\{[\s\S]*?\n\}/);
assert(pdfScaleRule&&pdfErrorRule, 'Не найдены правила PDF');
const pdfLoadSection = scriptSource.slice(
  scriptSource.indexOf('function loadPdfFile(f)'),
  scriptSource.indexOf('function loadImageFile(f)'),
);

async function runPdfRenderSmoke(){
  const events=[];
  const ctx={fillStyle:'',fillRect(){events.push('fill');}};
  const canvas={
    width:0,height:0,
    getContext(kind){assert.equal(kind,'2d','PDF должен использовать 2D-canvas');return ctx;},
  };
  const page={
    getViewport({scale}){return{width:600*scale,height:300*scale};},
    render({canvasContext,viewport}){
      assert.equal(canvasContext,ctx,'PDF должен рендериться в созданный canvas');
      assert.deepEqual(viewport,{width:2200,height:1100},'PDF должен получить ограниченный viewport');
      events.push('render');return{promise:Promise.resolve()};
    },
  };
  const pdf={
    numPages:2,
    async getPage(number){assert.equal(number,1,'Должна запрашиваться первая страница PDF');return page;},
    destroy(){events.push('destroy');return Promise.resolve();},
  };
  const elements={'#ulOpacity':{value:0},'#ulOpVal':{textContent:''}};
  const underlayState={img:null,name:'',source:'image',page:null,visible:false,opacity:0,calibrated:false};
  class FakeReader{readAsArrayBuffer(){this.result=new ArrayBuffer(8);this.onload();}}
  const renderSandbox={
    FileReader:FakeReader,Uint8Array,Promise,
    document:{createElement(tag){assert.equal(tag,'canvas','PDF должен создаваться как canvas');return canvas;}},
    loadPdfJs:async()=>({getDocument({data}){assert(data instanceof Uint8Array,'PDF должен передаваться в PDF.js как Uint8Array');return{promise:Promise.resolve(pdf)};}}),
    toast(message,isError){events.push({message,isError:!!isError});},underlay:underlayState,
    $(selector){return elements[selector];},fitUnderlay(){},updateUlUI(){},markDirty(){},
  };
  vm.runInNewContext(`${pdfScaleRule[0]}\n${pdfErrorRule[0]}\n${pdfLoadSection}\nthis.loadPdfFile=loadPdfFile;`,renderSandbox);
  renderSandbox.loadPdfFile({name:'plan.pdf',type:'application/pdf',size:123});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(renderSandbox.underlay.img,canvas,'После render PDF должен стать текущей подложкой');
  assert.equal(renderSandbox.underlay.source,'pdf','Источник подложки должен быть отмечен как PDF');
  assert.equal(renderSandbox.underlay.page,1,'Сохранённая страница PDF должна быть первой');
  assert.equal(renderSandbox.underlay.visible,true,'Новая PDF-подложка должна быть видимой');
  assert(events.includes('render'),'PDF render должен быть вызван');
  assert(events.includes('destroy'),'PDF-документ должен освобождаться после render');

  const previousImage={marker:'previous-underlay'};
  renderSandbox.underlay.img=previousImage;
  renderSandbox.loadPdfJs=async()=>{throw new Error('Invalid PDF structure');};
  renderSandbox.loadPdfFile({name:'broken.pdf',type:'application/pdf',size:123});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(renderSandbox.underlay.img,previousImage,'Ошибка PDF не должна заменять текущую подложку');
}

const templateFilterSource = scriptSource.match(/function templatesForProfile\(templates,profile\)\{[^}]+\}/);
assert(templateFilterSource, 'Не найдена функция безопасного списка шаблонов');
const templateSandbox = {};
vm.runInNewContext(`${templateFilterSource[0]}\nthis.templatesForProfile=templatesForProfile;`, templateSandbox);
const templateFixtures = [{ id: 'start' }, { id: 'family' }, { id: 'flag' }, { id: 'empty' }];
assert.deepEqual(JSON.parse(JSON.stringify(templateSandbox.templatesForProfile(templateFixtures, 'general'))), [{ id: 'empty' }], 'General должен показывать только нейтральный чистый лист');
assert.equal(templateSandbox.templatesForProfile(templateFixtures, 'dental').length, 4, 'Dental должен сохранять стоматологические шаблоны');
const exportSection = scriptSource.slice(
  scriptSource.indexOf('const CALCULATION_DEFAULTS='),
  scriptSource.indexOf('/* ═══════════════ ЭКСПОРТ ═══════════════ */'),
);
const materialSection = scriptSource.slice(
  scriptSource.indexOf('function normalizeCustomMaterial('),
  scriptSource.indexOf('function exitPoints()'),
);
const materialCatalogFixture = [{
  id: 'paint-interior',
  name: 'Тестовая краска',
  group: 'Тест',
  subgroup: 'Краски',
  brand: 'ТестБренд',
  brandOptions: ['ТестБренд', 'ДругойБренд'],
  format: 'моющаяся · интерьерная',
  unit: 'ведро',
  priceUnit: 'ведро',
  packSize: '10 л',
  price: 100,
  coverageM2PerUnit: 10,
  consumptionPerM2: 0.3,
  consumptionUnit: 'л/м²',
  consumptionBasis: 'тестовая норма',
  norm: '1 ведро на 10 м²',
  wastePct: 10,
  sourceTitle: 'Тестовый источник',
  sourceUrl: 'https://example.com/material',
  secondarySourceTitle: 'Петрович · тестовая категория',
  secondarySourceUrl: 'https://petrovich.ru/catalog/10042/',
  priceCheckedAt: '2026-10-20',
}];
const exportSandbox = {
  MATERIAL_CATALOG: materialCatalogFixture,
  MATERIAL_DEFAULTS: { scope: 'room', wallIds: [], wallSegments: [], zone: null, materialId: 'paint-interior', wastePct: null, customPrices: {} },
};
vm.runInNewContext(`const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\nfunction normalizeOpeningRot(rot){const full=Math.PI*2,a=Number(rot);if(!Number.isFinite(a))return 0;return((a+Math.PI)%full+full)%full-Math.PI;}\nfunction normalizeHingeSide(side){return side==='right'?'right':'left';}\nfunction normalizeOpeningDirection(direction,legacyFlip){return direction==='outside'||(!direction&&legacyFlip)?'outside':'inside';}\n${materialSection}\n${exportSection}\nthis.buildDataExport=buildDataExport;this.dataExportToCsv=dataExportToCsv;this.normalizeCalculationSettings=normalizeCalculationSettings;this.normalizeMaterialSettings=normalizeMaterialSettings;this.materialSelectionSummary=materialSelectionSummary;this.calculateMaterialEstimate=calculateMaterialEstimate;this.materialStatements=materialStatements;this.materialWallSegments=materialWallSegments;this.materialWallSegmentAt=materialWallSegmentAt;`, exportSandbox);
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
    { id: 'o1', wallId: 'w1', t: 0.5, w: 1, kind: 'door', flip: false, rot: Math.PI / 6 },
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
assert.ok(Math.abs(dataExport.layout.openings[0].rotationDeg - 30) < 0.001, 'Независимый угол двери должен экспортироваться');
assert.ok(Math.abs(dataExport.layout.openings[0].rot - Math.PI / 6) < 1e-6, 'Внутренний угол двери должен экспортироваться в радианах');
assert.equal(dataExport.layout.openings[0].hingeSide, 'left', 'Выгрузка должна сохранять сторону петель');
assert.equal(dataExport.layout.openings[0].openingDirection, 'inside', 'Выгрузка должна сохранять направление открывания');
assert.equal(dataExport.layout.openings[0].flip, false, 'Legacy flip должен совпадать с направлением открывания');
assert.match(exportSandbox.dataExportToCsv(dataExport), /item,i1,chair/);
assert.match(exportSandbox.dataExportToCsv(dataExport), /opening,o1,door,[^\n]*,30,/, 'CSV должен содержать угол проёма');
const materialSource = {
  room: { w: 4, d: 3 },
  nodes: exportState.nodes,
  walls: exportState.walls,
  openings: [exportState.openings[0]],
  calculation: { wallHeightM: 3, openingHeightsM: { door: 2.1, evac: 2.1, window: 1.5 } },
  materials: { scope: 'walls', wallIds: ['w1', 'w2'], materialId: 'paint-interior', wastePct: 10 },
};
const materialStatements = exportSandbox.materialStatements(materialSource, materialCatalogFixture);
assert.equal(materialStatements.selection.areaM2, 18.9, 'Площадь стен должна вычитать дверь из выбранной стены');
assert.equal(materialStatements.materials[0].areaWithWasteM2, 20.79, 'К площади должен добавляться заданный запас');
assert.equal(materialStatements.materials[0].purchaseUnits, 3, 'Количество упаковок должно округляться вверх');
assert.equal(materialStatements.totalCost, 300, 'Итог должен умножать упаковки на цену');
assert.equal(materialStatements.materials[0].subgroup, 'Краски', 'Смета должна сохранять подкатегорию материала');
assert.equal(materialStatements.materials[0].brand, 'ТестБренд', 'Смета должна сохранять бренд материала');
assert.equal(materialStatements.materials[0].format, 'моющаяся · интерьерная', 'Смета должна сохранять формат материала');
assert.equal(materialStatements.materials[0].priceUnit, 'ведро', 'Смета должна сохранять единицу цены');
assert.equal(materialStatements.materials[0].secondarySourceUrl, 'https://petrovich.ru/catalog/10042/', 'Смета должна сохранять дополнительный источник');
assert.equal(materialStatements.materials[0].consumptionPerM2, 0.3, 'Смета должна сохранять норму на 1 м²');
assert.equal(materialStatements.materials[0].consumptionTotal, 6.237, 'Смета должна рассчитывать общий расход по норме');
assert.equal(materialStatements.materials[0].purchaseUnitsPerM2, 0.1, 'Смета должна сохранять расход покупной единицы на 1 м²');
const pieceMaterial = {
  id: 'door-block',
  name: 'Тестовый дверной блок',
  group: 'Двери и окна',
  subgroup: 'Межкомнатные двери',
  brand: 'ТестБренд',
  format: '800×2000 мм · глухая',
  unit: 'шт.',
  priceUnit: 'шт.',
  packSize: '1 шт.',
  price: 5603,
  coverageM2PerUnit: 1,
  calculationMode: 'piece',
  pieceKind: 'door',
  quantityLabel: 'дверных проёма',
  norm: '1 шт. на дверной проём',
  wastePct: 0,
  sourceTitle: 'Тестовый источник дверей',
  sourceUrl: 'https://example.com/door',
  priceCheckedAt: '2026-10-20',
};
const pieceStatements = exportSandbox.materialStatements({ ...materialSource, openings: exportState.openings, materials: { scope: 'walls', wallIds: ['w1', 'w2'], materialId: 'door-block', wastePct: 0 } }, [pieceMaterial]);
assert.equal(pieceStatements.materials[0].quantity, 1, 'Поштучный материал должен считать дверные проёмы на выбранных стенах');
assert.equal(pieceStatements.materials[0].purchaseUnits, 1, 'Дверной блок должен считаться одной покупной единицей');
assert.equal(pieceStatements.totalCost, 5603, 'Смета дверного блока должна умножать количество на цену за штуку');
assert.equal(pieceStatements.materials[0].calculationMode, 'piece', 'Смета должна сохранять режим поштучного расчёта');
const segmentedSource = {
  room: { w: 4, d: 3 },
  nodes: [
    { id: 'a', x: 0, z: 0 }, { id: 'b', x: 4, z: 0 },
    { id: 'c', x: 1.5, z: -2 }, { id: 'd', x: 1.5, z: 0 },
  ],
  walls: [
    { id: 'outer', a: 'a', b: 'b', kind: 'outer' },
    { id: 'partition', a: 'c', b: 'd', kind: 'inner' },
  ],
  openings: [{ id: 'seg-door', wallId: 'outer', t: 0.75, w: 1, kind: 'door' }],
  calculation: { wallHeightM: 3, openingHeightsM: { door: 2.1, evac: 2.1, window: 1.5 } },
};
const outerParts = exportSandbox.materialWallSegments(segmentedSource, segmentedSource.walls[0]);
assert.deepEqual(JSON.parse(JSON.stringify(outerParts.map(part => [part.startM, part.endM]))), [[0, 1.5], [1.5, 2.5], [3.5, 4]], 'Наружная стена должна делиться по примыканию перегородки и проёму');
assert.equal(exportSandbox.materialWallSegmentAt(segmentedSource, segmentedSource.walls[0], { x: 0.75, z: 0 }).key, outerParts[0].key, 'Клик по наружной стене должен выбирать ближайший отдельный участок');
const partialWallStatements = exportSandbox.materialStatements({ ...segmentedSource, materials: { scope: 'walls', wallSegments: [{ wallId: 'outer', startM: 0, endM: 1.5 }], materialId: 'paint-interior', wastePct: 0 } }, materialCatalogFixture);
assert.equal(partialWallStatements.selection.total.lengthM, 1.5, 'В смету должна попадать только длина выбранного участка');
assert.equal(partialWallStatements.selection.areaM2, 4.5, 'Площадь должна считаться по выбранному участку, а не по всей наружной стене');
assert.equal(partialWallStatements.selection.rows.length, 1, 'Смета должна содержать только выбранный участок');
assert.equal(partialWallStatements.selection.rows[0].endM, 1.5, 'Смета должна хранить конец выбранного участка');
const materialCsv=exportSandbox.dataExportToCsv(exportSandbox.buildDataExport(materialSource, exportCatalog, '2026-09-08T00:00:00.000Z'));
assert.match(materialCsv, /material/);
assert.match(materialCsv, /consumptionPerM2/, 'CSV должен содержать поля нормы расхода');
const customMaterial = {
  id: 'custom-clinic-paint',
  name: 'Краска из пользовательского каталога',
  group: 'Пользовательские материалы',
  unit: 'ведро 12 л',
  price: 250,
  coverageM2PerUnit: 12,
  consumptionPerM2: 0.25,
  consumptionUnit: 'кг/м²',
  norm: '1 ведро на 12 м²',
  sourceTitle: 'Карточка пользователя',
  sourceUrl: 'https://example.com/custom-material',
  priceCheckedAt: '2026-10-20',
};
const customSettings = exportSandbox.normalizeMaterialSettings({ scope: 'walls', wallIds: ['w1', 'w2'], materialId: customMaterial.id, wastePct: 0, customCatalog: [customMaterial] });
assert.equal(customSettings.customCatalog[0].id, customMaterial.id, 'Позиция пользователя должна проходить нормализацию');
assert.equal(customSettings.customCatalog[0].consumptionPerM2, 0.25, 'Пользовательская позиция должна сохранять норму на 1 м²');
const customStatements = exportSandbox.materialStatements({ ...materialSource, materials: { ...materialSource.materials, ...customSettings } });
assert.equal(customStatements.materials[0].id, customMaterial.id, 'Расчёт должен разрешать пользовательский материал');
assert.equal(customStatements.totalCost, 500, 'Пользовательская цена и фасовка должны участвовать в расчёте');
const tunedExport=exportSandbox.buildDataExport({...exportState,calculation:{wallHeightM:4,openingHeightsM:{door:2,evac:3,window:1}}},exportCatalog,'2026-09-08T00:00:00.000Z');
assert.equal(tunedExport.layout.wallArea.netM2,49.8,'Площадь стен должна меняться от настроек');
assert.deepEqual(JSON.parse(JSON.stringify(tunedExport.layout.wallArea.assumptions)),{wallHeightM:4,openingHeightM:{door:2,evac:3,window:1}});
assert.match(exportSandbox.dataExportToCsv(tunedExport), /# calculation,wallHeightM,4,doorHeightM,2,evacHeightM,3,windowHeightM,1/);
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
  scriptSource.indexOf('const CALCULATION_DEFAULTS='),
  scriptSource.indexOf('function saveProject()'),
);
const sandbox = {
  window: { addEventListener() {} },
  CATALOG: { chair: {}, sofa: {}, camera: {} },
  normalizeCustomMaterial(item) {
    const src = item && typeof item === 'object' ? item : {};
    const name = String(src.name || '').trim();
    const price = Number(src.price);
    const coverage = Number(src.coverageM2PerUnit);
    return name && Number.isFinite(price) && price >= 0 && Number.isFinite(coverage) && coverage > 0 ? src : null;
  },
  console,
};
vm.runInNewContext(`${projectSection}\nthis.validateProjectData=validateProjectData;this.normalizeCalculationSettings=normalizeCalculationSettings;`, sandbox);
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
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.normalizeCalculationSettings())), {wallHeightM:3,openingHeightsM:{door:2.1,evac:2.1,window:1.5}}, 'Старый проект без настроек должен открываться со старыми значениями');
assert.equal(sandbox.validateProjectData({...validProject,calculation:{wallHeightM:1.9}}), 'Некорректная высота стен');
assert.equal(sandbox.validateProjectData({...validProject,calculation:{openingHeightsM:{window:4.1}}}), 'Некорректная высота проёма');
assert.equal(sandbox.validateProjectData({ ...validProject, profile: 'dental' }), null);
assert.equal(sandbox.validateProjectData({ ...validProject, profile: 'general' }), null);
assert.equal(
  sandbox.validateProjectData({
    ...validProject,
    materials: { customCatalog: [{ name: 'Краска пользователя', price: 500, coverageM2PerUnit: 10 }] },
  }),
  null,
  'Проект должен принимать корректную пользовательскую позицию материала',
);
assert.match(
  sandbox.validateProjectData({
    ...validProject,
    materials: { customCatalog: [{ name: 'Повреждённый материал', price: -1, coverageM2PerUnit: 10 }] },
  }),
  /позиция пользовательского каталога/,
  'Повреждённая пользовательская позиция должна отклоняться',
);
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
vm.runInNewContext(`${engineSection}\nthis.api={state,addNode,addWall,addOpening,openingMetrics,openingFits,openingHitDistance,openingMarkerPoint,openingHoverActive,shouldPrioritizeOpeningHit,angleDeviation,angleHintForNode,angleCorrectionText,angleHintText,translateWall,moveOpeningTo,deleteWall,deleteOpening,deleteSelectedOpening,selectOpening,wallHoverLabel,openingVisualColor,pointNearOpeningArc,wallNeighborDistances,wallNeighborDistanceText,wallMotionAxis,wallClearance,wallClearanceText,alignWallToPerpendicular,normalizeOpeningRot,rotateOpening,rotateOpeningHalfTurn,doorPose,doorState,normalizeHingeSide,normalizeOpeningDirection,toggleDoorHingeSide,toggleDoorOpeningDirection,openingWallNormal,doorSwingSign,openingDoorGeometry,wallGeom,projectPointToWall,wallDrawSnapPoint,splitWallAtPoint,shouldFinishDrawingOnDoubleClick};`, engine);
engine.TOOL_DEF = { door: {}, window: {}, evac: {} };
assert.equal(engine.api.shouldPrioritizeOpeningHit('door', { id: 'o1' }), true, 'При клике по двери нужно начать её перенос');
assert.equal(engine.api.shouldPrioritizeOpeningHit('door', null), false, 'Без проёма нужно оставить возможность его добавить');
assert.equal(engine.api.shouldFinishDrawingOnDoubleClick({ detail: 2 }, { at: 100, x: 20, y: 20 }, { x: 25, y: 23 }, 400), true, 'Двойной клик в той же точке должен завершать рисование');
assert.equal(engine.api.shouldFinishDrawingOnDoubleClick({ detail: 2 }, { at: 100, x: 20, y: 20 }, { x: 80, y: 20 }, 400), false, 'Клик в другой точке не должен преждевременно завершать цепочку');
assert.equal(engine.api.shouldFinishDrawingOnDoubleClick({ detail: 2 }, { at: 100, x: 20, y: 20 }, { x: 21, y: 21 }, 700), false, 'Запоздалый повторный клик не должен считаться двойным');
assert.equal(engine.api.wallHoverLabel(null, { kind: 'outer' }), 'Наружная стена');
assert.equal(engine.api.wallHoverLabel(null, { kind: 'inner' }), 'Перегородка');
assert.equal(engine.api.wallHoverLabel({ kind: 'door' }, { kind: 'outer' }), 'Дверь', 'Проём должен иметь приоритет над стеной в hover');
assert.equal(engine.api.wallHoverLabel({ kind: 'window' }, { kind: 'inner' }), 'Окно');
assert.equal(engine.api.wallHoverLabel({ kind: 'evac' }, { kind: 'outer' }), 'Эвакуационный проём');
assert.equal(engine.api.wallHoverLabel(null, null), '');
assert.equal(engine.api.openingVisualColor('door', false, true), '#D97706', 'Дверь при наведении должна выделяться отдельным цветом');
assert.equal(engine.api.openingVisualColor('window', false, true), '#D97706', 'Окно при наведении должно выделяться тем же контрастом');
assert.equal(engine.api.openingVisualColor('evac', false, true), '#D97706', 'Эвакуационный проём при наведении должен выделяться тем же контрастом');
assert.equal(engine.api.openingVisualColor('door', true, true), '#BE4128', 'Выбранная дверь должна оставаться красной поверх hover');
assert.equal(engine.api.openingHoverActive(true, { id: 'o1' }, { id: 'o1' }), true, 'Дверь должна подсвечиваться при наведении в режиме стен');
assert.equal(engine.api.openingHoverActive(true, { id: 'o1' }, { id: 'o2' }), false, 'Подсветка не должна переходить на другой проём');
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
const doorMarker = engine.api.openingMarkerPoint(wall, engine.api.wallGeom(wall), door);
assert.ok(Number.isFinite(doorMarker.x) && Number.isFinite(doorMarker.z), 'У двери должна быть вычислимая точка видимого маркера');
assert.equal(engine.api.openingHitDistance(door, doorMarker), 0, 'Клик по видимому маркеру двери должен выбирать дверь');
assert.equal(door.hingeSide, 'left', 'Новая дверь должна начинаться с петлями слева');
assert.equal(door.openingDirection, 'inside', 'Новая дверь должна начинаться с открыванием внутрь');
const doorPlacement = { t: door.t, w: door.w, rot: door.rot, wallId: door.wallId };
assert.equal(engine.api.toggleDoorHingeSide(door), true, 'Сторона петель должна переключаться отдельно');
assert.equal(door.hingeSide, 'right', 'Переключение петель должно переносить крепление на другой конец');
assert.deepEqual({ t: door.t, w: door.w, rot: door.rot, wallId: door.wallId }, doorPlacement, 'Перенос петель не должен менять положение двери');
assert.equal(engine.api.toggleDoorHingeSide(door), true, 'Повторное переключение петель должно быть обратимым');
assert.equal(door.hingeSide, 'left');
assert.equal(engine.api.toggleDoorOpeningDirection(door), true, 'Направление открывания должно переключаться отдельно');
assert.equal(door.openingDirection, 'outside', 'Направление должно меняться на наружу');
assert.equal(door.flip, true, 'Legacy flip должен отражать открывание наружу');
assert.deepEqual({ t: door.t, w: door.w, rot: door.rot, wallId: door.wallId }, doorPlacement, 'Смена направления не должна менять положение двери');
const insideGeometry = engine.api.openingDoorGeometry(wall, engine.api.wallGeom(wall), door);
const insideSign = engine.api.doorSwingSign(wall, engine.api.wallGeom(wall), door);
assert.equal(engine.api.toggleDoorOpeningDirection(door), true, 'Повторное переключение направления должно быть обратимым');
assert.equal(door.openingDirection, 'inside');
const insideGeometryAgain = engine.api.openingDoorGeometry(wall, engine.api.wallGeom(wall), door);
assert.equal(engine.api.doorSwingSign(wall, engine.api.wallGeom(wall), door), -insideSign, 'Внутреннее и наружное открывание должны менять сторону дуги');
assert.deepEqual(insideGeometry.hinge, insideGeometryAgain.hinge, 'Смена направления не должна переносить петлю');
engine.api.toggleDoorHingeSide(door);
const rightHingeGeometry = engine.api.openingDoorGeometry(wall, engine.api.wallGeom(wall), door);
assert.notDeepEqual(insideGeometryAgain.hinge, rightHingeGeometry.hinge, 'Смена стороны петель должна менять только конец крепления');
engine.api.toggleDoorHingeSide(door);
const doorMetrics = engine.api.openingMetrics(door);
const doorHinge = {
  x: doorMetrics.g.A.x + doorMetrics.g.ux * (doorMetrics.center - doorMetrics.width / 2),
  z: doorMetrics.g.A.z + doorMetrics.g.uz * (doorMetrics.center - doorMetrics.width / 2),
};
assert.equal(engine.api.openingHitDistance(door, { x: doorHinge.x, z: doorHinge.z - 0.9 }), 0, 'Видимая дуга двери должна попадать в область выбора');
assert.ok(engine.api.openingHitDistance(door, { x: doorHinge.x, z: doorHinge.z - 1.5 }) > 0, 'Далёкая точка вне дуги двери не должна считаться проёмом');
assert.equal(engine.api.pointNearOpeningArc({ x: 1, y: 0 }, { x: 0, y: 0 }, 1, 0, Math.PI / 2, false, .02), true, 'Точка на дуге двери должна попадать в hit-test');
assert.equal(engine.api.pointNearOpeningArc({ x: 0, y: -1 }, { x: 0, y: 0 }, 1, 0, Math.PI / 2, false, .02), false, 'Точка вне дуги двери не должна попадать в hit-test');
assert.deepEqual(
  { ...engine.api.openingMetrics(door), wall: undefined, g: undefined },
  { wall: undefined, g: undefined, center: 2, left: 1.5, right: 1.5, width: 1, rot: 0 },
  'Размерная цепочка проёма должна считаться от его краёв',
);
assert.equal(door.rot, 0, 'Новый проём должен иметь нулевой независимый поворот');
assert.equal(engine.api.rotateOpening(door, Math.PI / 2), true, 'Проём должен вращаться отдельной операцией');
assert.ok(Math.abs(door.rot - Math.PI / 2) < 1e-9, 'Поворот проёма не должен менять стену');
door.rot=0;
const beforeHalfTurn = door.rot;
assert.equal(engine.api.rotateOpeningHalfTurn(door), true, 'Дверь должна иметь отдельный поворот на 180°');
assert.ok(Math.abs(door.rot - engine.api.normalizeOpeningRot(beforeHalfTurn + Math.PI)) < 1e-9, 'Поворот на 180° должен менять угол, а не зеркалить дверь');
const halfTurnPose = engine.api.doorPose(wall, door.t, door.w, door.rot);
assert.equal(halfTurnPose.endHinge, true, 'После разворота на 180° петля должна перейти на противоположный край проёма');
assert.deepEqual({ x: halfTurnPose.hinge.x, z: halfTurnPose.hinge.z }, { x: 2.5, z: 0 }, 'Петля должна находиться на правом краю исходного проёма');
assert.ok(Math.abs(halfTurnPose.leafEnd.x-1.5)<1e-9&&Math.abs(halfTurnPose.leafEnd.z)<1e-9, 'Закрытый конец двери должен остаться внутри исходного проёма');
assert.equal(engine.api.normalizeOpeningRot(Math.PI * 3), -Math.PI, 'Угол проёма должен приводиться к диапазону −180…180°');
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
const refA = engine.api.addNode(0, 0);
const refB = engine.api.addNode(0, 4);
engine.api.addWall(refA, refB, 'inner');
const skewB = engine.api.addNode(3.8, .8);
const skew = engine.api.addWall(refA, skewB, 'inner');
const neighborText = engine.api.wallNeighborDistanceText(skew);
assert.match(neighborText, /слева|справа/, 'Панель стены должна описывать стороны соседних стен');
assert.equal(engine.api.alignWallToPerpendicular(skew), true, 'Стена должна автоматически выравниваться по соседней');
const aligned = engine.api.angleDeviation({ x: skewB.x - refA.x, z: skewB.z - refA.z }, { x: refB.x - refA.x, z: refB.z - refA.z });
assert.equal(aligned.deviation, 0, 'После автоматического выравнивания отклонение должно быть нулевым');

engine.api.state.nodes.length = 0;
engine.api.state.walls.length = 0;
engine.api.state.openings.length = 0;
const roomA = engine.api.addNode(0, 0);
const roomB = engine.api.addNode(10, 0);
const roomC = engine.api.addNode(10, 8);
const roomD = engine.api.addNode(0, 8);
engine.api.addWall(roomA, roomB, 'outer');
engine.api.addWall(roomB, roomC, 'outer');
engine.api.addWall(roomC, roomD, 'outer');
engine.api.addWall(roomD, roomA, 'outer');
const horizontalA = engine.api.addNode(2, 3);
const horizontalB = engine.api.addNode(8, 3);
const horizontalWall = engine.api.addWall(horizontalA, horizontalB, 'inner');
const horizontalClearance = engine.api.wallClearance(horizontalWall);
assert.equal(horizontalClearance.axis, 'horizontal');
assert.equal(horizontalClearance.top.value, 3, 'Для горизонтальной перегородки сверху должно быть 3 м до внешнего контура');
assert.equal(horizontalClearance.bottom.value, 5, 'Для горизонтальной перегородки снизу должно быть 5 м до внешнего контура');
assert.equal(engine.api.wallClearanceText(horizontalClearance), 'сверху 3,00 м · снизу 5,00 м');
assert.equal(engine.api.wallNeighborDistanceText(horizontalWall), 'сверху 3,00 м · снизу 5,00 м', 'Карточка горизонтальной перегородки должна показывать отступы до внешнего контура');
assert.equal(engine.api.wallMotionAxis({ dx: 3, dz: .2 }), 'horizontal', 'Преобладающее движение по X должно считаться горизонтальным');
assert.equal(engine.api.wallMotionAxis({ axis: 'x' }), 'horizontal', 'Явная axis=x подсказка должна выбрать горизонтальные стороны');
assert.equal(engine.api.wallMotionAxis({ dx: .2, dz: 3 }), 'vertical', 'Преобладающее движение по Z должно считаться вертикальным');
const horizontalMotion = engine.api.wallClearance(horizontalWall, { dx: 3, dz: .1 });
assert.equal(horizontalMotion.displayAxis, 'horizontal');
assert.equal(horizontalMotion.left.value, 5, 'При движении по горизонтали должна показываться дистанция слева');
assert.equal(horizontalMotion.right.value, 5, 'При движении по горизонтали должна показываться дистанция справа');
assert.equal(engine.api.wallClearanceText(horizontalMotion), 'слева 5,00 м · справа 5,00 м');
const verticalA = engine.api.addNode(4, 2);
const verticalB = engine.api.addNode(4, 6);
const verticalWall = engine.api.addWall(verticalA, verticalB, 'inner');
const verticalClearance = engine.api.wallClearance(verticalWall);
assert.equal(verticalClearance.axis, 'vertical');
assert.equal(verticalClearance.left.value, 4, 'Для вертикальной перегородки слева должно быть 4 м до внешнего контура');
assert.equal(verticalClearance.right.value, 6, 'Для вертикальной перегородки справа должно быть 6 м до внешнего контура');
assert.equal(engine.api.wallClearanceText(verticalClearance), 'слева 4,00 м · справа 6,00 м');
assert.equal(engine.api.wallNeighborDistanceText(verticalWall), 'слева 4,00 м · справа 6,00 м', 'Карточка вертикальной перегородки должна показывать отступы до внешнего контура');
const verticalMotion = engine.api.wallClearance(verticalWall, { dx: .1, dz: 3 });
assert.equal(verticalMotion.displayAxis, 'vertical');
assert.equal(verticalMotion.top.value, 4, 'При движении по вертикали должна показываться дистанция сверху');
assert.equal(verticalMotion.bottom.value, 4, 'При движении по вертикали должна показываться дистанция снизу');
assert.equal(engine.api.wallClearanceText(verticalMotion), 'сверху 4,00 м · снизу 4,00 м');
assert.equal(engine.api.wallMotionAxis('z'), 'vertical', 'Строковая axis=z подсказка должна выбрать вертикальные стороны');
const diagonalClearance = engine.api.wallClearance({ A: { x: 2, z: 2 }, B: { x: 8, z: 6 } }, { dx: 1, dz: 1 });
assert.equal(diagonalClearance.axis, 'normal', 'Для диагонального движения должен быть безопасный fallback по нормали');
assert.equal(diagonalClearance.displayAxis, 'normal');
assert.match(engine.api.wallClearanceText(diagonalClearance), /по нормали .* · против нормали /);
assert.doesNotThrow(() => engine.api.wallClearance({ a: 'missing', b: 'missing' }, { dx: 1, dz: 0 }), 'Повреждённая ссылка стены не должна ломать перерисовку плана');

engine.api.state.nodes.length = 0;
engine.api.state.walls.length = 0;
engine.api.state.openings.length = 0;
const outerStart = engine.api.addNode(0, 0);
const outerEnd = engine.api.addNode(4, 0);
const outerWall = engine.api.addWall(outerStart, outerEnd, 'outer');
const wallTarget = engine.api.wallDrawSnapPoint({ x: 2.02, z: .12 }, null);
assert.equal(wallTarget.wallId, outerWall.id, 'Конец перегородки рядом с наружной стеной должен привязаться к её линии');
assert.deepEqual({ x: wallTarget.x, z: wallTarget.z }, { x: 2.02, z: 0 }, 'Точка примыкания должна попасть точно на наружную стену');
const junction = engine.api.splitWallAtPoint(outerWall, wallTarget);
assert.ok(junction, 'Наружная стена должна разделяться в точке примыкания');
assert.deepEqual({ x: junction.x, z: junction.z }, { x: 2.02, z: 0 });
assert.equal(engine.api.state.walls.length, 2, 'После примыкания наружная стена должна состоять из двух сегментов');
const partitionStart = engine.api.addNode(2, -2);
const partition = engine.api.addWall(partitionStart, junction, 'inner');
assert.equal(partition.b, junction.id, 'Новая перегородка должна ссылаться на узел наружной стены');

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
const openingMoveNodes = { a: { ...wallA }, b: { ...wallB } };
assert.equal(engine.api.moveOpeningTo(movableDoor, 4.5), true, 'Проём должен перемещаться по своей стене');
assert.deepEqual({ a: { ...wallA }, b: { ...wallB } }, openingMoveNodes, 'Перенос двери не должен менять узлы стены');
assert.equal(engine.api.state.openings.length, 3, 'Перенос проёма не должен создавать копию');
assert.equal(engine.api.moveOpeningTo(movableWindow, 6), true, 'Окно должно перемещаться по своей стене');
assert.equal(engine.api.moveOpeningTo(movableDoor, 7), false, 'Проём нельзя перемещать через связанный проём');
assert.equal(engine.api.deleteOpening(movableEvac), true, 'Проём должен удаляться отдельно от стены');
assert.equal(engine.api.state.openings.length, 2, 'Удаление проёма не должно удалять стену или соседние проёмы');
engine.api.deleteWall(movableWall);
assert.equal(engine.api.state.openings.length, 0, 'Удаление стены должно удалить её проёмы');

const selectableA = engine.api.addNode(0, 0);
const selectableB = engine.api.addNode(9, 0);
const selectableWall = engine.api.addWall(selectableA, selectableB, 'inner');
const selectableOpenings = [
  engine.api.addOpening(selectableWall, .2, 1, 'door'),
  engine.api.addOpening(selectableWall, .5, 1, 'window'),
  engine.api.addOpening(selectableWall, .8, 1, 'evac'),
];
selectableOpenings.forEach((op, index) => {
  assert.equal(engine.api.selectOpening(op), true, 'Проём '+op.kind+' должен выделяться отдельно');
  assert.equal(engine.api.state.selObj.type, 'opening', 'Выбор не должен превращаться в выбор стены');
  assert.equal(engine.api.state.selObj.id, op.id, 'Выбранным должен быть именно нажатый проём');
  const before = engine.api.state.openings.length;
  assert.equal(engine.api.deleteOpening(op), true, 'Выбранный проём '+op.kind+' должен удаляться отдельно');
  assert.equal(engine.api.state.openings.length, before - 1, 'Удаление должно убрать только один проём ('+(index + 1)+')');
  assert.ok(engine.api.state.walls.some(w => w.id === selectableWall.id), 'Удаление проёма не должно удалять стену');
  assert.equal(engine.api.state.selObj, null, 'После удаления выбранного проёма выбор должен очищаться');
});

const wallBarSection = scriptSource.slice(
  scriptSource.indexOf('function wallBarAct'),
  scriptSource.indexOf('/* ═══════════════ ВЗАИМОДЕЙСТВИЕ НА ПЛАНЕ ═══════════════ */'),
);
Object.assign(engine, { refresh() {}, commit() {}, renderWallBar() {}, toast() {} });
vm.runInNewContext(`${wallBarSection}\nthis.wallBarAct=wallBarAct;`, engine);
engine.api.state.nodes.length = 0;
engine.api.state.walls.length = 0;
engine.api.state.openings.length = 0;
const deleteA = engine.api.addNode(0, 0);
const deleteB = engine.api.addNode(9, 0);
const deleteWall = engine.api.addWall(deleteA, deleteB, 'inner');
const deleteTargets = [
  engine.api.addOpening(deleteWall, .18, 1, 'door'),
  engine.api.addOpening(deleteWall, .5, 1, 'window'),
  engine.api.addOpening(deleteWall, .82, 1, 'evac'),
];
engine.api.selectOpening(deleteTargets[0]);
const deleteDoorPlacement = { t: deleteTargets[0].t, w: deleteTargets[0].w, rot: deleteTargets[0].rot, wallId: deleteTargets[0].wallId };
engine.wallBarAct('hinge');
assert.equal(deleteTargets[0].hingeSide, 'right', 'Карточка должна переносить петли на другую сторону');
assert.deepEqual({ t: deleteTargets[0].t, w: deleteTargets[0].w, rot: deleteTargets[0].rot, wallId: deleteTargets[0].wallId }, deleteDoorPlacement, 'Карточка петель не должна сдвигать дверь');
engine.wallBarAct('flip');
assert.equal(deleteTargets[0].openingDirection, 'outside', 'Карточка должна менять направление открывания');
assert.deepEqual({ t: deleteTargets[0].t, w: deleteTargets[0].w, rot: deleteTargets[0].rot, wallId: deleteTargets[0].wallId }, deleteDoorPlacement, 'Карточка направления не должна сдвигать дверь');
engine.wallBarAct('hinge');
engine.wallBarAct('flip');
assert.equal(deleteTargets[0].hingeSide, 'left');
assert.equal(deleteTargets[0].openingDirection, 'inside');
deleteTargets.forEach((target, index) => {
  engine.api.selectOpening(target);
  engine.wallBarAct('del');
  assert.equal(engine.api.state.openings.some(o => o.id === target.id), false, 'Кнопочный маршрут должен удалить ровно выбранный проём');
  assert.ok(engine.api.state.walls.some(w => w.id === deleteWall.id), 'Кнопочный маршрут не должен удалить стену');
  assert.equal(engine.api.state.openings.length, deleteTargets.length - index - 1, 'Кнопочный маршрут должен сохранить соседние проёмы');
});
assert.equal(engine.api.deleteSelectedOpening(), false, 'Без выбранного проёма удаление не должно менять проект');

const roundTripProject = JSON.parse(JSON.stringify({
  app: 'dentplan',
  layout: {
    nodes: [{ id: 'n1', x: 2, z: 3 }, { id: 'n2', x: 12, z: 3 }],
    walls: [{ id: 'w1', a: 'n1', b: 'n2', kind: 'inner' }],
    openings: [{ id: 'o1', wallId: 'w1', t: 0.45, w: 1, kind: 'door', flip: false, rot: Math.PI / 4 }],
  },
  items: [],
}));
assert.equal(sandbox.validateProjectData(roundTripProject), null, 'Сохранённая после переноса геометрия должна загружаться');
assert.equal(sandbox.validateProjectData({
  ...roundTripProject,
  layout: { ...roundTripProject.layout, openings: [{ ...roundTripProject.layout.openings[0], hingeSide: 'right', openingDirection: 'outside', flip: true }] },
}), null, 'Новые поля стороны петель и направления должны приниматься');
assert.match(
  sandbox.validateProjectData({
    ...roundTripProject,
    layout: { ...roundTripProject.layout, openings: [{ ...roundTripProject.layout.openings[0], hingeSide: 'middle' }] },
  }),
  /проёмы/,
  'Некорректная сторона петель должна отклоняться',
);
assert.match(
  sandbox.validateProjectData({
    ...roundTripProject,
    layout: { ...roundTripProject.layout, openings: [{ ...roundTripProject.layout.openings[0], openingDirection: 'sideways' }] },
  }),
  /проёмы/,
  'Некорректное направление открывания должно отклоняться',
);
assert.match(
  sandbox.validateProjectData({ ...roundTripProject, layout: { ...roundTripProject.layout, openings: [{ ...roundTripProject.layout.openings[0], rot: Infinity }] } }),
  /проёмы/,
  'Некорректный независимый угол проёма должен отклоняться',
);

runPdfRenderSmoke()
  .then(()=>console.log('DentPlan smoke checks passed'))
  .catch(error=>{console.error(error);process.exitCode=1;});
