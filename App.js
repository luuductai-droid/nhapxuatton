// Google Apps Script Code
// Deploy this as a Web App

const SHEET_NAME = 'Inventory';
const SHEET_ID = 'https://docs.google.com/spreadsheets/d/1-MSYrLwDPONENoRfm2gvXpv0M7NIlpm8IkdOZclBZPw/edit?gid=0#gid=0'; // Optional, if not using bound script

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Set CORS headers
    return ContentService
      .createTextOutput(JSON.stringify(processRequest(e)))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processRequest(e) {
  const params = e.parameter;
  const action = params.action;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  switch(action) {
    case 'getAll':
      return getAllProducts(sheet);
    case 'getByBarcode':
      return getProductByBarcode(sheet, params.barcode);
    case 'addProduct':
      return addProduct(sheet, params);
    case 'updateQuantity':
      return updateQuantity(sheet, params);
    case 'deleteProduct':
      return deleteProduct(sheet, params.barcode);
    case 'search':
      return searchProducts(sheet, params.query);
    default:
      return { success: false, error: 'Invalid action' };
  }
}

function getAllProducts(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const product = {};
    headers.forEach((header, index) => {
      product[header] = row[index];
    });
    products.push(product);
  }
  
  return { success: true, data: products };
}

function getProductByBarcode(sheet, barcode) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === barcode) {
      return {
        success: true,
        data: {
          barcode: data[i][0],
          productName: data[i][1],
          quantity: data[i][2],
          lastUpdated: data[i][3],
          notes: data[i][4]
        }
      };
    }
  }
  
  return { success: false, error: 'Product not found' };
}

function addProduct(sheet, params) {
  const lastRow = sheet.getLastRow() + 1;
  const timestamp = new Date().toISOString();
  
  sheet.getRange(lastRow, 1, 1, 5).setValues([[
    params.barcode,
    params.productName,
    parseInt(params.quantity) || 0,
    timestamp,
    params.notes || ''
  ]]);
  
  return { success: true, message: 'Product added successfully' };
}

function updateQuantity(sheet, params) {
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date().toISOString();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.barcode) {
      const newQuantity = parseInt(data[i][2]) + parseInt(params.change);
      sheet.getRange(i + 1, 3, 1, 2).setValues([[newQuantity, timestamp]]);
      
      return {
        success: true,
        data: {
          barcode: data[i][0],
          productName: data[i][1],
          quantity: newQuantity,
          lastUpdated: timestamp
        }
      };
    }
  }
  
  return { success: false, error: 'Product not found' };
}

function deleteProduct(sheet, barcode) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === barcode) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Product deleted' };
    }
  }
  
  return { success: false, error: 'Product not found' };
}

function searchProducts(sheet, query) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  const searchQuery = query.toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0].toLowerCase().includes(searchQuery) || 
        row[1].toLowerCase().includes(searchQuery)) {
      const product = {};
      headers.forEach((header, index) => {
        product[header] = row[index];
      });
      results.push(product);
    }
  }
  
  return { success: true, data: results };
}
