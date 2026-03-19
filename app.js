const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 1. CONFIGURAÇÃO DO BANCO
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- CONFIRMAÇÃO DE CONEXÃO ---
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ ERRO AO CONECTAR NO POSTGRES:', err.stack);
    }
    console.log('✅ CONECTADO AO POSTGRES (SUPABASE) COM SUCESSO!');
    release();
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ROTAS DE PÁGINAS
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/cadastro", (req, res) => res.sendFile(path.join(__dirname, "public", "cadastro.html")));
app.get("/materiais", (req, res) => res.sendFile(path.join(__dirname, "public", "materiais.html")));

// AUTENTICAR (Com log de erro detalhado)
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
        console.error('❌ ERRO NA CONSULTA DE LOGIN:', err.message);
        // Enviamos o erro real para o navegador para ajudar no debug (remova isso depois)
        res.status(500).send(`Erro interno: ${err.message}`);
    }
});

app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

app.get("/materiais", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "materiais.html"));
});

app.get('/api/listar', (req, res) => {

    const sql = 'SELECT * FROM materiais';

    connection.query(sql, [], (err, results) => {
        if (err) {
            console.error('Erro ao listar dados:', err.message);
            return res.status(500).json({ error: 'Erro ao listar dados' });
        }
        res.json(results);
    });
});

app.get("/api/buscar", (req, res) => {
    const { nome } = req.query;
    if (!nome) return res.json({ error: "Material é obrigatório." });
    const sql = "SELECT * FROM materiais WHERE nome LIKE ?";
    connection.query(sql, [`%${nome}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar no banco." });
        res.json(results);
    });
});

app.put('/api/atualizar/:id_material', (req, res) => {
    const { id_material } = req.params;
    const { nome, descricao, quantidade, preco } = req.body;
    const sql = 'UPDATE materiais SET nome = ?, descricao = ?, quantidade = ?, preco = ? WHERE id_material = ?';
    connection.query(sql, [nome, descricao, quantidade, preco, id_material], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar o material.' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Material não encontrado' });
        res.json({ message: 'Material atualizado com sucesso!' });
    });
});


app.delete('/api/deletar/:id_material', (req, res) => {
    const { id_material } = req.params;
    const sql = 'DELETE FROM materiais WHERE id_material = ?';
    connection.query(sql, [id_material], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao excluir o material.' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Material não encontrado' });
        res.json({ message: 'Material excluído com sucesso!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));