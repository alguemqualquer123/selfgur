import path from 'path';
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
app.use(fileUpload());
app.use('/static', express.static(path.resolve(__dirname, '../static')));

app.post('/upload', async (req: Request, res: Response): Promise<void> => {
  const files = req.files as FileArray | undefined;
  const image = files?.image as UploadedFile | undefined;
  const audio = files?.audio as UploadedFile | undefined;

  try {
    if (image) {
      const filename = `${uuidv4()}.jpg`;
      const filePath = path.resolve(__dirname, '../static', filename);
      await image.mv(filePath);
      const url = `${req.protocol}://${req.headers.host}/static/${filename}`;
      res.send({ url });
    } else if (audio) {
      if (!audio.mimetype.includes('webm')) {
        res.status(400).send({ message: 'Audio mimetype must be webm' });
        return;
      }

      const filename = `${uuidv4()}.webm`;
      const filePath = path.resolve(__dirname, '../static', filename);
      await audio.mv(filePath);
      const url = `${req.protocol}://${req.headers.host}/static/${filename}`;
      res.send({ url });
    } else {
      res.status(400).send({ message: 'Missing image/audio field' });
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
