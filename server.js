const express = require('express');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'seu_segredo_super_secreto';

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Middleware para verificar o Token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.status(403).json({ auth: false, message: 'Nenhum token fornecido.' }); // Use json
        }
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
                return res.status(500).json({ auth: false, message: 'Falha ao autenticar o token.' }); // Use json
            }
            return res.redirect('/login');
        }
        req.userId = decoded.id;
        next();
    });
};


// Rota para Registro de Usuário
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." }); // Use json
    }
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], function(err) {
        if (err) {
            return res.status(400).json({ message: "Email já cadastrado." }); // Use json
        }
        res.status(201).json({ message: "Usuário registrado com sucesso!" }); // Use json
    });
});

// Rota para Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: "Usuário ou senha inválidos." }); // Use json
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: "Usuário ou senha inválidos." }); // Use json
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 });

        res.cookie('token', token, { httpOnly: true, secure: false });
        res.status(200).json({ auth: true }); // Use json
    });
});

// Rota para Logout
app.post('/api/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0) });
    res.status(200).json({ auth: false, message: 'Logout bem-sucedido.' }); // Use json
});

// --- PÁGINAS PÚBLICAS ---
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'registro.html')));


// --- PÁGINAS E APIS PROTEGIDAS ---

// Rota Principal
app.get('/', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dashboard
app.get('/dashboard', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- ROTAS DA API ---

app.get('/api/services', verifyToken, (req, res) => {
    db.all("SELECT * FROM services", [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar serviços." });
        res.json(rows);
    });
});

app.get('/api/barbers', verifyToken, (req, res) => {
    db.all("SELECT * FROM barbers", [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar barbeiros." });
        res.json(rows);
    });
});

// Para verificar horários já agendados
app.get('/api/booked-slots', verifyToken, (req, res) => {
    const { barber_id, date } = req.query;
    if (!barber_id || !date) { return res.status(400).json({ message: 'Barbeiro e data são obrigatórios.' }); }
    db.all('SELECT schedule_time FROM appointments WHERE barber_id = ? AND schedule_date = ?', [barber_id, date], (err, rows) => {
        if (err) { return res.status(500).json({ message: "Erro ao consultar horários." }); }
        const bookedTimes = rows.map(row => row.schedule_time);
        res.status(200).json(bookedTimes);
    });
});

// ROTA PARA ESTATÍSTICAS
app.get('/api/stats', verifyToken, (req, res) => {
    const stats = {};
    const topServicesQuery = `SELECT s.name, COUNT(a.service_id) as count FROM appointments a JOIN services s ON a.service_id = s.id GROUP BY a.service_id ORDER BY count DESC LIMIT 5`;
    db.all(topServicesQuery, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Erro ao buscar estatísticas de serviços." });
        stats.popularServices = rows;
        const topBarbersQuery = `SELECT b.name, COUNT(a.barber_id) as count FROM appointments a JOIN barbers b ON a.barber_id = b.id GROUP BY a.barber_id ORDER BY count DESC LIMIT 5`;
        db.all(topBarbersQuery, [], (err, rows) => {
            if (err) return res.status(500).json({ message: "Erro ao buscar estatísticas de barbeiros." });
            stats.busiestBarbers = rows;
            res.status(200).json(stats);
        });
    });
});

// ROTA DE AGENDAMENTO CORRIGIDA
app.post('/api/schedule', verifyToken, (req, res) => {
    const { barber_id, service_id, date, time } = req.body;
    const checkSql = `SELECT id FROM appointments WHERE barber_id = ? AND schedule_date = ? AND schedule_time = ?`;
    db.get(checkSql, [barber_id, date, time], (err, row) => {
        if (err) { return res.status(500).json({ message: "Erro ao verificar o banco de dados." }); }
        if (row) { return res.status(409).json({ message: "Este horário já foi agendado. Por favor, escolha outro." }); }
        const insertSql = `INSERT INTO appointments (user_id, barber_id, service_id, schedule_date, schedule_time) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertSql, [req.userId, barber_id, service_id, date, time], function(err) {
            if (err) return res.status(500).json({ message: "Erro ao criar agendamento." });
            res.status(201).json({ message: "Agendamento realizado com sucesso!" });
        });
    });
});

// Rota para buscar os dados do usuário logado
app.get('/api/me', verifyToken, (req, res) => {
    db.get('SELECT name FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err || !user) { return res.status(404).json({ message: "Usuário não encontrado." }); }
        res.status(200).json({ name: user.name });
    });
});

// Rota para buscar os agendamentos do usuário (envia o ID)
app.get('/api/my-appointments', verifyToken, (req, res) => {
     db.all(`SELECT a.id, a.schedule_date, a.schedule_time, s.name as service_name, b.name as barber_name FROM appointments a JOIN services s ON a.service_id = s.id JOIN barbers b ON a.barber_id = b.id WHERE a.user_id = ? ORDER BY a.schedule_date, a.schedule_time DESC`, [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ message: "Erro ao buscar agendamentos." });
            res.status(200).json(rows);
        }
    );
});


// --- ROTA PARA CANCELAR AGENDAMENTO ADICIONADA AQUI ---
app.delete('/api/appointments/:id', verifyToken, (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.userId; // ID do usuário logado

    // Log para depuração
    console.log(`Tentativa de cancelar agendamento ID: ${appointmentId} pelo usuário ID: ${userId}`);

    // Deleta o agendamento SOMENTE SE o ID bater E o user_id for o do usuário logado.
    const sql = `DELETE FROM appointments WHERE id = ? AND user_id = ?`;
    
    db.run(sql, [appointmentId, userId], function(err) {
        if (err) {
            console.error("Erro no DB ao cancelar:", err); // Log do erro
            // Retorna um erro genérico para o usuário
            return res.status(500).json({ message: "Erro interno ao tentar cancelar o agendamento." });
        }
        
        // this.changes > 0 significa que uma linha foi de fato deletada
        if (this.changes > 0) {
            console.log(`Agendamento ID: ${appointmentId} cancelado com sucesso.`); // Log de sucesso
            res.status(200).json({ message: "Agendamento cancelado com sucesso." });
        } else {
            // Se 0 linhas mudaram, significa que o agendamento não foi encontrado ou não pertencia ao usuário
            console.warn(`Falha ao cancelar: Agendamento ID ${appointmentId} não encontrado ou não pertence ao usuário ID ${userId}.`); // Log de aviso
            res.status(403).json({ message: "Agendamento não encontrado ou você não tem permissão para cancelá-lo." });
        }
    });
});
// --- FIM DA ROTA DE CANCELAMENTO ---


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

