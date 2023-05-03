// Função que verifica se uma data é um feriado nacional em Portugal
function ehFeriado(data) {
  const feriados = [
    new Date(data.getFullYear(), 0, 1),  // Ano Novo
    new Date(data.getFullYear(), 3, 25), // Dia da Liberdade
    new Date(data.getFullYear(), 4, 1),  // Dia do Trabalhador
    new Date(data.getFullYear(), 5, 10), // Dia de Portugal
    new Date(data.getFullYear(), 7, 15), // Assunção de Nossa Senhora
    new Date(data.getFullYear(), 9, 5),  // Implantação da República
    new Date(data.getFullYear(), 10, 1), // Dia de Todos os Santos
    new Date(data.getFullYear(), 11, 1), // Restauração da Independência
    new Date(data.getFullYear(), 11, 8), // Imaculada Conceição
    new Date(data.getFullYear(), 11, 25) // Natal
  ];
  
  if (data.getDay() === 0 || feriados.some(feriado => feriado.getTime() === data.getTime())) {
    return true;
  } else {
    return false;
  }
}

// Tabela com os dias de abertura de cada mês
const diasAbertura = {
  1: [14, 28, 2, 16, 30],
  2: [11, 25, 13, 27],
  3: [11, 25, 13, 27],
  4: [8, 22, 10, 24],
  5: [13, 27, 15, 29],
  6: [24, 12, 26],
  7: [8, 10],
  8: [],
  9: [],
  10: [],
  11: [],
  12: []
};

function bibliotecaAberta() {
  const dataAtual = new Date();

  // Verifica se a biblioteca encerra aos domingos ou feriados
  if (ehFeriado(dataAtual) || dataAtual.getDay() === 0) {
    return false;
  }

  // Verifica se é a última quarta-feira do mês às 14h
  if (dataAtual.getDay() === 3 && dataAtual.getHours() >= 14) {
    const proximoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 7);
    if (proximoDia.getMonth() !== dataAtual.getMonth()) {
      return false;
    }
  }

  // Verifica se a biblioteca abre no dia atual
  const mesAtual = dataAtual.getMonth() + 1;
  const diaAtual = dataAtual.getDate();
  const diasAberturaMes = diasAbertura[mesAtual];
  if (diasAberturaMes.includes(diaAtual) && dataAtual.getDay() >= 2 && dataAtual.getDay() <= 5) {
    return true;
  } else {
    return false;
  }
}

if (bibliotecaAberta()) {
	document.getElementById('status').innerText = "A bilbioteca está aberta.";
	document.getElementById('status').style.color = "darkgreen";
} else {
	document.getElementById('status').innerText = "A bilbioteca está fechada.";
	document.getElementById('status').style.color = "darkred";
}
