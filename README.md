# QuizAI

Un'applicazione web moderna per la creazione e la gestione di quiz interattivi, sviluppata con Vue 3 e TypeScript per il frontend e Flask per il backend API.

## 📋 Indice

- [Caratteristiche](#caratteristiche)
- [Tecnologie](#tecnologie)
- [Struttura del Progetto](#struttura-del-progetto)
- [Prerequisiti](#prerequisiti)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Utilizzo](#utilizzo)
- [API Backend](#api-backend)
- [Modello Dati](#modello-dati)
- [Sviluppo](#sviluppo)
- [Build per Produzione](#build-per-produzione)
- [Struttura delle Route](#struttura-delle-route)
- [Possibili Estensioni](#possibili-estensioni)

## ✨ Caratteristiche

- **Creazione Quiz**: Interfaccia intuitiva per creare quiz con domande a scelta multipla
- **Gestione Domande**: Supporto per domande a scelta singola o multipla con validazione
- **Impostazioni Quiz**: Configurazione di difficoltà, tag, pubblicazione e opzioni avanzate (shuffle, tentativi, timer)
- **Interfaccia Utente Moderna**: Design responsive e accessibile
- **State Management**: Gestione dello stato con Pinia
- **Type Safety**: Tipizzazione completa con TypeScript
- **API RESTful**: Backend Flask con CORS abilitato per comunicazione frontend-backend

## 🛠 Tecnologie

### Frontend

- **Vue 3** - Framework JavaScript progressivo
- **TypeScript** - Tipizzazione statica
- **Vite** - Build tool e dev server veloce
- **Vue Router** - Routing per Single Page Application
- **Pinia** - State management per Vue
- **ESLint + Prettier** - Linting e formattazione codice

### Backend

- **Flask** - Framework web Python leggero
- **Flask-CORS** - Gestione CORS per richieste cross-origin
- **JSON** - Persistenza dati (file-based)

## 📁 Struttura del Progetto

```
quizai/
├── src/
│   ├── components/          # Componenti Vue riutilizzabili
│   │   └── QuizForm.vue     # Form per creazione/modifica quiz
│   ├── views/               # Viste principali dell'applicazione
│   │   ├── HomeView.vue     # Homepage con lista quiz
│   │   └── QuizView.vue     # Vista per svolgere un quiz
│   ├── stores/              # Store Pinia per state management
│   │   └── quizStore.ts     # Store per gestione quiz
│   ├── service/             # Servizi per comunicazione API
│   │   └── quizService.ts   # Client API per quiz
│   ├── types/               # Definizioni TypeScript
│   │   └── quiz.ts          # Tipi per quiz, domande, risposte
│   ├── router/              # Configurazione routing
│   │   └── index.ts         # Definizione route
│   ├── data/                # Dati statici
│   │   └── quizzes.json     # Database JSON dei quiz
│   ├── App.vue              # Componente root
│   └── main.ts              # Entry point applicazione
├── public/                  # File statici pubblici
├── app.py                   # Server Flask backend
├── package.json             # Dipendenze e script npm
├── vite.config.ts           # Configurazione Vite
└── tsconfig.json            # Configurazione TypeScript
```

## 📦 Prerequisiti

- **Node.js**: versione `^20.19.0` o `>=22.12.0`
- **Python**: versione 3.8 o superiore
- **npm**: incluso con Node.js

## 🚀 Installazione

### 1. Clona il repository (se applicabile)

```bash
git clone <repository-url>
cd quizai
```

### 2. Installa le dipendenze frontend

```bash
npm install
```

### 3. Installa le dipendenze backend

```bash
pip install flask flask-cors
```

Oppure crea un file `requirements.txt`:

```txt
flask
flask-cors
```

E installa con:

```bash
pip install -r requirements.txt
```

## ⚙️ Configurazione

### Backend API

Il server Flask è configurato per girare sulla porta `5001` (per evitare conflitti con il dev server Vite sulla porta 5173).

L'URL base dell'API è configurato in `src/service/quizService.ts`:

```typescript
const API_BASE_URL = 'http://127.0.0.1:5001/api'
```

Se necessario, modifica questo valore per adattarlo al tuo ambiente.

## 💻 Utilizzo

### Avvio in Modalità Sviluppo

1. **Avvia il backend Flask** (in un terminale):

```bash
python app.py
```

Il server sarà disponibile su `http://127.0.0.1:5001`

2. **Avvia il frontend** (in un altro terminale):

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

### Navigazione

- **Homepage** (`/`): Visualizza tutti i quiz disponibili
- **Crea Quiz** (`/create`): Form per creare un nuovo quiz
- **Svolgi Quiz** (`/quiz/:id`): Interfaccia per svolgere un quiz specifico

## 🔌 API Backend

Il backend Flask espone le seguenti API REST:

### `GET /api/quizzes`

Restituisce la lista di tutti i quiz.

**Risposta**: Array di oggetti `Quiz`

### `POST /api/quizzes`

Crea un nuovo quiz.

**Body** (JSON):

```json
{
  "title": "Titolo Quiz",
  "description": "Descrizione",
  "difficulty": "easy",
  "isPublished": true,
  "questions": [...],
  "tags": ["tag1", "tag2"],
  "settings": {...}
}
```

**Risposta**: Oggetto `Quiz` creato (con `id`, `createdAt`, `updatedAt` generati)

### `PUT /api/quizzes/<quiz_id>`

Aggiorna un quiz esistente.

**Body** (JSON): Oggetto parziale con i campi da aggiornare

**Risposta**: Oggetto `Quiz` aggiornato

### `DELETE /api/quizzes/<quiz_id>`

Elimina un quiz.

**Risposta**: `204 No Content`

## 📊 Modello Dati

Il modello dati è definito in `src/types/quiz.ts`:

### `Quiz`

Aggrega metadati (titolo, autore, tag, difficoltà) e la lista ordinata di domande (`Question`) più opzionali `QuizSettings` (shuffle, tentativi, timer).

```typescript
interface Quiz {
  id: string
  title: string
  description?: string
  questions: Question[]
  tags?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  isPublished: boolean
  createdAt: string
  updatedAt?: string
  authorId?: string
  settings?: QuizSettings
}
```

### `Question`

Cattura il prompt, il tipo (attualmente solo `multiple_choice`), le opzioni obbligatorie (`Choice`) più vincoli come `selectionMode`, `minSelections`/`maxSelections`, peso del punteggio e metadati per domanda.

```typescript
interface Question {
  id: string
  prompt: string
  type: 'multiple_choice'
  choices: Choice[]
  selectionMode?: 'single' | 'multiple'
  minSelections?: number
  maxSelections?: number
  required?: boolean
  points: number
  tags?: string[]
  timeLimitSeconds?: number
  metadata?: Record<string, unknown>
}
```

### `QuizAttempt`

Traccia l'attività dell'utente, mantenendo timestamp, stato, punteggio totale e l'array di `UserAnswer` per ogni domanda.

```typescript
interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  startedAt: string
  completedAt?: string
  answers: UserAnswer[]
  score?: number
  status: 'in_progress' | 'completed' | 'abandoned'
  metadata?: Record<string, unknown>
}
```

### `UserAnswer`

Registra i valori selezionati (`UserAnswerChoice`) per domande a scelta multipla o testo libero, più flag ausiliari (`isSkipped`, `confidence`).

## 🛠 Sviluppo

### Script Disponibili

```bash
# Avvia il dev server con hot-reload
npm run dev

# Type checking
npm run type-check

# Linting e correzione automatica
npm run lint

# Formattazione codice
npm run format

# Build per produzione
npm run build

# Preview della build di produzione
npm run preview
```

### Setup IDE Consigliato

**VS Code** con le seguenti estensioni:

- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Supporto Vue 3
- Disabilita Vetur se installato

### Setup Browser Consigliato

**Browser Chromium** (Chrome, Edge, Brave, ecc.):

- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Attiva Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)

**Firefox**:

- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Attiva Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Supporto TypeScript per `.vue`

TypeScript non può gestire le informazioni di tipo per gli import `.vue` di default, quindi usiamo `vue-tsc` per il type checking. Negli editor, è necessario [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) per rendere il servizio linguistico TypeScript consapevole dei tipi `.vue`.

## 🏗 Build per Produzione

### Compilazione Frontend

```bash
npm run build
```

Questo comando:

1. Esegue il type checking con `vue-tsc`
2. Compila e minifica il codice per la produzione
3. Genera i file ottimizzati nella cartella `dist/`

### Preview Build

```bash
npm run preview
```

Avvia un server locale per testare la build di produzione.

### Deploy

I file nella cartella `dist/` possono essere serviti da qualsiasi server web statico (Nginx, Apache, Vercel, Netlify, ecc.).

**Nota**: Assicurati che il backend Flask sia accessibile dall'URL configurato in `quizService.ts` o aggiorna la configurazione per l'ambiente di produzione.

## 🗺 Struttura delle Route

- `/` - Homepage con lista quiz disponibili
- `/create` - Form per creare un nuovo quiz
- `/quiz/:id` - Vista per svolgere un quiz specifico

## 🔮 Possibili Estensioni

- **Versioning**: Tracciare `quizVersion` per mantenere i tentativi storici allineati con il set di domande mostrato
- **Localizzazione**: Localizzare prompt e scelte sostituendo stringhe con mappe di traduzione chiavate per locale (`Record<string, string>`)
- **Media Rich**: Supportare media ricchi aggiungendo descrittori opzionali `media` (immagini, audio, video) su domande e scelte
- **Analytics**: Persistere artefatti di valutazione (feedback per domanda, risultati rubric) dentro `QuizAttempt.metadata` per dashboard analitiche
- **Autenticazione**: Aggiungere sistema di autenticazione utenti
- **Database**: Migrare da file JSON a database relazionale (PostgreSQL) o NoSQL (MongoDB)
- **Real-time**: Aggiungere supporto WebSocket per quiz collaborativi in tempo reale

## 📝 Licenza

[Specifica la licenza del progetto]

## 👥 Contributori

[Lista dei contributori]
