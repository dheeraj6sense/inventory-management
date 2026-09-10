// CSV export utility
// Builds a CSV string from rows/columns, escaping fields properly,
// and triggers a client-side download via Blob + temporary <a> click.

function escapeCsvField(value) {
  const stringValue = value === null || value === undefined ? '' : String(value)

  // Wrap in quotes if the field contains a comma, quote, or newline,
  // and escape any embedded quotes by doubling them.
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

export function exportToCsv(filename, rows, columns) {
  const header = columns.map(col => escapeCsvField(col.label)).join(',')

  const lines = rows.map(row =>
    columns.map(col => escapeCsvField(row[col.key])).join(',')
  )

  const csvContent = [header, ...lines].join('\r\n')

  // Prepend BOM so Excel correctly detects UTF-8 (important for Japanese locale exports)
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
