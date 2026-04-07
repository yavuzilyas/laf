import compression from 'compression';
import { handler } from './handler.js';
import http from 'http';

const server = http.createServer((req, res) => {
	// Apply compression middleware with optimal settings
	compression({
		level: 6, // Balance between speed and compression
		filter: (req, res) => {
			// Compress text-based content types
			if (req.headers['x-no-compression']) return false;
			return compression.filter(req, res);
		}
	})(req, res, () => {
		handler(req, res);
	});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
