const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg'); // Alterado para 'pg'
const app = express();

// Configuração da conexão com Postgres
const pool = new Pool({
    user: 'andrelucastj9@gmail.com', // Usuário padrão do Postgres
    host: 'localhost',
    database: 'pedraForte',
    password: '@Golprata21', // Altere para a sua senha
    port: 5432,
});

pool.on('connect', () => {
    console.log("PostgreSQL OK");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// CREATE - Salvar Material
app.post('/salvar', async (req, res) => {
    const { nome, descricao, quantidade, preco } = req.body;
    const sql = 'INSERT INTO materiais (nome, descricao, quantidade, preco) VALUES ($1, $2, $3, $4)';
    
    try {
        await pool.query(sql, [nome, descricao, quantidade, preco]);
        res.send('dados salvos com sucesso!');
    } catch (err) {
        console.error('Erro ao inserir dados:', err.message);
        res.status(500).send('Erro ao salvar no banco');
    }
});

// AUTH - Autenticar Usuário
app.post('/autenticar', async (req, res) => {
    const { email, senha } = req.body; 

    if (!email || !senha) {
        return res.send('Email e senha são obrigatórios.');
    }

    const sql = 'SELECT id_usuario FROM usuarios WHERE email = $1 AND senha = $2';
    
    try {
        const results = await pool.query(sql, [email, senha]);
        
        if (results.rows.length > 0) {
            res.redirect('/cadastro'); 
        } else {
            res.send('Acesso negado. Credenciais inválidas.');
        }
    } catch (err) {
        console.error('Erro de autenticação:', err.message);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

app.get("/materiais", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "materiais.html"));
});

// READ - Listar Materiais
app.get('/api/listar', async (req, res) => {
    const sql = 'SELECT * FROM materiais ORDER BY id_material ASC';

    try {
        const results = await pool.query(sql);
        res.json(results.rows);
    } catch (err) {
        console.error('Erro ao listar dados:', err.message);
        res.status(500).json({ error: 'Erro ao listar dados' });
    }
});

// SEARCH - Buscar Material
app.get("/api/buscar", async (req, res) => {
    const { nome } = req.query;
    if (!nome) return res.json({ error: "Material é obrigatório." });

    const sql = "SELECT * FROM materiais WHERE nome ILIKE $1"; // ILIKE no Postgres ignora maiúsculas/minúsculas
    
    try {
        const results = await pool.query(sql, [`%${nome}%`]);
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar no banco." });
    }
});

// UPDATE - Atualizar Material
app.put('/api/atualizar/:id_material', async (req, res) => {
    const { id_material } = req.params;
    const { nome, descricao, quantidade, preco } = req.body;
    const sql = 'UPDATE materiais SET nome = $1, descricao = $2, quantidade = $3, preco = $4 WHERE id_material = $5';
    
    try {
        const result = await pool.query(sql, [nome, descricao, quantidade, preco, id_material]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Material não encontrado' });
        res.json({ message: 'Material atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar o material.' });
    }
});

// DELETE - Excluir Material
app.delete('/api/deletar/:id_material', async (req, res) => {
    const { id_material } = req.params;
    const sql = 'DELETE FROM materiais WHERE id_material = $1';
    
    try {
        const result = await pool.query(sql, [id_material]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Material não encontrado' });
        res.json({ message: 'Material excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir o material.' });
    }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000/"));