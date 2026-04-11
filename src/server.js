import compression from 'compression';
import { handler } from './handler.js';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

// Body parser with 4MB limit
app.use(bodyParser.json({ limit: '4mb' }));
app.use(bodyParser.urlencoded({ limit: '4mb', extended: true }));
app.use(bodyParser.raw({ limit: '4mb', type: 'application/octet-stream' }));

// Compression middleware
app.use(compression({
	level: 6,
	filter: (req, res) => {
		if (req.headers['x-no-compression']) return false;
		return compression.filter(req, res);
	}
}));

// SvelteKit handler
app.all('*', (req, res) => {
	handler(req, res);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
