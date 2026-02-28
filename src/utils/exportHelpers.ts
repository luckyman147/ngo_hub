/**
 * Utility functions for exporting data to CSV and triggering PDF prints.
 */

/**
 * Escapes a string to be safely included in a CSV file.
 * Handles quotes, commas, and newlines.
 */
function escapeCSV(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If the field contains a comma, a quote, or a newline, it must be quoted.
  // Quotes inside the field must be doubled.
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports an array of objects to a CSV file and triggers a download.
 *
 * @param data Array of objects to export.
 * @param filename Name of the file to download (without extension).
 * @param headers Optional custom headers mapping object keys to column names.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[],
) {
  if (!data || !data.length) {
    console.warn("No data to export");
    return;
  }

  // Determine columns: use provided headers or extract keys from the first object
  const cols =
    headers || Object.keys(data[0]).map((k) => ({ key: k, label: k }));

  // Create the header row
  const headerRow = cols.map((col) => escapeCSV(col.label)).join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    cols.map((col) => escapeCSV(row[col.key as keyof T])).join(","),
  );

  // Combine into CSV string
  const csvString = [headerRow, ...dataRows].join("\n");

  // Add BOM to fix UTF-8 character encoding in Excel
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });

  // Create a link and trigger download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Triggers the browser's print dialog to save the current page (or a specific section) as a PDF.
 * To print a specific section, use CSS `@media print` rules to hide other elements.
 */
export function exportToPDF() {
  window.print();
}
