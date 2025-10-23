const express = require("express");
const http = require("http");

const cors = require("cors");
const helmet = require('helmet');

const swaggerUi = require('swagger-ui-express');
const postmanSpec = require('../config/swagger');
// const { pool } = require("../database/config");
const { queryPool } = require('./conexion');
const path = require("path");
class Server {

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);

        this.port = process.env.PORT || 4000;
        // Retry configuration for port conflicts
        this._portAttempts = 0;
        this._maxPortAttempts = 5;

        this.paths = {
            auth: '/api/auth',
            contacts: '/api/b2/contacts',
            tags: '/api/b2/tags',
            chat: '/api/b2/chat',
            messages: '/api/b2/messages',
            voice_api: '/api/voice',
            scheduled_calls: '/api/scheduled-calls'
        }

        // Connect to database before applying middlewares/routes
        // this.conectDB();

        // Helmet (security headers)
        this.helmet();

        const allowedOrigins = [
            'http://localhost:4000'
        ];
        this.corsOptions = {
            origin: (origin, callback) => {
                if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
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

        // Inicializar cron jobs
        this.initCronJobs();
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
        // Static files and API docs
        const publicDir = path.join(__dirname, '../public');
        this.app.use('/public', express.static(publicDir));
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(postmanSpec));

        // b2Chat routes
        this.app.use(this.paths.auth, require('../routes/auth'));
        this.app.use(this.paths.contacts, require('../routes/contacts'));
        this.app.use(this.paths.tags, require('../routes/tags'));
        this.app.use(this.paths.chat, require('../routes/chat'));
        this.app.use(this.paths.messages, require('../routes/messages'));
        // Voice API route
        this.app.use(this.paths.voice_api, require('../routes/voice'));
        // Scheduled calls route
        this.app.use(this.paths.scheduled_calls, require('../routes/scheduledCalls'));
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

    initCronJobs() {
        // Inicializar cron jobs para llamadas programadas
        const voiceCronJobs = require('../jobs/voiceCronJobs');

        // Retrasar la inicialización 5 segundos para que el servidor esté completamente listo
        setTimeout(() => {
            voiceCronJobs.start();
        }, 5000);
    }
}

module.exports = Server;