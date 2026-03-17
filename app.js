const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 1. CONFIGURAÇÃO DO BANCO (SUPABASE)
// Na Vercel, você deve configurar a variável DATABASE_URL nas configurações do projeto
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Obrigatório para conectar ao Supabase fora do localhost
    }
});

// 2. CLIENTE SUPABASE (Para recursos extras se precisar)
const supabase = createClient(
    process.env.SUPABASE_URL || '', 
    process.env.SUPABASE_ANON_KEY || ''
);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 3. ROTAS DE PÁGINAS
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

app.get("/materiais", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "materiais.html"));
});

// 4. LÓGICA DE NEGÓCIO (API)

// Salvar Material
app.post('/salvar', async (req, res) => {
    const { nome, descricao, quantidade, preco } = req.body;
    const sql = 'INSERT INTO materiais (nome, descricao, quantidade, preco) VALUES ($1, $2, $3, $4)';
    try {
        await pool.query(sql, [nome, descricao, quantidade, preco]);
        res.send('Dados salvos com sucesso!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar no banco');
    }
});

// Autenticar
app.post('/autenticar', async (req, res) => {
    const { email, senha } = req.body; 
    const sql = 'SELECT id_usuario FROM usuarios WHERE email = $1 AND senha = $2';
    try {
        const results = await pool.query(sql, [email, senha]);
        if (results.rows.length > 0) {
            res.redirect('/cadastro'); 
        } else {
            res.send('Acesso negado. Credenciais inválidas.');
        }
    } catch (err) {
        res.status(500).send('Erro interno do servidor.');
    }
});

// Listar Materiais
app.get('/api/listar', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM materiais ORDER BY id_material ASC');
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar dados' });
    }
});

// Buscar Material
app.get("/api/buscar", async (req, res) => {
    const { nome } = req.query;
    try {
        const results = await pool.query("SELECT * FROM materiais WHERE nome ILIKE $1", [`%${nome}%`]);
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar no banco." });
    }
});

// Deletar
app.delete('/api/deletar/:id_material', async (req, res) => {
    const { id_material } = req.params;
    try {
        await pool.query('DELETE FROM materiais WHERE id_material = $1', [id_material]);
        res.json({ message: 'Material excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir.' });
    }
});

// 5. INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});