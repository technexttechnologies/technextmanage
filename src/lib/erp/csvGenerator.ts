export function generateCSV(columns: string[], data: any[][]): Blob {
  // Add UTF-8 BOM so Excel opens it correctly
  const BOM = "\uFEFF";
  
  let csvContent = "";
  
  // Headers
  csvContent += columns.map(escapeCSV).join(",") + "\r\n";
  
  // Rows
  data.forEach(row => {
    csvContent += row.map(escapeCSV).join(",") + "\r\n";
  });
  
  return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape it
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
