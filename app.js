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
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "cadastro.html")));

// Salvar Cliente
app.post('/salvar', async (req, res) => {
    const { nome, celular, email } = req.body;
    const sql = 'INSERT INTO clientes (nome, celular, email) VALUES ($1, $2, $3)';
    try {
        await pool.query(sql, [nome, celular, email]);
        res.send('Dados salvos com sucesso!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar no banco');
    }
});

// Listar Clientes
app.get('/api/listar', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM clientes ORDER BY id_cliente ASC');
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar dados' });
    }
});

// Buscar Cliente
app.get("/api/buscar", async (req, res) => {
    const { nome } = req.query;
    try {
        const results = await pool.query("SELECT * FROM clientes WHERE nome ILIKE $1", [`%${nome}%`]);
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar no banco." });
    }
});

// Deletar
app.delete('/api/deletar/:id_cliente', async (req, res) => {
    const { id_cliente } = req.params;
    try {
        await pool.query('DELETE FROM clientes WHERE id_cliente = $1', [id_cliente]);
        res.json({ message: 'Cliente excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir.' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
