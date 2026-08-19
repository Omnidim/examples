// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('OmniDimension')
    .addItem('Validate selected rows', 'validateSelectedRows')
    .addToUi();
}

function validateSelectedRows() {
  const range = SpreadsheetApp.getActiveRange();
  const sheet = range.getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const phoneColumn = headers.indexOf('phone_number');
  if (phoneColumn === -1) throw new Error('Add a phone_number column before validating rows.');

  const rows = range.getValues();
  const invalidRows = rows
    .map((row, index) => ({ row: range.getRow() + index, phone: String(row[phoneColumn] || '') }))
    .filter(({ phone }) => !/^\+[1-9]\d{7,14}$/.test(phone));

  const message = invalidRows.length
    ? `Fix E.164 phone numbers in rows: ${invalidRows.map(({ row }) => row).join(', ')}`
    : `${rows.length} selected row(s) are ready for your server-side campaign workflow.`;
  SpreadsheetApp.getUi().alert(message);
}
