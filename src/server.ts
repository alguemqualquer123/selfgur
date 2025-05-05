import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fileUpload, { UploadedFile, FileArray } from 'express-fileupload';
import http from 'http';
import dotenv from 'dotenv';
import ws from 'ws';
const WebSocketServer = ws.Server;
type WebSocket = ws.WebSocket;

dotenv.config();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

const app = express();
app.use(fileUpload({
    createParentPath: true,
    debug: true,
    limits: { fileSize: 10 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    safeFileNames: true,
    preserveExtension: true
}));
const staticDir = path.resolve(__dirname, '../static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  console.log('Diretório "static" criado com sucesso.');
}
app.use('/static', express.static(staticDir));

app.post('/upload', async (req: Request, res: Response): Promise<void> => {
  const files = req.files as FileArray | undefined;
  const image = files?.image as UploadedFile | undefined;
  const audio = files?.audio as UploadedFile | undefined;
  const video = files?.video as UploadedFile | undefined;

  if (!req.files || (!req.files.image && !req.files.audio && !req.files.video)) {
    res.status(400).send('Nenhum arquivo enviado.');
    return;
  }

  try {
    if (image) {
      if (!image.mimetype.includes('image')) {
        res.status(400).send({ message: 'A imagem deve ser de um formato válido (webp, jpeg, png).' });
        return;
      }

      const filename = `${uuidv4()}.webp`;
      const filePath = path.resolve(__dirname, '../static/images', filename);
      await image.mv(filePath);
      const url = `${req.protocol}://${req.headers.host}/static/images/${filename}`;
      res.send({ url });
    } else if (audio) {
      if (!audio.mimetype.includes('webm')) {
        res.status(400).send({ message: 'O arquivo de áudio deve ser no formato webm.' });
        return;
      }

      const filename = `${uuidv4()}.webm`;
      const filePath = path.resolve(__dirname, '../static/audio', filename);
      await audio.mv(filePath);
      const url = `${req.protocol}://${req.headers.host}/static/audio/${filename}`;
      res.send({ url });
    } else if (video) {
      if (!['video/webm', 'video/mp4'].includes(video.mimetype)) {
        res.status(400).send({ message: 'O arquivo de vídeo deve ser webm ou mp4.' });
        return;
      }

      const filename = `${uuidv4()}.mp4`;
      const filePath = path.resolve(__dirname, '../static/videos', filename);
      await video.mv(filePath);
      const url = `${req.protocol}://${req.headers.host}/static/videos/${filename}`;
      res.send({ url });
    } else {
      res.status(400).send({ message: 'Campos de imagem, áudio ou vídeo ausentes.' });
    }
  } catch (err) {
    res.status(500).send({ message: (err as Error).message });
  }
});

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`Server listening at http://${host}:${port}`);
});
const RTC = new WebSocketServer({ server });

interface ExtendedWebSocket extends WebSocket {
  id?: number;
}

type RoomMap = Map<string, Set<ExtendedWebSocket>>;
const rooms: RoomMap = new Map();

let lastId = 0;
function generateId(): number {
  return ++lastId;
}

RTC.on('connection', (socket: ExtendedWebSocket, request) => {
  const room = request.url?.substring(1);
  if (!room) return socket.close();

  const clients = rooms.get(room) ?? new Set<ExtendedWebSocket>();
  clients.add(socket);
  rooms.set(room, clients);

  socket.id = generateId();
  console.log(`WebSocket ${socket.id} connected on room: ${room}`);

  socket.on('message', (data) => {
    rooms.get(room)?.forEach(peer => {
      if (peer !== socket) peer.send(data);
    });
  });

  socket.on('close', () => {
    const roomClients = rooms.get(room);
    roomClients?.delete(socket);
    if (roomClients && roomClients.size === 0) {
      rooms.delete(room);
    }

    console.log(`WebSocket ${socket.id} disconnected from room: ${room}`);
  });
});
