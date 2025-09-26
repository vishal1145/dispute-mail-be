import  XLSX from "xlsx";


export function parseExcel(buffer, allSheets = false) {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  // pick sheet names
  const sheetNames = workbook.SheetNames;

  // helper to extract info from one sheet
  const getSheetData = (sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // keep empty cells
    const headers = Object.keys(jsonData[0] || {}); // first row keys
    return {
      sheetName,
      headers,
      data: jsonData
    };
  };

  if (allSheets) {
    return sheetNames.map(getSheetData);
  } else {
    return getSheetData(sheetNames[0]);
  }
}
