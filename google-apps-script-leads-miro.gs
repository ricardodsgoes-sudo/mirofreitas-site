/**
 * ============================================================
 * LEADS MIRO FREITAS — Google Apps Script Web App
 * ============================================================
 *
 * Recebe POST do formulário em cotacao.html e grava cada lead
 * em uma aba "Leads" da planilha vinculada.
 *
 * Como usar:
 *   1. Abra a planilha do Google Sheets onde os leads serão gravados.
 *   2. Menu: Extensões → Apps Script.
 *   3. Apague qualquer código existente e cole TODO este arquivo.
 *   4. Salve (ícone de disquete) e dê um nome ao projeto.
 *   5. Clique em "Implantar" → "Nova implantação".
 *   6. Tipo: "App da Web".
 *   7. Executar como: "Eu" (sua conta).
 *   8. Quem tem acesso: "Qualquer pessoa".
 *   9. Clique em "Implantar", autorize o acesso quando pedir.
 *  10. Copie a "URL do app da Web" e cole em APPS_SCRIPT_URL
 *      dentro de js/cotacao.js.
 *
 * Observação: o front envia como text/plain (sem preflight CORS),
 * com o JSON serializado no corpo. Por isso lemos via
 * e.postData.contents e fazemos JSON.parse manualmente.
 * ============================================================
 */

const SHEET_NAME = "Leads";

const HEADERS = [
  "Data",
  "Nome",
  "WhatsApp",
  "CNPJ",
  "Cotação",
  "Origem",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "UTM Content",
  "UTM Term",
  "Página",
  "User Agent"
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Requisição sem corpo.");
    }

    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Cria cabeçalho se a aba estiver vazia.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight("bold")
        .setBackground("#0B1F3A")
        .setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }

    const row = [
      data.data         || new Date().toISOString(),
      data.nome         || "",
      data.whatsapp     || "",
      data.cnpj         || "",
      data.cotacao      || "",
      data.origem       || "",
      data.utm_source   || "",
      data.utm_medium   || "",
      data.utm_campaign || "",
      data.utm_content  || "",
      data.utm_term     || "",
      data.pagina       || "",
      data.userAgent    || ""
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: String(err && err.message ? err.message : err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET opcional — só para validar no navegador que o Web App está no ar.
 * Acessar a URL deve mostrar { "status": "ok" }.
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", sheet: SHEET_NAME }))
    .setMimeType(ContentService.MimeType.JSON);
}
