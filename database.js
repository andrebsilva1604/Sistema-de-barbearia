const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./barbearia.db');

db.serialize(() => {
  // Tabela de Usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Tabela de Serviços (COM NOVA COLUNA DE IMAGEM)
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT 
    )
  `);

  // Tabela de Profissionais (COM MAIS NOMES)
  db.run(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  // Tabela de Agendamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      barber_id INTEGER,
      service_id INTEGER,
      schedule_date TEXT NOT NULL,
      schedule_time TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (barber_id) REFERENCES barbers(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  // Inserir dados de exemplo (COM MAIS SERVIÇOS E IMAGENS)

db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
  if (row.count === 0) {
    const stmt = db.prepare("INSERT INTO services (name, price, description, image_url) VALUES (?, ?, ?, ?)");
    
    stmt.run("Corte Clássico", 35.00, "Tesoura e máquina, acabamento com navalha.", "/img/corte-classico.jpeg");
    stmt.run("Barba Terapia", 30.00, "Toalha quente, massagem e design de barba.", "/img/barba-terapia.jpg");
    stmt.run("Corte + Barba", 60.00, "O combo completo para o seu estilo.", "/img/corte-e-barba.jpeg");
    stmt.run("Corte Infantil", 30.00, "Estilo e cuidado para os pequenos.", "/img/infantil.jpeg");
    stmt.run("Platinado Masculino", 150.00, "Descoloração global e matização.", "/img/platinado.jpeg");
    stmt.run("Design de Sobrancelha", 20.00, "Limpeza e alinhamento com navalha.", "/img/sobrancelha.jpg");
    
    stmt.finalize();
  }
});

   db.get("SELECT COUNT(*) as count FROM barbers", (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare("INSERT INTO barbers (name) VALUES (?)");
      stmt.run("Sr. Roberto");
      stmt.run("Lucas");
      stmt.run("Fernando");
      stmt.run("Diego");
      stmt.run("Alexandre");
      stmt.finalize();
    }
  });
});

module.exports = db;