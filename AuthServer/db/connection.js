module.exports = function connection(mongoURI) {
    const mongoose = require('mongoose')
    const uri = mongoURI;

    mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
        .then(() => console.log('AuthServer DB Connected'))
        .catch(err => console.log('Caught', err.stack));
}

