/**
 * Utilidade para gerar e exibir contrato em PDF
 */

export const generateAndOpenContract = async (requestData) => {
  // Abrir a janela ANTES do await para preservar o contexto de gesto do usuário
  // (navegadores bloqueiam window.open chamado após uma operação assíncrona)
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    throw new Error('Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.');
  }

  try {
    // Buscar o template HTML
    const response = await fetch('/contrato.html');
    if (!response.ok) {
      newWindow.close();
      throw new Error('Não foi possível carregar o template do contrato');
    }

    let htmlContent = await response.text();

    // Preparar data
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthIndex = today.getMonth();
    const year = today.getFullYear();

    const months = [
      'janeiro',
      'fevereiro',
      'março',
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
    const month = months[monthIndex];

    // Mapa de placeholders
    const placeholders = {
      '{{nome_completo}}': requestData.nome_completo || '',
      '{{cidade}}': requestData.cidade || '',
      '{{rua}}': requestData.rua || '',
      '{{numero}}': requestData.numero || '',
      '{{bairro}}': requestData.bairro || '',
      '{{cpf}}': requestData.cpf || '',
      '{{dia}}': day,
      '{{mes}}': month,
      '{{ano}}': year,
    };

    // Substituir placeholders
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      htmlContent = htmlContent.replace(regex, value);
    });

    // Escrever o HTML na janela já aberta
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // Disparar impressão automática após o conteúdo carregar
    setTimeout(() => {
      newWindow.print();
    }, 500);

    return true;
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    throw error;
  }
};
