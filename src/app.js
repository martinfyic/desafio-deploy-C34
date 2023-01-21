import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { connectionDB } from './config/mongoDB.js';
import { strategyLogin, strategySignup } from './middlewares/passportLocal.js';
import { ecommerceRoute, infoRouter, randomRoute } from './routes/index.js';

const PORT = process.argv[2] || 8080;
const app = express();

passport.use('login', strategyLogin);
passport.use('signup', strategySignup);

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

await connectionDB();

app.listen(PORT, () =>
	console.log(`  🚀 Servidor Ok ==> http://localhost:${PORT}/ecommerce/`)
);
