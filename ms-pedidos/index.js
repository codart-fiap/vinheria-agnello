const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vinheria-agnello-secret-2024';
const CATALOGO_URL = process.env.CATALOGO_URL || 'http://ms-catalogo:3001';

const USUARIO_VALIDO = { usuario: 'cliente', senha: '123456' };

let pedidos = [];
let proximoId = 1;

app.get('/status', (req, res) => {
  res.json({ servico: 'ms-pedidos', status: 'online', timestamp: new Date().toISOString() });
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario !== USUARIO_VALIDO.usuario || senha !== USUARIO_VALIDO.senha) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
  const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Middleware de autenticação - agora também guarda o header bruto em
// req.authHeader, para que possa ser repassado ao ms-catalogo
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
    req.authHeader = authHeader; // guarda "Bearer <token>" original
    next();
  });
}

app.get('/pedidos', autenticar, (req, res) => {
  res.json(pedidos);
});

app.post('/pedidos', autenticar, async (req, res) => {
  const { vinhoId, quantidade } = req.body;

  if (!vinhoId || !quantidade) {
    return res.status(400).json({ erro: 'Informe vinhoId e quantidade' });
  }

  try {
    // Comunicação autenticada entre microsserviços: o token recebido do
    // cliente é repassado ao ms-catalogo no cabeçalho Authorization
    const resposta = await axios.get(`${CATALOGO_URL}/vinhos/${vinhoId}`, {
      headers: { Authorization: req.authHeader }
    });
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
    if (erro.response && (erro.response.status === 401 || erro.response.status === 403)) {
      return res.status(502).json({ erro: 'Falha na autenticação entre microsserviços' });
    }
    console.error('Erro ao consultar ms-catalogo:', erro.message);
    res.status(502).json({ erro: 'Não foi possível consultar o serviço de catálogo' });
  }
});

app.listen(PORT, () => {
  console.log(`ms-pedidos rodando na porta ${PORT}`);
});