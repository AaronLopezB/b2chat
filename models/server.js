const express = require("express");
const cors = require("cors");

class Server {

    constructor(app) {
        this.app = express();
        this.port = process.env.PORT || 3000;

        this.paths = {
            auth: '/api/auth',
            contacts: '/api/contacts'
        }

        // this.conectDB();

        //Middlewares
        this.middlewares();

        //Rutas de mi aplicacion
        this.routes();
    }

    async conectDB() {
        await dbConnection();
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json()); // parse application/json
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use(this.paths.auth, require('../routes/auth'));
        this.app.use(this.paths.contacts, require('../routes/contacts'));
    }

    listen() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }
}

module.exports = Server;