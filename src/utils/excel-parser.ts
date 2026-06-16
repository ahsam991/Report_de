import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedSheetData {
  [sheetName: string]: any[][];
}

/**
 * Parses an Excel file (XLSX, XLS) and returns data for all sheets.
 */
export function parseExcelFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Could not read file data");
        }
        
        // Read workbook with cellDates: true to parse Date objects automatically
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetsData: ParsedSheetData = {};
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Use header: 1 to get raw array of arrays
          const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
          
          // Clean and format sheet rows: trim text values, filter empty rows
          const cleanedData = rawData
            .map((row) => 
              Array.isArray(row)
                ? row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
                : []
            )
            .filter((row) => row.some((cell) => cell !== undefined && cell !== ""));
            
          sheetsData[sheetName] = cleanedData;
        });
        
        resolve(sheetsData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Parses a CSV file and returns rows as an array of arrays.
 */
export function parseCsvFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const cleanedData = results.data
            .map((row: any) => 
              Array.isArray(row)
                ? row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
                : []
            )
            .filter((row) => row.some((cell) => cell !== undefined && cell !== ""));
          resolve(cleanedData);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      },
      header: false,
      skipEmptyLines: "greedy",
    });
  });
}
