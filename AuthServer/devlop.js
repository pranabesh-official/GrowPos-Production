const path = require("path")
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http)
require('./db/connection')
const userRouter = require('./routers/user.routers')
const taskRouter = require('./routers/task.routers')
const cors =require('cors')


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
app.use(cors())
app.use('/static', express.static(path.join(__dirname, 'assets')));

app.use(userRouter);
app.use(taskRouter);

io.use(cors())
// io.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
io.on('connection', function (socket) {
    socket.on('message', ({ name, Massage }) => {
        io.emit('message', { name, Massage })
    })
    console.log('[Socket.io] Connected!')
})

app.listen(4545, function () {
    console.log('[Socket.io] listening Port 4545! 🔥')
})
// const SocketSrver = () => {

//     app.listen(4545, function () {
//         console.log('[Socket.io] listening Port 4545! 🔥')
//     })
// }

// module.exports = SocketSrver;