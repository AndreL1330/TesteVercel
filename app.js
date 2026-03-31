const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// Configuração do Banco de Dados (Supabase/PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --- ROTAS ---

// 1. Página Principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// 2. Salvar Dados (Chamada pelo Formulário)
app.post('/api/salvar', async (req, res) => {
    const { nome, celular, email } = req.body;
    const sql = 'INSERT INTO clientes (nome, celular, email) VALUES ($1, $2, $3)';
    
    try {
        await pool.query(sql, [nome, celular, email]);
        // Redireciona para a home para atualizar a lista automaticamente
        res.redirect('/'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar no banco de dados.');
    }
});

// 3. API para Listar (Chamada pelo Script na tabela)
app.get('/api/listar', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM clientes ORDER BY id_cliente DESC');
        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar dados' });
    }
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});