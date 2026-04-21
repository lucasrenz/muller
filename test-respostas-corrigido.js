// Teste da função corrigida montarRespostasJsonEstruturado
import { montarRespostasJsonEstruturado } from './src/lib/respostasUtils.js';

// Simular estrutura real do questionário (com estrutura_json)
const respostasBrutas = {
  'pergunta_1': ['Sim'],
  'pergunta_2': 'Teste 123'
};

const estruturaQuestionario = {
  estrutura_json: JSON.stringify({
    campos: [
      {
        id: 'pergunta_1',
        label: 'Você já trabalhou em supermercado?',
        tipo: 'checkbox'
      },
      {
        id: 'pergunta_2',
        label: 'Fale um pouco sobre você',
        tipo: 'textarea'
      }
    ]
  })
};

const resultado = montarRespostasJsonEstruturado(respostasBrutas, estruturaQuestionario);
console.log('Resultado esperado:');
console.log(JSON.stringify([
  {
    "id": "pergunta_1",
    "pergunta": "Você já trabalhou em supermercado?",
    "resposta": ["Sim"]
  },
  {
    "id": "pergunta_2",
    "pergunta": "Fale um pouco sobre você",
    "resposta": "Teste 123"
  }
], null, 2));

console.log('\nResultado obtido:');
console.log(JSON.stringify(resultado, null, 2));

console.log('\nTeste passou:', JSON.stringify(resultado) === JSON.stringify([
  {
    "id": "pergunta_1",
    "pergunta": "Você já trabalhou em supermercado?",
    "resposta": ["Sim"]
  },
  {
    "id": "pergunta_2",
    "pergunta": "Fale um pouco sobre você",
    "resposta": "Teste 123"
  }
]));