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
// ------------------------------

const supabase = createClient(
    process.env.SUPABASE_URL || '', 
    process.env.SUPABASE_ANON_KEY || ''
);

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

// ... (resto das suas rotas como salvar, listar, deletar permanecem iguais)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));