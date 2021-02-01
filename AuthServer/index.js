const setUpServer = require('./server.js');

class AuthServer {
    constructor({ name = 'default', port = process.env.PORT, mongoURI = process.env.MONGODB_URI, batchLimit = 1000 } = {}) {
        this.port = port;
        this.server = setUpServer(mongoURI);
        this.syncInProgress = false;
        this.batchLimit = batchLimit;
    }

    start() {
        this.server.listen(this.port);
        console.log(`AuthServer server ready to go on port ${this.port}!`);
    }
}

module.exports = AuthServer;