function getSheet() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {

    sheet = ss.insertSheet(SHEET_NAME);

    sheet.appendRow([
      "barcode",
      "productName",
      "quantity",
      "lastUpdated",
      "notes"
    ]);

  }

  return sheet;

}