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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
