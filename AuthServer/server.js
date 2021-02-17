module.exports = function setUpServer(mongoURI) {
    const path = require("path")
    const bodyParser = require('body-parser');
    const express = require('express');
    const app = express();
    const isDev = require("electron-is-dev")
    // const http = require('http').Server(app)
    const server = require('http').createServer(app)
    var io = require('socket.io')(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    var clients = {};

    io.on("connection", function (client) {
        client.on("sign-in", e => {
            let user_id = e._id;
            if (!user_id) return;
            client.user_id = user_id;
            if (clients[user_id]) {
                clients[user_id].push(client);
            } else {
                clients[user_id] = [client];
            }
        });

        client.on("message", e => {
            let targetId = e.to;
            let sourceId = client.user_id;
            if (targetId && clients[targetId]) {
                clients[targetId].forEach(cli => {
                    cli.emit("message", e);
                });
            }

            if (sourceId && clients[sourceId]) {
                clients[sourceId].forEach(cli => {
                    cli.emit("message", e);
                });
            }
        });

        client.on("disconnect", function () {
            if (!client.user_id || !clients[client.user_id]) {
                return;
            }
            let targetClients = clients[client.user_id];
            for (let i = 0; i < targetClients.length; ++i) {
                if (targetClients[i] == client) {
                    targetClients.splice(i, 1);
                }
            }
        });
    });

    const connection = require('./db/connection.js'); // require('./db/connection')
    const userRouter = require('./routers/user.routers')
    const taskRouter = require('./routers/task.routers')
    const cors = require('cors')
    connection(mongoURI)





    app.use(bodyParser.json({
        limit: '50mb'
    }));
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cors())
    app.use('/static', express.static(path.join(__dirname, 'assets')));
    app.use(userRouter);
    app.use(taskRouter);
    console.log('[AuthSerrver] : ', isDev)
    if (!isDev) {
        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "build", "index.html"));
        });
    }

    return server;
}