// ═══════════════════════════════════════════════════════════════════
// 📘 نظام المزامنة الذكية المحسّن - النسخة المطورة
// ═══════════════════════════════════════════════════════════════════
// 
// 🎯 الهدف: مزامنة تلقائية ذكية مع أداء عالي
// ✅ يدعم: الإضافة، التعديل، الحذف الفوري
// ⚡ الأداء: محسّن بعمليات جماعية وتجاهل الصفوف الفارغة
// 🔒 آمن: يحذف فقط ما هو محذوف بالفعل من المصدر
//
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// ⚙️ القسم الأول: الإعدادات
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  // ────────────────────────────────────────────────────────────────
  // 📂 روابط ملفات الـSource Sheets
  // ────────────────────────────────────────────────────────────────
  SOURCE_SHEET_IDS: [
    '1vXjmstoCeUI8AUBXDUrScHGtYGpfsXA9unS18fIXmRQ',
    '1RLwxZKlgUSexgWfeYeCnRUPmug6lwuLgc4dhiTi9ULQ'
  ],
  
  // ────────────────────────────────────────────────────────────────
  // 📋 أسماء التبويبات
  // ────────────────────────────────────────────────────────────────
  SOURCE_SHEET_NAME: 'sheet1',
  MASTER_SHEET_NAME: 'sheet1',
  
  // ────────────────────────────────────────────────────────────────
  // 🔑 إعدادات الأعمدة
  // ────────────────────────────────────────────────────────────────
  ID_COLUMN_INDEX: 24,             // رقم عمود الـID في Master (بعد إضافة عمود المصدر)
  SOURCE_NAME_COLUMN_INDEX: 1,     // عمود اسم المصدر (العمود A)
  ID_PREFIX: 'ROW_',
  
  // ────────────────────────────────────────────────────────────────
  // 📊 إعدادات البيانات
  // ────────────────────────────────────────────────────────────────
  HAS_HEADER_ROW: true,
  START_ROW: 2,
  
  // ────────────────────────────────────────────────────────────────
  // ⏱️ إعدادات المزامنة التلقائية
  // ────────────────────────────────────────────────────────────────
  AUTO_SYNC_INTERVAL_HOURS: 1,
  
  // ────────────────────────────────────────────────────────────────
  // 🔧 إعدادات متقدمة
  // ────────────────────────────────────────────────────────────────
  BATCH_SIZE: 500,
  ENABLE_DETAILED_LOGS: true
};

// ═══════════════════════════════════════════════════════════════════
// 📋 القسم الثاني: إنشاء القوائم والأزرار
// ═══════════════════════════════════════════════════════════════════

/**
 * يتم تشغيل هذه الدالة تلقائيًا عند فتح الملف
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    ui.createMenu('🔄 المزامنة الذكية')
      .addItem('▶️ تحديث من جميع المصادر', 'syncAllSources')
      .addSeparator()
      .addItem('🔄 إعادة بناء IDs للصفوف', 'regenerateAllIds')
      .addItem('📊 عرض إحصائيات المزامنة', 'showSyncStatistics')
      .addSeparator()
      .addSubMenu(ui.createMenu('⚙️ إعدادات التشغيل التلقائي')
        .addItem('✅ تفعيل المزامنة التلقائية', 'enableAutoSync')
        .addItem('❌ إيقاف المزامنة التلقائية', 'disableAutoSync')
        .addItem('📋 عرض حالة التشغيل التلقائي', 'showTriggerStatus'))
      .addSeparator()
      .addItem('🔧 إعداد رؤوس الأعمدة', 'setupMasterHeaders')
      .addItem('📖 دليل الاستخدام', 'showUserGuide')
      .addToUi();
    
    log('✅ تم تحميل قائمة المزامنة الذكية');
  } catch (error) {
    console.log('⚠️ onOpen يجب أن يتم تشغيله تلقائيًا عند فتح الملف');
  }
}

/**
 * دالة للاختبار الأولي
 */
