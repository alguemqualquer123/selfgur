# Selfgur Server

Servidor Node.js com Express, Upload de Arquivos e WebSocket.

Este servidor permite o **upload de imagens e áudios**, armazenando-os em uma pasta estática, e também oferece suporte a **salas de WebSocket** para comunicação em tempo real entre clientes (ex: chamadas de vídeo/áudio, streaming, etc).

---

## 📦 Funcionalidades

- Upload de arquivos (`.jpg`, `.png`, `.webm`, `.ogg`, `.mp3`)
- Servir arquivos públicos da pasta `/static`
- WebSocket com múltiplas salas (clientes se comunicam apenas com quem estiver na mesma sala)
- Geração de URLs públicas para os arquivos enviados

---

## 🚀 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/alguemqualquer123/selfgur.git
cd selfgur
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as variáveis de ambiente necessárias:

```
PORT=8080
HOST=localhost
```

---

## 💻 Scripts

### Rodar em modo desenvolvimento (com auto-reload)

Para rodar o servidor em modo desenvolvimento com auto-reload, utilize o seguinte comando:

```bash
npm run dev
```

Isso utiliza o `nodemon` para reiniciar o servidor automaticamente sempre que você modificar os arquivos do projeto.

### Rodar em produção com PM2

Para rodar o servidor em produção com PM2, utilize:

```bash
npm run start:pm2
```

Isso garante que o servidor ficará ativo, mesmo em caso de falhas.

---

## ⚙️ Scripts no `package.json`

No arquivo `package.json`, você encontrará os seguintes scripts:

```json
"scripts": {
  "dev": "nodemon src/server.ts",
  "start": "ts-node src/server.ts",
  "start:pm2": "pm2 start src/server.ts --interpreter ts-node --name selfgur"
}
```

- `dev`: Executa o servidor em modo de desenvolvimento com `nodemon`.
- `start`: Executa o servidor normalmente com `ts-node`.
- `start:pm2`: Inicia o servidor em produção com `pm2` e `ts-node`.

---

## 📁 Estrutura de Pastas

A estrutura do projeto é a seguinte:

```
.
├── src
│   └── server.ts
├── static
│   └── (arquivos enviados são armazenados aqui)
├── .env
├── package.json
└── tsconfig.json
```

---

## 📤 Upload de Arquivos

A rota de upload é `POST /upload` e aceita os seguintes campos de arquivos:

- `image` (formatos: `.jpg`, `.png`)
- `audio` (formatos: `.webm`, `.ogg`, `.mp3`)

### Exemplo de uso:

Você pode enviar arquivos via `curl`:

#### Enviar uma imagem:

```bash
curl -F "image=@foto.jpg" http://localhost:8080/upload
```

#### Enviar um áudio:

```bash
curl -F "audio=@audio.webm" http://localhost:8080/upload
```

**Resposta**: A resposta será uma URL pública do arquivo enviado, acessível via o caminho `/static/{filename}`.

---

## 🔗 WebSocket

Conexões WebSocket devem ser feitas na seguinte URL:

```
ws://localhost:8080/{roomName}
```

Onde `{roomName}` é o nome da sala à qual o cliente deseja se conectar. Todos os clientes dentro da mesma sala podem se comunicar entre si.

---

## 🛠 Requisitos

- Node.js >= 18
- TypeScript
- `ts-node`
- `express`
- `express-fileupload`
- `ws`
- `dotenv`
- `nodemon` (para desenvolvimento)
- `pm2` (para produção)

---

## ✅ Tarefas Pendentes (To Do)

- Implementação de autenticação de usuários
- Limitar o tamanho dos uploads
- Melhorar a validação de tipos de arquivos enviados

---

## 📃 Licença

MIT