
module.exports = function setUpServer(mongoURI) {
    const path = require("path")
    const bodyParser = require('body-parser');
    const express = require('express');
    const app = express();
    const http = require('http').Server(app)
    const io = require('socket.io')(http)
    const connection = require('./db/connection.js');// require('./db/connection')
    const userRouter = require('./routers/user.routers')
    const taskRouter = require('./routers/task.routers')
    const cors = require('cors')
    connection(mongoURI)

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cors())
    app.use('/static', express.static(path.join(__dirname, 'assets')));
    app.use(userRouter);
    app.use(taskRouter);

    io.use(cors())
    io.on('connection', function (socket) {
        socket.on('message', ({ name, Massage }) => {
            io.emit('message', { name, Massage })
        })
        console.log('[Socket.io] Connected!')
    })

    return app;
}