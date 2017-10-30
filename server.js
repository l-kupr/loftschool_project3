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
				users[i].active = true;
				users[i].id = userId;
				users[i].fio = user.fio;
				if (users[i].photo) {
					socket.emit('refreshPhoto', users[i].photo);
				}
				socket.emit('messages', messages);
				break;
			}
		}
		if (notFound) {
			user.active = true;
			users.push(user);
			userFio = user.fio;
		}
		let activeUsers = users.filter(item => {return item.active});

		io.emit('refreshUsersList', activeUsers);
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
				//users.splice(i, 1);
				users[i].active = false;
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
			socket.emit('refreshPhoto', name);
			let userChanged;

			for (let i = 0; i < users.length; i++) {
				if (userId == users[i].id) {
					users[i].photo = name;
					userChanged = users[i];
					break;
				}
			}

			if (userChanged) {
				io.emit('refreshUserPhoto', userChanged);
			}

			for (let i = 0; i < messages.length; i++) {
				if (messages[i].nick == userChanged.nick) {
					messages[i].photo = name;
				}
			}
		});
	});
});

server.listen(3000, () => {
	console.log('Сервер слушает порт 3000');
});
