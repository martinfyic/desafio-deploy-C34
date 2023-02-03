require('dotenv/config');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('colors');
const cluster = require('node:cluster');
const os = require('node:os');
const connectionDB = require('./config/mongoDB.js');
const {
	strategyLogin,
	strategySignup,
} = require('./middlewares/passportLocal.js');
const {
	ecommerceRoute,
	infoRouter,
	randomRoute,
	error404,
} = require('./routes/index.js');
const compression = require('compression');
const { loggerError, loggerInfo } = require('./middlewares/log4js.js');

const PORT = process.env.PORT || 8080;

const mode = process.argv[3] || 'FORK';
const nroCpus = os.cpus().length;

if (cluster.isPrimary && mode === 'CLUSTER') {
	try {
		loggerInfo.info(`PID ${process.pid} id`);

		for (let i = 0; i < nroCpus; i++) {
			cluster.fork();
		}

		cluster.on('exit', (worker, code, signal) => {
			loggerInfo.info(`Worker ${worker.process.pid} died`);
		});
	} catch (error) {
		loggerError.error(err);
	}
} else {
	const app = express();

	passport.use('login', strategyLogin);
	passport.use('signup', strategySignup);

	app.set('view engine', 'ejs');
	app.set('views', './src/views');

	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(compression());

	app.use(
		session({
			secret: process.env.PASSPORT_SECRET,
			cookie: {
				httpOnly: false,
				secure: false,
				maxAge: 600000,
			},
			rolling: true,
			resave: true,
			saveUninitialized: false,
		})
	);

	app.use(passport.initialize());
	app.use(passport.session());

	app.use('/ecommerce', ecommerceRoute);
	app.use('/info', infoRouter);
	app.use('/api/randoms', randomRoute);
	app.use('*', error404);

	app
		.listen(PORT, async () => {
			await connectionDB();
			loggerInfo.info(
				`  🚀 Servidor Ok ==> http://localhost:${PORT}/ecommerce/`.cyan.bold
			),
				loggerInfo.info(`  --> PID ${process.pid} <---`.cyan.bold),
				loggerInfo.info(`  --> ${mode} Mode <---`.cyan.bold);
		})
		.on('error', err => loggerError.error(err));
}
