/**
 * Utilidade para gerar e exibir contrato em PDF
 */

export const generateAndOpenContract = async (requestData) => {
  try {
    // Buscar o template HTML
    const response = await fetch('/contrato.html');
    if (!response.ok) {
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

    // Criar blob do HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Abrir em nova aba
    const window = open(url, '_blank');
    if (window) {
      // Aguardar um pouco e disparar impressão automática
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // Limpar URL temporária após um tempo
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30000);

    return true;
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    throw error;
  }
};
