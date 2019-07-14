const express = require('express');
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const parser = require('body-parser');
require("dotenv").config()


const CONFIG = require('./config');
const path = require("path");
const port = process.env.PORT || CONFIG.PORT;

const app = express();
app.use(cors());
app.use(parser.json())
app.use(express.static('../client/build'));
app.get("*", (req, res) => {
    res.sendFile(path.resolve("../",__dirname, "client", "build", "index.html"));
});

const server = http.createServer(app);
server.listen(port);
io = socketIo(server);

require('./controller/users')(io);
