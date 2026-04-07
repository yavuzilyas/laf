import { handler } from './handler.js';
import http from 'http';

const server = http.createServer((req, res) => {
	handler(req, res);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
