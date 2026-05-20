/**
 * Buy A to z - Backend Script for Google Apps Script
 * Connects registration, orders, products, and reviews to a Google Sheet.
 * 
 * Instructions:
 * 1. Open Google Sheets.
 * 2. Go to Extensions -> Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Create sheets: "Registrations", "Orders", "Products", "Reviews".
 * 5. Deploy as a Web App (Access: Anyone).
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type;
    
    if (type === "registration") {
      return handleRegistration(data);
    } else if (type === "order") {
      return handleOrder(data);
    } else if (type === "product") {
      return handleSaveProduct(data);
    } else if (type === "review") {
      return handleSaveReview(data);
    } else if (type === "delete") {
      return handleDeleteRow(data);
    } else if (type === "update") {
      return handleUpdateRow(data);
    }
    
    return createJsonResponse({ "status": "error", "message": "Invalid type: " + type });
      
  } catch (err) {
    return createJsonResponse({ "status": "error", "message": err.toString() });
  }
}

function doGet(e) {
  try {
    var type = e.parameter.type;
    
    if (type === "products") {
      return handleGetProducts();
    } else if (type === "orders") {
      return handleGetOrders();
    } else if (type === "users") {
      return handleGetUsers();
    } else if (type === "reviews") {
      return handleGetReviews(e.parameter.productId);
    }
    
    return ContentService.createTextOutput("<h1>Buy A to z Backend is running</h1>")
      .setMimeType(ContentService.MimeType.HTML);
  } catch (err) {
    return createJsonResponse({ "status": "error", "message": err.toString() });
  }
}

function handleRegistration(data) {
  var sheet = getOrCreateSheet("Registrations", ["Timestamp", "UID", "Full Name", "Mobile", "Email", "Password", "Role", "CreatedAt"]);
  var uid = data.uid || Utilities.getUuid();
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var uidIdx = headers.indexOf("UID");
  
  var rowIdx = -1;
  var existingRow = null;
  if (uidIdx !== -1) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][uidIdx] == uid) {
        rowIdx = i + 1;
        existingRow = values[i];
        break;
      }
    }
  }

  // If updating, preserve existing password and role if not provided
  var passwordColumn = headers.indexOf("Password");
  var roleColumn = headers.indexOf("Role");
  var createdAtColumn = headers.indexOf("CreatedAt");

  var rowData = [
    new Date(),
    uid,
    data.fullName || (existingRow ? existingRow[headers.indexOf("Full Name")] : ""),
    data.mobileNumber || (existingRow ? existingRow[headers.indexOf("Mobile")] : ""),
    data.email || (existingRow ? existingRow[headers.indexOf("Email")] : ""),
    data.password || (existingRow ? existingRow[passwordColumn] : ""),
    data.role || (existingRow ? existingRow[roleColumn] : "user"),
    data.createdAt || (existingRow ? existingRow[createdAtColumn] : new Date())
  ];

  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    return createJsonResponse({ "status": "success", "message": "Profile updated successfully" });
  } else {
    sheet.appendRow(rowData);
    return createJsonResponse({ "status": "success", "message": "Registration successful" });
  }
}

function handleOrder(data) {
  var sheet = getOrCreateSheet("Orders", ["Timestamp", "ID", "Customer UID", "Customer Name", "Customer Mobile", "Items", "Total Amount", "Status", "Address"]);
  var id = data.id || Utilities.getUuid();
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIdx = headers.indexOf("ID");
  
  var rowIdx = -1;
  if (idIdx !== -1) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][idIdx] == id) {
        rowIdx = i + 1;
        break;
      }
    }
  }

  var rowData = [
    new Date(),
    id,
    data.customerUid,
    data.customerName,
    data.customerMobile,
    typeof data.items === 'string' ? data.items : JSON.stringify(data.items),
    data.totalAmount,
    data.status || "pending",
    data.address
  ];

  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    return createJsonResponse({ "status": "success", "message": "Order updated successfully" });
  } else {
    sheet.appendRow(rowData);
    return createJsonResponse({ "status": "success", "message": "Order placed successfully" });
  }
}

function handleSaveProduct(data) {
  var sheet = getOrCreateSheet("Products", ["Timestamp", "ID", "Name", "Price", "OriginalPrice", "Image", "Category", "Rating", "ReviewCount", "Discount"]);
  var id = data.id || Utilities.getUuid();
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIdx = headers.indexOf("ID");
  
  var rowIdx = -1;
  if (idIdx !== -1) {
    for (var i = 1; i < values.length; i++) {
      if (values[i][idIdx] == id) {
        rowIdx = i + 1;
        break;
      }
    }
  }

  var rowData = [
    new Date(),
    id,
    data.name,
    data.price,
    data.originalPrice,
    data.image,
    data.category,
    data.rating || 0,
    data.reviewCount || 0,
    data.discount || 0
  ];

  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    return createJsonResponse({ "status": "success", "message": "Product updated successfully" });
  } else {
    sheet.appendRow(rowData);
    return createJsonResponse({ "status": "success", "message": "Product saved successfully" });
  }
}

function handleUpdateRow(data) {
  var sheetName = data.sheetName;
  var idField = data.idField;
  var idValue = data.idValue;
  var updateData = data.data;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ "status": "error", "message": "Sheet not found" });
  
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var colIdx = headers.indexOf(idField);
  if (colIdx === -1) return createJsonResponse({ "status": "error", "message": "ID field not found" });
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][colIdx] == idValue) {
      for (var key in updateData) {
        var fieldIdx = headers.indexOf(key);
        if (fieldIdx !== -1) {
          sheet.getRange(i + 1, fieldIdx + 1).setValue(updateData[key]);
        }
      }
      return createJsonResponse({ "status": "success", "message": "Row updated successfully" });
    }
  }
  
  return createJsonResponse({ "status": "error", "message": "Row not found" });
}

function handleSaveReview(data) {
  var sheet = getOrCreateSheet("Reviews", ["Timestamp", "ProductID", "UserUID", "UserName", "Rating", "Comment", "Date"]);
  sheet.appendRow([
    new Date(),
    data.productId,
    data.userUid,
    data.userName,
    data.rating,
    data.comment,
    data.date || new Date()
  ]);
  return createJsonResponse({ "status": "success", "message": "Review saved successfully" });
}

function handleDeleteRow(data) {
  var sheetName = data.sheetName; 
  var idField = data.idField; 
  var idValue = data.idValue;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ "status": "error", "message": "Sheet not found" });
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var colIdx = headers.indexOf(idField);
  if (colIdx === -1) return createJsonResponse({ "status": "error", "message": "ID field not found" });
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][colIdx] == idValue) {
      sheet.deleteRow(i + 1);
    }
  }
  return createJsonResponse({ "status": "success", "message": "Row deleted successfully" });
}

function handleGetProducts() {
  var data = getSheetData("Products");
  return createJsonResponse({ "status": "success", "data": data });
}

function handleGetOrders() {
  var data = getSheetData("Orders");
  return createJsonResponse({ "status": "success", "data": data });
}

function handleGetUsers() {
  var data = getSheetData("Registrations");
  return createJsonResponse({ "status": "success", "data": data });
}

function handleGetReviews(productId) {
  var allReviews = getSheetData("Reviews");
  var filtered = allReviews.filter(function(r) { return !productId || r.ProductID == productId; });
  return createJsonResponse({ "status": "success", "data": filtered });
}

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getSheetData(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var results = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    results.push(obj);
  }
  return results;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
