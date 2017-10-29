const express  = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

app.use(express.static(__dirname));

let users = [];
let messages = [];

io.on('connection', (socket) => {
	let userId = socket.id;
	let userFio;

	socket.on('signin', user => {
		user.id = userId;
		let notFound = true;
		for (let i = 0; i < users.length; i++) {
			if (users[i].nick == user.nick) {
				notFound = false;
				break;
			}
		}
		if (notFound) {
			users.push(user);
			userFio = user.fio;
		}
		io.emit('refreshUsersList', users);
	});

	socket.on('message', message => {
		for (let i = 0; i < users.length; i++) {
			if (userId == users[i].id) {
				message.fio = users[i].fio;
				message.nick = users[i].nick;
				if (users[i].photo) {
					message.photo = users[i].photo;
				}
			}
		}
		messages.push(message);
		io.emit('message', message);
	});

	socket.on('disconnect', () => {
		for (let i = 0; i < users.length; i++) {
			if (userId == users[i].id) {
				users.splice(i, 1);
				break;
			}
		}
		io.emit('refreshUsersList', users);
	});

	socket.on('typing', () => {
		socket.broadcast.emit('typing', userFio);
	});

	socket.on('uploadPhoto', data => {
		let name = 'tmp/' + userId + '.jpg';

		fs.writeFile(name, data, err => {
			if (err) {
				throw err;
			}
			let userChanged;

			for (let i = 0; i < users.length; i++) {
				if (userId == users[i].id) {
					users[i].photo = name;
					userChanged = users[i];
					break;
				}
			}
			socket.emit('refreshPhoto', name);
			if (userChanged) {
				io.emit('refreshUserPhoto', userChanged);
			}
		});
	});
});

server.listen(3000, () => {
	console.log('Сервер слушает порт 3000');
});
