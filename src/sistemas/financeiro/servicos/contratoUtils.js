/**
 * Utilidade para gerar e exibir contrato em uma nova aba.
 */

// eslint-disable-next-line import/no-unresolved
import fallbackContractTemplate from '../../../../public/contrato.html?raw';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const writeWindowContent = (targetWindow, html) => {
  targetWindow.document.open();
  targetWindow.document.write(html);
  targetWindow.document.close();
};

const writeLoadingState = (targetWindow) => {
  writeWindowContent(targetWindow, `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Gerando contrato</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; color: #1f2937; background: #f8fafc; }
    div { text-align: center; }
    p { margin: 8px 0 0; color: #64748b; }
  </style>
</head>
<body>
  <div>
    <strong>Gerando contrato...</strong>
    <p>Aguarde enquanto o documento e preparado.</p>
  </div>
</body>
</html>`);
};

const writeErrorState = (targetWindow, message) => {
  writeWindowContent(targetWindow, `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Erro ao gerar contrato</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; color: #7f1d1d; background: #fef2f2; padding: 24px; }
    div { max-width: 520px; text-align: center; background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; }
    p { margin: 8px 0 0; color: #991b1b; }
  </style>
</head>
<body>
  <div>
    <strong>Nao foi possivel gerar o contrato</strong>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`);
};

const getContractTemplateUrl = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}contrato.html`;
};

const isValidContractTemplate = (htmlContent) =>
  typeof htmlContent === 'string'
  && htmlContent.includes('{{nome_completo}}')
  && htmlContent.includes('{{cpf}}');

const loadContractTemplate = async () => {
  try {
    const response = await fetch(getContractTemplateUrl(), { cache: 'no-store' });
    if (response.ok) {
      const htmlContent = await response.text();
      if (isValidContractTemplate(htmlContent)) {
        return htmlContent;
      }
    }
  } catch (error) {
    console.warn('Falha ao buscar contrato.html; usando template embutido.', error);
  }

  if (isValidContractTemplate(fallbackContractTemplate)) {
    return fallbackContractTemplate;
  }

  throw new Error('Template do contrato invalido ou nao encontrado. Verifique se o arquivo contrato.html esta disponivel na pasta public.');
};

const openHtmlAsIsolatedDocument = (targetWindow, htmlContent) => {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  targetWindow.location.replace(blobUrl);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
};

const addPrintControls = (htmlContent) => {
  const controls = `
    <style>
      .print-controls {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9999;
        display: flex;
        gap: 8px;
        font-family: Arial, sans-serif;
      }
      .print-controls button {
        border: 0;
        border-radius: 8px;
        padding: 10px 14px;
        color: #fff;
        background: #2563eb;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
      }
      @media print {
        .print-controls { display: none !important; }
      }
    </style>
    <div class="print-controls">
      <button type="button" onclick="window.print()">Imprimir contrato</button>
    </div>
  `;

  const printScript = `
    <script>
      window.addEventListener('load', function () {
        window.focus();
        setTimeout(function () { window.print(); }, 600);
      });
    </script>
  `;

  const withControls = htmlContent.replace(/<body[^>]*>/i, (match) => `${match}${controls}`);
  return withControls.includes('</body>')
    ? withControls.replace('</body>', `${printScript}</body>`)
    : `${withControls}${printScript}`;
};

export const generateAndOpenContract = async (requestData) => {
  const newWindow = window.open('about:blank', '_blank');
  if (!newWindow) {
    throw new Error('Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.');
  }

  writeLoadingState(newWindow);

  try {
    let htmlContent = await loadContractTemplate();

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthIndex = today.getMonth();
    const year = today.getFullYear();

    const months = [
      'janeiro',
      'fevereiro',
      'marco',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];

    const placeholders = {
      '{{nome_completo}}': requestData.nome_completo,
      '{{cidade}}': requestData.cidade,
      '{{rua}}': requestData.rua,
      '{{numero}}': requestData.numero,
      '{{bairro}}': requestData.bairro,
      '{{cpf}}': requestData.cpf,
      '{{dia}}': day,
      '{{mes}}': months[monthIndex],
      '{{ano}}': year,
    };

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      htmlContent = htmlContent.replace(regex, escapeHtml(value));
    });

    openHtmlAsIsolatedDocument(newWindow, addPrintControls(htmlContent));
    newWindow.focus();

    return true;
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    writeErrorState(newWindow, error.message || 'Erro desconhecido.');
    throw error;
  }
};
