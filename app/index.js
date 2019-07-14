const express = require('express');
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const parser = require('body-parser');

const CONFIG = require('./config');

const app = express();
app.use(cors());
app.use(parser.json())
const server = http.createServer(app);
server.listen(CONFIG.PORT);
io = socketIo(server);

require('./controller/users')(io);
