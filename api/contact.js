import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configurazione header di sicurezza e CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Metodo non consentito. Utilizzare POST.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Formato richiesta non valido (JSON non corretto).'
        });
      }
    }

    const {
      nome,
      cognome,
      nome_attivita,
      telefono,
      email,
      messaggio,
      privacy,
      _hp // Honeypot anti-spam invisibile
    } = body || {};

    // 1. Protezione anti-bot (se il campo honeypot è compilato, scartiamo silenziosamente)
    if (_hp && _hp.trim().length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Richiesta ricevuta.'
      });
    }

    // 2. Validazione dei campi obbligatori
    if (!nome || !nome.trim()) {
      return res.status(400).json({ success: false, message: 'Il nome è obbligatorio.' });
    }
    if (!cognome || !cognome.trim()) {
      return res.status(400).json({ success: false, message: 'Il cognome è obbligatorio.' });
    }
    if (!nome_attivita || !nome_attivita.trim()) {
      return res.status(400).json({ success: false, message: "Il nome dell'attività è obbligatorio." });
    }
    if (!telefono || !telefono.trim()) {
      return res.status(400).json({ success: false, message: 'Il numero di cellulare è obbligatorio.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "L'indirizzo email è obbligatorio." });
    }

    const cleanNome = nome.trim().slice(0, 100);
    const cleanCognome = cognome.trim().slice(0, 100);
    const cleanAttivita = nome_attivita.trim().slice(0, 150);
    const cleanTelefono = telefono.trim().slice(0, 50);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanMessaggio = messaggio ? messaggio.trim().slice(0, 1000) : '';

    // Validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Inserisci un indirizzo email valido.'
      });
    }

    // Validazione minima telefono (almeno 6 caratteri numerici/telefonici)
    const phoneCleanDigits = cleanTelefono.replace(/[^0-9+]/g, '');
    if (phoneCleanDigits.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Inserisci un numero di cellulare valido.'
      });
    }

    // 3. Connessione a Vercel Postgres / Neon
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('ERRORE: Variabile POSTGRES_URL o DATABASE_URL mancante.');
      return res.status(500).json({
        success: false,
        message: 'Configurazione database non trovata. Verifica di aver collegato il database Vercel al progetto.'
      });
    }

    const sql = neon(databaseUrl);

    // 4. Creazione automatica della tabella se non esiste ancora
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cognome VARCHAR(100) NOT NULL,
        nome_attivita VARCHAR(150) NOT NULL,
        telefono VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL,
        messaggio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. Inserimento sicuro e parametrizzato (protezione SQL Injection nativa)
    await sql`
      INSERT INTO contacts (nome, cognome, nome_attivita, telefono, email, messaggio)
      VALUES (${cleanNome}, ${cleanCognome}, ${cleanAttivita}, ${cleanTelefono}, ${cleanEmail}, ${cleanMessaggio});
    `;

    return res.status(200).json({
      success: true,
      message: 'Grazie per averci contattato! La tua richiesta è stata registrata con successo. Ti risponderemo a breve.'
    });

  } catch (error) {
    console.error('Errore durante il salvataggio nel database:', error);
    return res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante la registrazione. Riprova più tardi o contattaci direttamente via WhatsApp.'
    });
  }
}
