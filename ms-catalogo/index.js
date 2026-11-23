const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'vinheria-agnello-secret-2024';

// "Banco de dados" em memória - apenas para simulação
const vinhos = [
  { id: 1, nome: 'Agnello Cabernet Sauvignon', tipo: 'Tinto', preco: 89.90, estoque: 25 },
  { id: 2, nome: 'Agnello Chardonnay', tipo: 'Branco', preco: 69.90, estoque: 18 },
  { id: 3, nome: 'Agnello Rosé Reserva', tipo: 'Rosé', preco: 59.90, estoque: 30 },
  { id: 4, nome: 'Agnello Malbec Gran Reserva', tipo: 'Tinto', preco: 129.90, estoque: 12 }
];

// Rota de status (pública)
app.get('/status', (req, res) => {
  res.json({ servico: 'ms-catalogo', status: 'online', timestamp: new Date().toISOString() });
});

// Lista todos os vinhos (pública - vitrine da loja, não exige login)
app.get('/vinhos', (req, res) => {
  res.json(vinhos);
});

// Middleware de autenticação - exige o header Authorization: Bearer <token>
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado' });
    }
    req.usuario = decoded.usuario;
    next();
  });
}

// Consulta de um vinho específico - PROTEGIDA, pois é usada internamente
// pelo ms-pedidos antes de confirmar um pedido (comunicação autenticada
// entre microsserviços)
app.get('/vinhos/:id', autenticar, (req, res) => {
  const vinho = vinhos.find(v => v.id === parseInt(req.params.id));
  if (!vinho) {
    return res.status(404).json({ erro: 'Vinho não encontrado' });
  }
  res.json(vinho);
});

app.listen(PORT, () => {
  console.log(`ms-catalogo rodando na porta ${PORT}`);
});