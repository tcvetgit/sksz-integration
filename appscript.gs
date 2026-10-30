/**
 * СЗ App RESULT — приём результатов тестов в Google Таблицу.
 *
 * КАК УСТАНОВИТЬ (5 минут):
 * 1. Открой таблицу «СЗ App RESULT» → «Расширения» → «Apps Script».
 * 2. Удали содержимое файла «Code.gs» и вставь ВЕСЬ этот код. Сохрани (Ctrl+S).
 * 3. Нажми «Развернуть» → «Новое развёртывание»:
 *    - тип: «Веб-приложение»;
 *    - «Выполнять как: меня»;
 *    - «Кто имеет доступ: все»;
 *    - «Развернуть» → скопируй URL вида
 *      https://script.google.com/macros/s/XXXX/exec
 * 4. Отправь URL мне — я вставлю его в приложение (константа SHEET_URL в app.js).
 *
 * Приложение шлёт POST-запрос (Content-Type: text/plain) с массивом записей:
 *   { attempt: [дата, ФИО, ID устройства, тип, глава, всего, верных, %, сдал, сек, ошибок, ID попытки],
 *     errors:  [[ID попытки, дата, ФИО, ID устройства, глава, вопрос, твой ответ, правильный ответ], ...] }
 *
 * Строки дописываются в листы «Попытки» (таблица chanse) и «Ошибки» (таблица error).
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shA = ss.getSheetByName('Попытки') || ss.getSheets()[0];
    var shB = ss.getSheetByName('Ошибки') || ss.getSheets()[0];
    (Array.isArray(data) ? data : [data]).forEach(function (item) {
      if (item && item.attempt) {
        var a = item.attempt.slice();
        if (a.length) a[0] = new Date(a[0]); // строку «дата» превращаем в настоящую дату
        shA.appendRow(a);
      }
      (item.errors || []).forEach(function (er) {
        var b = er.slice();
        if (b.length > 1) b[1] = new Date(b[1]);
        shB.appendRow(b);
      });
    });
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('err: ' + err);
  }
}

// Для проверки из редактора: выдели функцию testWrite и нажми «Выполнить» —
// в таблицу добавится тестовая строка (потом её можно удалить).
function testWrite() {
  doPost({ postData: { contents: JSON.stringify([{
    attempt: [new Date().toISOString(), 'Тест Тестов', 'D-TEST', 'Экзамен', '', 40, 33, 83, 'Сдал', 612, 1, 'test-rid'],
    errors: [['test-rid', new Date().toISOString(), 'Тест Тестов', 'D-TEST', '', 'Тестовый вопрос?', 'Ответ 1', 'Ответ 2']]
  }]) } });
}
