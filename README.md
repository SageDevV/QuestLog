# Quest Log

Gerenciador de tarefas com tema de RPG. Cada tarefa é uma *quest* que dá XP ao ser concluída, fazendo o herói subir de nível. Os dados ficam sincronizados no Firebase, e há notificações diárias por Telegram.

## Funcionalidades

- Quests com dificuldade, etiqueta, agente responsável e data agendada
- Recorrência diária e semanal
- Calendário de quests e painel de estatísticas
- Herói com XP, nível e título
- Login com Firebase Authentication e sincronização com Firestore
- Música de fundo e efeitos sonoros nos botões
- Notificações diárias de quests pendentes via Telegram

## Tecnologias

React 18, TypeScript, Vite, Zustand, Firebase (Auth, Firestore, Hosting), Recharts, Vitest e fast-check.

## Requisitos

- Node.js 20 ou superior
- Um projeto Firebase com Authentication e Firestore habilitados

## Configuração

```bash
npm install
cp .env.example .env
```

Preencha o `.env`:

| Variável | Uso |
| --- | --- |
| `VITE_FIREBASE_*` | Configuração do app web (Firebase Console → Configurações do projeto → Seus apps) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço, usado só pelo script de notificações. Nunca use o prefixo `VITE_` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Bot e chat que recebem as notificações |

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm test` | Executa os testes |
| `npm run deploy` | Build e deploy no Firebase Hosting |
| `npm run build:exe` | Gera `dist/QuestLog.exe` (Windows), que serve o app localmente e abre o navegador |

## Estrutura

```
src/
  components/      Componentes React
  store.ts         Estado global (Zustand)
  firestoreSync.ts Sincronização com o Firestore
  recurrenceUtils.ts, calendarUtils.ts
  test/            Testes unitários e de propriedade
scripts/
  telegram_notifications.mjs   Notificações diárias
launcher.ts        Launcher do executável
```

## CI/CD

Workflows em `.github/workflows/`:

- `deploy.yml`: build e deploy no Firebase Hosting a cada push na `main`
- `daily_notification.yml`: envia notificações do Telegram às 08:00 e 20:00 (BRT)

Os secrets necessários são os mesmos do `.env`, cadastrados no repositório.
