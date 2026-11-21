const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// "Banco de dados" em memória - apenas para simulação
const vinhos = [
  { id: 1, nome: 'Agnello Cabernet Sauvignon', tipo: 'Tinto', preco: 89.90, estoque: 25 },
  { id: 2, nome: 'Agnello Chardonnay', tipo: 'Branco', preco: 69.90, estoque: 18 },
  { id: 3, nome: 'Agnello Rosé Reserva', tipo: 'Rosé', preco: 59.90, estoque: 30 },
  { id: 4, nome: 'Agnello Malbec Gran Reserva', tipo: 'Tinto', preco: 129.90, estoque: 12 }
];

// Rota de status (usada para comprovar a comunicação via DNS do Docker)
app.get('/status', (req, res) => {
  res.json({ servico: 'ms-catalogo', status: 'online', timestamp: new Date().toISOString() });
});

// Lista todos os vinhos
app.get('/vinhos', (req, res) => {
  res.json(vinhos);
});

// Consulta um vinho específico (usado pelo ms-pedidos antes de confirmar um pedido)
app.get('/vinhos/:id', (req, res) => {
  const vinho = vinhos.find(v => v.id === parseInt(req.params.id));
  if (!vinho) {
    return res.status(404).json({ erro: 'Vinho não encontrado' });
  }
  res.json(vinho);
});

app.listen(PORT, () => {
  console.log(`ms-catalogo rodando na porta ${PORT}`);
});
