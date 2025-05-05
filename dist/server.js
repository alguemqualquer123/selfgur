"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = __importDefault(require("ws"));
const WebSocketServer = ws_1.default.Server;
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const app = (0, express_1.default)();
app.use((0, express_fileupload_1.default)());
app.use('/static', express_1.default.static(path_1.default.resolve(__dirname, '../static')));
app.post('/upload', async (req, res) => {
    const files = req.files;
    const image = files?.image;
    const audio = files?.audio;
    try {
        if (image) {
            const filename = `${(0, uuid_1.v4)()}.jpg`;
            const filePath = path_1.default.resolve(__dirname, '../static', filename);
            await image.mv(filePath);
            const url = `${req.protocol}://${req.headers.host}/static/${filename}`;
            res.send({ url });
        }
        else if (audio) {
            if (!audio.mimetype.includes('webm')) {
                res.status(400).send({ message: 'Audio mimetype must be webm' });
                return;
            }
            const filename = `${(0, uuid_1.v4)()}.webm`;
            const filePath = path_1.default.resolve(__dirname, '../static', filename);
            await audio.mv(filePath);
            const url = `${req.protocol}://${req.headers.host}/static/${filename}`;
            res.send({ url });
        }
        else {
            res.status(400).send({ message: 'Missing image/audio field' });
        }
    }
    catch (err) {
        res.status(500).send({ message: err.message });
    }
});
const server = http_1.default.createServer(app);
server.listen(port, () => {
    console.log(`Server listening at http://${host}:${port}`);
});
const RTC = new WebSocketServer({ server });
const rooms = new Map();
let lastId = 0;
function generateId() {
    return ++lastId;
}
RTC.on('connection', (socket, request) => {
    const room = request.url?.substring(1);
    if (!room)
        return socket.close();
    const clients = rooms.get(room) ?? new Set();
    clients.add(socket);
    rooms.set(room, clients);
    socket.id = generateId();
    console.log(`WebSocket ${socket.id} connected on room: ${room}`);
    socket.on('message', (data) => {
        rooms.get(room)?.forEach(peer => {
            if (peer !== socket)
                peer.send(data);
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
