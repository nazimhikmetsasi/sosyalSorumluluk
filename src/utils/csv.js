// Downloads rows as a CSV the browser hands to the user. The BOM makes Excel read Turkish
// characters correctly; every cell is quoted so commas and quotes in names cannot shift
// columns.
const BOM = String.fromCharCode(0xfeff);

export const downloadCsv = (filename, rows) => {
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const text = rows.map(row => row.map(cell).join(',')).join('\r\n');
  const blob = new Blob([BOM + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
