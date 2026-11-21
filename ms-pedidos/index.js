const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Em um cenário real, isso ficaria em variável de ambiente / cofre de segredos
const JWT_SECRET = 'vinheria-agnello-secret-2024';

// Nome do serviço de catálogo resolvido automaticamente pelo DNS interno do Docker
const CATALOGO_URL = process.env.CATALOGO_URL || 'http://ms-catalogo:3001';

// "Usuário" fixo apenas para simulação de autenticação
const USUARIO_VALIDO = { usuario: 'cliente', senha: '123456' };

// "Banco de dados" de pedidos em memória
let pedidos = [];
let proximoId = 1;

// Rota de status
app.get('/status', (req, res) => {
  res.json({ servico: 'ms-pedidos', status: 'online', timestamp: new Date().toISOString() });
});

// Rota de login - gera o token JWT
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario !== USUARIO_VALIDO.usuario || senha !== USUARIO_VALIDO.senha) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
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

// Lista os pedidos do "usuário" autenticado
app.get('/pedidos', autenticar, (req, res) => {
  res.json(pedidos);
});

// Cria um novo pedido - consulta o ms-catalogo via REST antes de confirmar
app.post('/pedidos', autenticar, async (req, res) => {
  const { vinhoId, quantidade } = req.body;

  if (!vinhoId || !quantidade) {
    return res.status(400).json({ erro: 'Informe vinhoId e quantidade' });
  }

  try {
    // Comunicação entre microsserviços via REST, usando o nome do serviço no Docker
    const resposta = await axios.get(`${CATALOGO_URL}/vinhos/${vinhoId}`);
    const vinho = resposta.data;

    if (vinho.estoque < quantidade) {
      return res.status(409).json({ erro: 'Estoque insuficiente' });
    }

    const pedido = {
      id: proximoId++,
      usuario: req.usuario,
      vinho: vinho.nome,
      quantidade,
      valorTotal: vinho.preco * quantidade,
      status: 'confirmado',
      criadoEm: new Date().toISOString()
    };

    pedidos.push(pedido);
    res.status(201).json(pedido);

  } catch (erro) {
    if (erro.response && erro.response.status === 404) {
      return res.status(404).json({ erro: 'Vinho não encontrado no catálogo' });
    }
    console.error('Erro ao consultar ms-catalogo:', erro.message);
    res.status(502).json({ erro: 'Não foi possível consultar o serviço de catálogo' });
  }
});

app.listen(PORT, () => {
  console.log(`ms-pedidos rodando na porta ${PORT}`);
});
