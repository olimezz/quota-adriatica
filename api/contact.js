import { neon } from '@neondatabase/serverless';
import { resolveMx, resolve4 } from 'node:dns/promises';

// Lista dei domini email temporanei / usa-e-getta e placeholder più diffusi
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'trashmail.com',
  'getairmail.com',
  'sharklasers.com',
  'dispostable.com',
  'temp-mail.org',
  'fakeinbox.com',
  'mohmal.com',
  'emailondeck.com',
  'mytemp.email',
  'generator.email',
  'inboxkitten.com',
  'burnermail.io',
  'dropmail.me',
  'crazymailing.com',
  'test.com',
  'example.com',
  'sample.com',
  'fake.com',
  'prova.it',
  'prova.com'
]);

// Rate limiter in-memory per IP (finestra di 10 minuti, max 5 richieste)
const ipTracker = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const record = ipTracker.get(ip) || { count: 0, firstSeen: now };

  if (now - record.firstSeen > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.firstSeen = now;
    ipTracker.set(ip, record);
    return false;
  }

  record.count += 1;
  ipTracker.set(ip, record);

  // Pulizia periodica per evitare memory leak
  if (ipTracker.size > 500) {
    for (const [key, val] of ipTracker.entries()) {
      if (now - val.firstSeen > RATE_LIMIT_WINDOW_MS) {
        ipTracker.delete(key);
      }
    }
  }

  return record.count > MAX_REQUESTS_PER_WINDOW;
}

// Funzione di verifica reale del dominio email (DNS MX / A)
async function verifyEmailDomain(email) {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Formato email non valido.' };
  }

  const domain = parts[1].toLowerCase().trim();

  // 1. Controllo domini usa-e-getta
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: 'Gli indirizzi email temporanei o usa-e-getta non sono accettati. Inserisci una casella email personale o aziendale attiva.'
    };
  }

  // 2. Controllo suffissi non validi
  if (domain.endsWith('.invalid') || domain.endsWith('.test') || domain.endsWith('.example') || domain.endsWith('.localhost')) {
    return { valid: false, message: 'Inserisci un dominio email reale ed esistente.' };
  }

  // 3. Controllo DNS record MX / A con timeout di sicurezza di 2.5s
  try {
    const checkDns = async () => {
      try {
        const mx = await resolveMx(domain);
        if (Array.isArray(mx) && mx.length > 0) return true;
      } catch {
        // Fallback su record A (RFC 5321) se non ha MX espliciti
      }
      try {
        const aRecords = await resolve4(domain);
        return Array.isArray(aRecords) && aRecords.length > 0;
      } catch {
        return false;
      }
    };

    const isDomainActive = await Promise.race([
      checkDns(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500))
    ]);

    if (!isDomainActive) {
      return {
        valid: false,
        message: `Il dominio "@${domain}" non sembra avere un server di posta attivo. Verifica di non aver commesso errori di battitura.`
      };
    }
  } catch (err) {
    if (err.message !== 'DNS_TIMEOUT') {
      console.warn(`Verifica DNS per "${domain}" fallita:`, err.message);
    }
  }

  return { valid: true };
}

// Funzione di validazione avanzata del numero telefonico
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Il numero di cellulare è obbligatorio.' };
  }

  const cleanDigits = phone.replace(/\D/g, '');

  // 1. Lunghezza minima e massima ragionevole
  if (cleanDigits.length < 8 || cleanDigits.length > 15) {
    return { valid: false, message: 'Inserisci un numero di cellulare valido (da 8 a 15 cifre).' };
  }

  // 2. Rileva cifre tutte identiche (es. 0000000000, 1111111111, 3333333333)
  if (/^(\d)\1+$/.test(cleanDigits)) {
    return { valid: false, message: 'Il numero di cellulare inserito non sembra valido. Inserisci un recapito reale.' };
  }

  // 3. Sequenze fittizie palesi
  const fakeSequences = ['12345678', '123456789', '987654321', '0123456789'];
  if (fakeSequences.some((seq) => cleanDigits.includes(seq))) {
    return { valid: false, message: 'Inserisci un numero di cellulare valido per essere ricontattato.' };
  }

  // 4. Se è un numero italiano (inizia con 39 o è locale mobile con 3)
  let localItalian = cleanDigits;
  if (cleanDigits.startsWith('39') && cleanDigits.length >= 11) {
    localItalian = cleanDigits.slice(2);
  }

  if (localItalian.startsWith('3')) {
    if (localItalian.length < 9 || localItalian.length > 11) {
      return { valid: false, message: 'I numeri di cellulare italiani sono composti da 9 o 10 cifre. Verifica il numero inserito.' };
    }
  }

  return { valid: true, cleanDigits };
}

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

  // Estrazione IP per rate limiting
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Troppe richieste inviate da questo dispositivo. Attendi qualche minuto prima di riprovare o contattaci direttamente su WhatsApp.'
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
      _hp, // Honeypot anti-spam invisibile
      _submissionTime // Tempo impiegato a compilare il form in millisecondi
    } = body || {};

    // 1. PROTEZIONE ANTI-BOT SILENZIOSA (Silent Drop)
    // Se il campo honeypot è compilato, oppure il form è stato inviato in meno di 2.2 secondi,
    // restituiamo un finto 200 OK così il bot crede di aver finito e non ritenta.
    const isBotHoneypot = _hp && typeof _hp === 'string' && _hp.trim().length > 0;
    const isBotSpeed = typeof _submissionTime === 'number' && _submissionTime < 2200;

    if (isBotHoneypot || isBotSpeed) {
      console.warn(`[ANTI-BOT] Invio bot intercettato e scartato (hp: ${Boolean(isBotHoneypot)}, speed: ${_submissionTime}ms)`);
      return res.status(200).json({
        success: true,
        message: 'Grazie per averci contattato! La tua richiesta è stata registrata con successo.'
      });
    }

    // 2. VALIDAZIONE CAMPI OBBLIGATORI
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

    // 3. VALIDAZIONE SINTASSI E DOMINIO EMAIL REALE
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Inserisci un indirizzo email con un formato valido (es. nome@dominio.it).'
      });
    }

    const emailCheck = await verifyEmailDomain(cleanEmail);
    if (!emailCheck.valid) {
      return res.status(400).json({
        success: false,
        message: emailCheck.message
      });
    }

    // 4. VALIDAZIONE TELEFONO AVANZATA
    const phoneCheck = validatePhoneNumber(cleanTelefono);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: phoneCheck.message
      });
    }

    // 5. CONNESSIONE A VERCEL POSTGRES / NEON
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('ERRORE: Variabile POSTGRES_URL o DATABASE_URL mancante.');
      return res.status(500).json({
        success: false,
        message: 'Configurazione database non trovata. Verifica di aver collegato il database Vercel al progetto.'
      });
    }

    const sql = neon(databaseUrl);

    // 6. Creazione automatica della tabella se non esiste ancora
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

    // 7. Inserimento sicuro e parametrizzato
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

