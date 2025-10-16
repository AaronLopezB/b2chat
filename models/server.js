const express = require("express");
const http = require("http");

const cors = require("cors");
const helmet = require('helmet');
// const { pool } = require("../database/config");
const { queryPool } = require('./conexion');
class Server {

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);

        this.port = process.env.PORT || 3000;
        // Retry configuration for port conflicts
        this._portAttempts = 0;
        this._maxPortAttempts = 5;

        this.paths = {
            auth: '/api/auth',
            contacts: '/api/contacts'
        }

        // Connect to database before applying middlewares/routes
        // this.conectDB();

        // Helmet (security headers)
        this.helmet();

        this.allowedOrigins = [
            'http://localhost:4000'
        ];
        this.corsOptions = {
            origin: (origin, callback) => {
                if (process.env.NODE_ENV === 'development' || !origin || this.allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Authorization', 'X-API-KEY', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Access-Control-Allow-Request-Method']
        };
        //Middlewares
        this.middlewares();

        //Rutas de mi aplicacion
        this.routes();
    }

    // async conectDB() {
    //     try {
    //         await queryPool()
    //     } catch (error) {

    //     }
    // }

    helmet() {
        this.app.use(
            helmet({
                contentSecurityPolicy: false,
                crossOriginEmbedderPolicy: false,
                referrerPolicy: { policy: 'no-referrer' }
            })
        );
    }

    middlewares() {
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json({ limit: '10kb' })); // parse application/json
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use(this.paths.auth, require('../routes/auth'));
        this.app.use(this.paths.contacts, require('../routes/contacts'));
    }

    listen() {
        const startServer = (port) => {
            this.server.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            }).on('error', (err) => {
                if (err && err.code === 'EADDRINUSE') {
                    this._portAttempts += 1;
                    if (this._portAttempts < this._maxPortAttempts) {
                        const nextPort = Number(port) + 1;
                        console.warn(`Port ${port} in use. Trying ${nextPort}...`);
                        startServer(nextPort);
                    } else {
                        console.error(`No available port found after ${this._maxPortAttempts} attempts.`);
                        process.exit(1);
                    }
                } else {
                    // Fallback to console if no logger is available
                    if (typeof logger !== 'undefined' && logger.error) {
                        logger.error('Unexpected error', { error: err });
                    } else {
                        console.error('Unexpected server error', err);
                    }
                    process.exit(1);
                }
            });
        };

        // Start listening on configured port
        startServer(this.port);
    }
}

module.exports = Server;