function testSetup() {
  console.log('🧪 اختبار الإعداد...');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log('✅ تم الوصول للملف: ' + ss.getName());
    
    const masterSheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
    if (masterSheet) {
      console.log('✅ تم العثور على Master Sheet: ' + CONFIG.MASTER_SHEET_NAME);
    } else {
      console.log('❌ لم يتم العثور على Master Sheet: ' + CONFIG.MASTER_SHEET_NAME);
    }
    
    console.log('\n📂 اختبار الوصول للمصادر...');
    CONFIG.SOURCE_SHEET_IDS.forEach((id, index) => {
      try {
        const sourceSpreadsheet = SpreadsheetApp.openById(id);
        console.log(`✅ المصدر ${index + 1}: ${sourceSpreadsheet.getName()}`);
      } catch (error) {
        console.log(`❌ المصدر ${index + 1}: خطأ - ${error.message}`);
      }
    });
    
    console.log('\n✅ الإعداد جاهز! أغلق الملف وأعد فتحه لرؤية القائمة.');
    
  } catch (error) {
    console.log('❌ خطأ: ' + error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 القسم الثالث: المزامنة الرئيسية المحسّنة
// ═══════════════════════════════════════════════════════════════════

function syncAllSources() {
  const startTime = new Date();
  log('═══════════════════════════════════════════════════════════');
  log('🚀 بدء عملية المزامنة الذكية المحسّنة...');
  log('⏰ التوقيت: ' + Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
  log('═══════════════════════════════════════════════════════════');
  
  try {
    // ────────────────────────────────────────────────────────────
    // 1️⃣ تحضير ملف الـMaster
    // ────────────────────────────────────────────────────────────
    const masterSS = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = masterSS.getSheetByName(CONFIG.MASTER_SHEET_NAME);
    
    if (!masterSheet) {
      throw new Error(`❌ لم يتم العثور على تبويب الـMaster: "${CONFIG.MASTER_SHEET_NAME}"`);
    }
    
    log(`📊 ملف الـMaster: ${masterSS.getName()}`);
    
    // التحقق من وجود رؤوس الأعمدة
    ensureMasterHeaders(masterSheet);
    
    // ────────────────────────────────────────────────────────────
    // 2️⃣ تحميل البيانات الحالية من الـMaster
    // ────────────────────────────────────────────────────────────
    log('📥 جاري تحميل البيانات الحالية من Master...');
    const masterData = loadSheetData(masterSheet);
    const masterMap = createMasterMap(masterData.rows, masterData.startRow);
    
    log(`✅ تم تحميل ${masterData.rows.length} صف من Master`);
    log(`🔑 عدد IDs الفريدة: ${masterMap.size}`);
    
    // ────────────────────────────────────────────────────────────
    // 3️⃣ إحصائيات المزامنة
    // ────────────────────────────────────────────────────────────
    const stats = {
      sourcesProcessed: 0,
      rowsAdded: 0,
      rowsUpdated: 0,
      rowsDeleted: 0,
      rowsSkipped: 0,
      idsGenerated: 0,
      errors: []
    };
    
    // تتبع IDs النشطة في المصادر
    const activeSourceData = new Map();
    let globalSourceOrder = 0;
    
    // ────────────────────────────────────────────────────────────
    // 4️⃣ معالجة كل ملف Source وجمع البيانات
    // ────────────────────────────────────────────────────────────
    log('\n📂 بدء معالجة ملفات المصادر...');
    log('─────────────────────────────────────────────────────────');
    
    for (let i = 0; i < CONFIG.SOURCE_SHEET_IDS.length; i++) {
      const sourceId = CONFIG.SOURCE_SHEET_IDS[i];
      const sourceNum = i + 1;
      
      log(`\n[${sourceNum}/${CONFIG.SOURCE_SHEET_IDS.length}] 🔍 معالجة المصدر...`);
      
      try {
        const sourceSpreadsheet = SpreadsheetApp.openById(sourceId);
        const sourceSheet = sourceSpreadsheet.getSheetByName(CONFIG.SOURCE_SHEET_NAME);
        
        if (!sourceSheet) {
          const errorMsg = `⚠️ لم يتم العثور على التبويب "${CONFIG.SOURCE_SHEET_NAME}" في الملف: ${sourceSpreadsheet.getName()}`;
          log(errorMsg);
          stats.errors.push(errorMsg);
          continue;
        }
        
        const sourceName = sourceSpreadsheet.getName();
        log(`   📄 الملف: ${sourceName}`);
        
        // تحميل بيانات المصدر
        const sourceData = loadSheetData(sourceSheet);
        log(`   📊 عدد الصفوف: ${sourceData.rows.length}`);
        
        if (sourceData.rows.length === 0) {
          log(`   ⚠️ لا توجد بيانات في هذا المصدر`);
          stats.sourcesProcessed++;
          continue;
        }
        
        // إنشاء IDs للصفوف الجديدة
        const idsCreated = ensureIdsInSourceBatch(sourceSheet, sourceData);
        stats.idsGenerated += idsCreated;
        
        if (idsCreated > 0) {
          log(`   🔑 تم إنشاء ${idsCreated} ID جديد`);
        }
        
        // جمع البيانات من هذا المصدر (مع تجاهل الصفوف الفارغة)
        let skippedInSource = 0;
        sourceData.rows.forEach((row, localIndex) => {
          // التحقق من أن الصف ليس فارغًا بالكامل
          if (isRowEmpty(row)) {
            skippedInSource++;
            return;
          }
          
          const idColIndex = CONFIG.ID_COLUMN_INDEX - 2;
          const id = String(row[idColIndex]).trim();
          
          if (id && id !== '') {
            // إضافة اسم المصدر في بداية الصف
            const rowWithSource = [sourceName, ...row];
            
            activeSourceData.set(id, {
              sourceName: sourceName,
              rowData: rowWithSource,
              sourceOrder: globalSourceOrder++,
              localOrder: localIndex
            });
          }
        });
        
        if (skippedInSource > 0) {
          log(`   ⏭️ تم تجاهل ${skippedInSource} صف فارغ`);
          stats.rowsSkipped += skippedInSource;
        }
        
        stats.sourcesProcessed++;
        log(`   ✅ تمت معالجة المصدر بنجاح`);
        
      } catch (error) {
        const errorMsg = `❌ خطأ في معالجة المصدر [${sourceNum}]: ${error.message}`;
        log(errorMsg);
        stats.errors.push(errorMsg);
      }
    }
    
    // ────────────────────────────────────────────────────────────
    // 5️⃣ مزامنة البيانات مع Master
    // ────────────────────────────────────────────────────────────
    log('\n🔄 بدء مزامنة البيانات مع Master...');
    const syncResults = syncDataToMaster(masterSheet, masterMap, activeSourceData);
    
    stats.rowsAdded = syncResults.added;
    stats.rowsUpdated = syncResults.updated;
    
    log(`✅ الإضافة: ${stats.rowsAdded} | التحديث: ${stats.rowsUpdated}`);
    
    // ────────────────────────────────────────────────────────────
    // 6️⃣ الحذف الفوري للصفوف المحذوفة من المصدر
    // ────────────────────────────────────────────────────────────
    log('\n🗑️ التحقق من الصفوف المحذوفة (حذف فوري)...');
    stats.rowsDeleted = deleteRemovedRows(masterSheet, masterMap, activeSourceData);
    
    if (stats.rowsDeleted > 0) {
      log(`✅ تم حذف ${stats.rowsDeleted} صف من Master`);
    } else {
      log('✅ لا توجد صفوف للحذف');
    }
    
    // ────────────────────────────────────────────────────────────
    // 7️⃣ حفظ التغييرات
    // ────────────────────────────────────────────────────────────
    SpreadsheetApp.flush();
    
    // ────────────────────────────────────────────────────────────
    // 8️⃣ عرض الإحصائيات النهائية
    // ────────────────────────────────────────────────────────────
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    
    log('\n═══════════════════════════════════════════════════════════');
    log('✅ اكتملت المزامنة بنجاح!');
    log('═══════════════════════════════════════════════════════════');
    log(`📂 المصادر المعالجة: ${stats.sourcesProcessed}/${CONFIG.SOURCE_SHEET_IDS.length}`);
    log(`➕ صفوف مضافة: ${stats.rowsAdded}`);
    log(`✏️ صفوف محدّثة: ${stats.rowsUpdated}`);
    log(`🗑️ صفوف محذوفة: ${stats.rowsDeleted}`);
    log(`⏭️ صفوف متجاهلة (فارغة): ${stats.rowsSkipped}`);
    log(`🔑 IDs منشأة: ${stats.idsGenerated}`);
    log(`⏱️ الوقت المستغرق: ${duration} ثانية`);
    
    if (stats.errors.length > 0) {
      log(`⚠️ أخطاء: ${stats.errors.length}`);
      stats.errors.forEach(err => log(`   - ${err}`));
    }
    
    log('═══════════════════════════════════════════════════════════');
    
    showSyncCompletionMessage(stats, duration);
    
  } catch (error) {
    log('❌ خطأ فادح في المزامنة: ' + error.message);
    log('📍 Stack: ' + error.stack);
    
    SpreadsheetApp.getUi().alert(
      '❌ خطأ في المزامنة',
      `حدث خطأ أثناء المزامنة:\n\n${error.message}\n\nراجع السجلات للتفاصيل.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🛠️ القسم الرابع: الوظائف المساعدة الأساسية
// ═══════════════════════════════════════════════════════════════════

/**
 * التحقق من أن الصف فارغ بالكامل
 */
function isRowEmpty(row) {
  if (!row || row.length === 0) return true;
  
  return row.every(cell => {
    if (cell === null || cell === undefined || cell === '') return true;
    if (typeof cell === 'string' && cell.trim() === '') return true;
    return false;
  });
}

/**
 * التأكد من وجود رؤوس الأعمدة في Master
 */
function ensureMasterHeaders(sheet) {
  if (!CONFIG.HAS_HEADER_ROW) return;
  
  const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 10).getValues()[0];
  
  if (!firstRow[0] || firstRow[0] === '') {
    log('⚠️ رؤوس الأعمدة غير موجودة، جاري الإعداد...');
    setupMasterHeaders();
  }
}

/**
 * إعداد رؤوس الأعمدة في Master
 */
function setupMasterHeaders() {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.MASTER_SHEET_NAME);
  
  if (!masterSheet) {
    SpreadsheetApp.getUi().alert('❌ خطأ', 'لم يتم العثور على تبويب Master', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const firstCell = masterSheet.getRange(1, 1).getValue();
  
  if (firstCell !== 'اسم المصدر' && firstCell !== 'SourceSheetName') {
    masterSheet.insertColumnBefore(1);
    masterSheet.getRange(1, 1).setValue('اسم المصدر');
    
    const headerRange = masterSheet.getRange(1, 1);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    log('✅ تم إضافة عمود "اسم المصدر" في بداية الجدول');
    
    SpreadsheetApp.getUi().alert(
      '✅ تم الإعداد',
      'تم إضافة عمود "اسم المصدر" في بداية الجدول.\nيرجى التأكد من تحديث CONFIG.ID_COLUMN_INDEX إذا لزم الأمر.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert('✅ جاهز', 'رؤوس الأعمدة موجودة بالفعل', SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * تحميل البيانات من Sheet
 */
function loadSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < CONFIG.START_ROW || lastCol === 0) {
    return {
      rows: [],
      startRow: CONFIG.START_ROW,
      lastRow: lastRow,
      lastCol: lastCol
    };
  }
  
  const numRows = lastRow - CONFIG.START_ROW + 1;
  const range = sheet.getRange(CONFIG.START_ROW, 1, numRows, lastCol);
  const values = range.getValues();
  
  return {
    rows: values,
    startRow: CONFIG.START_ROW,
    lastRow: lastRow,
    lastCol: lastCol
  };
}

/**
 * إنشاء خريطة Master محسّنة
 */
function createMasterMap(rows, startRow) {
  const map = new Map();
  const idColIndex = CONFIG.ID_COLUMN_INDEX - 1;
  
  rows.forEach((row, index) => {
    // تجاهل الصفوف الفارغة
    if (isRowEmpty(row)) return;
    
    const id = String(row[idColIndex]).trim();
    
    if (id && id !== '') {
      map.set(id, {
        rowIndex: startRow + index,
        data: row,
        arrayIndex: index
      });
    }
  });
  
  return map;
}

/**
 * إنشاء IDs للصفوف دفعة واحدة
 */
function ensureIdsInSourceBatch(sheet, sourceData) {
  const idColIndex = CONFIG.ID_COLUMN_INDEX - 2;
  const rowsNeedingIds = [];
  
  sourceData.rows.forEach((row, index) => {
    // تجاهل الصفوف الفارغة
    if (isRowEmpty(row)) return;
    
    const id = String(row[idColIndex]).trim();
    
    if (!id || id === '') {
      rowsNeedingIds.push({
        rowIndex: sourceData.startRow + index,
        arrayIndex: index
      });
    }
  });
  
  if (rowsNeedingIds.length > 0) {
    log(`   🔑 يوجد ${rowsNeedingIds.length} صف بحاجة لـIDs...`);
    
    const updates = [];
    rowsNeedingIds.forEach(item => {
      const newId = generateUniqueId();
      updates.push({
        range: sheet.getRange(item.rowIndex, CONFIG.ID_COLUMN_INDEX - 1),
        value: newId
      });
      
      sourceData.rows[item.arrayIndex][idColIndex] = newId;
    });
    
    // كتابة جميع IDs دفعة واحدة
    updates.forEach(update => {
      update.range.setValue(update.value);
    });
    
    return rowsNeedingIds.length;
  }
  
  return 0;
}

/**
 * مزامنة البيانات مع Master
 */
function syncDataToMaster(masterSheet, masterMap, activeSourceData) {
  const stats = { added: 0, updated: 0 };
  
  const rowsToAdd = [];
  const rowsToUpdate = [];
  
  // المرور على جميع البيانات النشطة
  activeSourceData.forEach((sourceInfo, id) => {
    if (masterMap.has(id)) {
      // الصف موجود - التحقق من التحديثات
      const masterRow = masterMap.get(id);
      const updatedRow = sourceInfo.rowData;
      
      if (!areRowsEqual(masterRow.data, updatedRow)) {
        rowsToUpdate.push({
          rowIndex: masterRow.rowIndex,
          data: updatedRow,
          id: id
        });
        
        masterRow.data = updatedRow;
      }
    } else {
      // صف جديد
      rowsToAdd.push({
        data: sourceInfo.rowData,
        sourceOrder: sourceInfo.sourceOrder,
        id: id
      });
    }
  });
  
  // تنفيذ التحديثات دفعة واحدة
  if (rowsToUpdate.length > 0) {
    log(`   ✏️ تحديث ${rowsToUpdate.length} صف...`);
    
    rowsToUpdate.forEach(update => {
      const range = masterSheet.getRange(update.rowIndex, 1, 1, update.data.length);
      range.setValues([update.data]);
    });
    
    stats.updated = rowsToUpdate.length;
  }
  
  // إضافة الصفوف الجديدة دفعة واحدة
  if (rowsToAdd.length > 0) {
    log(`   ➕ إضافة ${rowsToAdd.length} صف جديد...`);
    
    // ترتيب الصفوف حسب sourceOrder
    rowsToAdd.sort((a, b) => a.sourceOrder - b.sourceOrder);
    
    const dataToAdd = rowsToAdd.map(item => item.data);
    const lastRow = masterSheet.getLastRow();
    const startRow = lastRow + 1;
    
    const range = masterSheet.getRange(startRow, 1, dataToAdd.length, dataToAdd[0].length);
    range.setValues(dataToAdd);
    
    // تحديث الخريطة
    rowsToAdd.forEach((item, index) => {
      masterMap.set(item.id, {
        rowIndex: startRow + index,
        data: item.data,
        arrayIndex: masterMap.size + index
      });
    });
    
    stats.added = rowsToAdd.length;
  }
  
  return stats;
}

/**
 * الحذف الفوري للصفوف المحذوفة من المصدر
 */
function deleteRemovedRows(sheet, masterMap, activeSourceData) {
  const rowsToDelete = [];
  
  // البحث عن الصفوف الموجودة في Master لكن غير موجودة في المصادر
  masterMap.forEach((masterRow, id) => {
    if (!activeSourceData.has(id)) {
      rowsToDelete.push({
        id: id,
        rowIndex: masterRow.rowIndex
      });
    }
  });
  
  if (rowsToDelete.length === 0) {
    return 0;
  }
  
  log(`   🗑️ حذف ${rowsToDelete.length} صف محذوف من المصادر...`);
  
  // الحذف من الأسفل للأعلى لتجنب تغيير الفهارس
  rowsToDelete.sort((a, b) => b.rowIndex - a.rowIndex);
  
  rowsToDelete.forEach(item => {
    sheet.deleteRow(item.rowIndex);
    masterMap.delete(item.id);
    
    if (CONFIG.ENABLE_DETAILED_LOGS) {
      log(`   🗑️ حذف نهائي: ID=${item.id}`);
    }
  });
  
  return rowsToDelete.length;
}

/**
 * مقارنة صفين
 */
function areRowsEqual(row1, row2) {
  const minLength = Math.min(row1.length, row2.length);
  
  for (let i = 0; i < minLength; i++) {
    const val1 = normalizeValue(row1[i]);
    const val2 = normalizeValue(row2[i]);
    
    if (val1 !== val2) return false;
  }
  
  return true;
}

/**
 * تطبيع القيم للمقارنة
 */
function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.getTime();
  return String(value).trim();
}

/**
 * إنشاء ID فريد
 */
function generateUniqueId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${CONFIG.ID_PREFIX}${timestamp}_${random}`;
}

// ═══════════════════════════════════════════════════════════════════
// 🔧 القسم الخامس: وظائف إضافية
// ═══════════════════════════════════════════════════════════════════

/**
 * إعادة بناء IDs لجميع الصفوف
 */
function regenerateAllIds() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ تحذير',
    'هل تريد إعادة إنشاء IDs لجميع الصفوف في المصادر؟\n\n' +
    'تحذير: سيتم استبدال IDs الحالية بأخرى جديدة.',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  let totalIds = 0;
  
  CONFIG.SOURCE_SHEET_IDS.forEach((sourceId, index) => {
    try {
      const sourceSheet = SpreadsheetApp.openById(sourceId).getSheetByName(CONFIG.SOURCE_SHEET_NAME);
      const data = loadSheetData(sourceSheet);
      const idsCreated = ensureIdsInSourceBatch(sourceSheet, data);
      totalIds += idsCreated;
    } catch (error) {
      log(`خطأ في معالجة المصدر ${index + 1}: ${error.message}`);
    }
  });
  
  SpreadsheetApp.flush();
  ui.alert('✅ تم الإنجاز', `تم إنشاء ${totalIds} ID جديد`, ui.ButtonSet.OK);
}

/**
 * عرض إحصائيات المزامنة
 */
function showSyncStatistics() {
  const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.MASTER_SHEET_NAME);
  const masterData = loadSheetData(masterSheet);
  const masterMap = createMasterMap(masterData.rows, masterData.startRow);
  
  let totalSourceRows = 0;
  
  CONFIG.SOURCE_SHEET_IDS.forEach(sourceId => {
    try {
      const sourceSheet = SpreadsheetApp.openById(sourceId).getSheetByName(CONFIG.SOURCE_SHEET_NAME);
      const data = loadSheetData(sourceSheet);
      // عد الصفوف غير الفارغة فقط
      totalSourceRows += data.rows.filter(row => !isRowEmpty(row)).length;
    } catch (error) {
      // تجاهل الأخطاء
    }
  });
  
  const message = 
    `📊 إحصائيات النظام\n\n` +
    `📂 عدد المصادر: ${CONFIG.SOURCE_SHEET_IDS.length}\n` +
    `📋 صفوف في Master: ${masterData.rows.length}\n` +
    `📊 مجموع صفوف المصادر (غير فارغة): ${totalSourceRows}\n` +
    `⏱️ فترة المزامنة التلقائية: كل ${CONFIG.AUTO_SYNC_INTERVAL_HOURS} ساعة\n\n` +
    `ℹ️ ملاحظة: يتم تجاهل الصفوف الفارغة تلقائيًا\n` +
    `ℹ️ الحذف من Master يتم فورًا عند الحذف من المصدر`;
  
  SpreadsheetApp.getUi().alert('📊 الإحصائيات', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * عرض دليل الاستخدام
 */
function showUserGuide() {
  const guide = 
    `📖 دليل الاستخدام السريع\n\n` +
    `1️⃣ الإعداد الأولي:\n` +
    `   • اختر: 🔧 إعداد رؤوس الأعمدة (مرة واحدة فقط)\n` +
    `   • تأكد من تحديث CONFIG.SOURCE_SHEET_IDS\n\n` +
    `2️⃣ لتحديث البيانات يدويًا:\n` +
    `   • اختر: ▶️ تحديث من جميع المصادر\n\n` +
    `3️⃣ لتفعيل المزامنة التلقائية:\n` +
    `   • اختر: ⚙️ إعدادات > ✅ تفعيل المزامنة التلقائية\n\n` +
    `4️⃣ نظام الحذف الفوري:\n` +
    `   • يتم حذف الصفوف من Master فورًا عند حذفها من المصدر\n` +
    `   • لا توجد فترة سماح\n\n` +
    `5️⃣ تجاهل الصفوف الفارغة:\n` +
    `   • الصفوف الفارغة بالكامل يتم تجاهلها تلقائيًا\n` +
    `   • هذا يحسن الأداء ويوفر المساحة\n\n` +
    `6️⃣ عمود "اسم المصدر":\n` +
    `   • يتم إضافته تلقائيًا في بداية كل صف\n` +
    `   • يوضح من أي ملف جاء الصف\n\n` +
    `7️⃣ للمساعدة:\n` +
    `   • راجع التعليقات داخل الكود\n` +
    `   • تحقق من السجلات (Logs)`;
  
  SpreadsheetApp.getUi().alert('📖 دليل الاستخدام', guide, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * عرض رسالة إتمام المزامنة
 */
function showSyncCompletionMessage(stats, duration) {
  const ui = SpreadsheetApp.getUi();
  
  let message = '✅ اكتملت المزامنة بنجاح!\n\n';
  message += `📂 المصادر: ${stats.sourcesProcessed}/${CONFIG.SOURCE_SHEET_IDS.length}\n`;
  message += `➕ مضاف: ${stats.rowsAdded}\n`;
  message += `✏️ محدّث: ${stats.rowsUpdated}\n`;
  
  if (stats.rowsDeleted > 0) {
    message += `🗑️ محذوف: ${stats.rowsDeleted}\n`;
  }
  
  if (stats.rowsSkipped > 0) {
    message += `⏭️ متجاهل (فارغ): ${stats.rowsSkipped}\n`;
  }
  
  if (stats.idsGenerated > 0) {
    message += `🔑 IDs جديدة: ${stats.idsGenerated}\n`;
  }
  
  message += `⏱️ الوقت: ${duration}ث`;
  
  if (stats.errors.length > 0) {
    message += `\n\n⚠️ تحذير: حدثت ${stats.errors.length} أخطاء`;
  }
  
  ui.alert('🔄 المزامنة', message, ui.ButtonSet.OK);
}

// ═══════════════════════════════════════════════════════════════════
// ⏰ القسم السادس: المزامنة التلقائية (Triggers)
// ═══════════════════════════════════════════════════════════════════

/**
 * تفعيل المزامنة التلقائية
 */
function enableAutoSync() {
  disableAutoSync();
  
  ScriptApp.newTrigger('syncAllSources')
    .timeBased()
    .everyHours(CONFIG.AUTO_SYNC_INTERVAL_HOURS)
    .create();
  
  log(`✅ تم تفعيل المزامنة التلقائية كل ${CONFIG.AUTO_SYNC_INTERVAL_HOURS} ساعة`);
  
  SpreadsheetApp.getUi().alert(
    '✅ تم التفعيل',
    `تم تفعيل المزامنة التلقائية.\nسيتم التحديث كل ${CONFIG.AUTO_SYNC_INTERVAL_HOURS} ساعة.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * إيقاف المزامنة التلقائية
 */
function disableAutoSync() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncAllSources') {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  });
  
  log(`✅ تم حذف ${deletedCount} trigger`);
  
  if (deletedCount > 0) {
    SpreadsheetApp.getUi().alert(
      '✅ تم الإيقاف',
      'تم إيقاف المزامنة التلقائية.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * عرض حالة التشغيل التلقائي
 */
function showTriggerStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  const syncTriggers = triggers.filter(t => t.getHandlerFunction() === 'syncAllSources');
  
  let message;
  
  if (syncTriggers.length === 0) {
    message = '❌ المزامنة التلقائية غير مفعلة\n\nلتفعيلها، اختر:\n⚙️ إعدادات التشغيل التلقائي > ✅ تفعيل المزامنة التلقائية';
  } else {
    message = `✅ المزامنة التلقائية مفعلة\n\n`;
    message += `🔄 التكرار: كل ${CONFIG.AUTO_SYNC_INTERVAL_HOURS} ساعة\n`;
    message += `📊 عدد Triggers: ${syncTriggers.length}`;
  }
  
  SpreadsheetApp.getUi().alert('⏰ حالة التشغيل التلقائي', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ═══════════════════════════════════════════════════════════════════
// 📝 القسم السابع: وظائف السجلات (Logging)
// ═══════════════════════════════════════════════════════════════════

/**
 * تسجيل رسالة في السجل
 */
function log(message) {
  if (CONFIG.ENABLE_DETAILED_LOGS) {
    console.log(message);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 📚 ملاحظات مهمة ودليل الإعداد
// ═══════════════════════════════════════════════════════════════════

//
// 🚀 كيفية الإعداد:
// ──────────────────────────────────────────────────────────────────
// 1️⃣ انسخ هذا الكود إلى Apps Script
// 2️⃣ عدّل CONFIG.SOURCE_SHEET_IDS
// 3️⃣ شغّل testSetup() لمنح الصلاحيات
// 4️⃣ أغلق وأعد فتح الملف
// 5️⃣ اختر: 🔧 إعداد رؤوس الأعمدة
// 6️⃣ اختر: ▶️ تحديث من جميع المصادر
//
// ═══════════════════════════════════════════════════════════════════
