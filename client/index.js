let socket = io();
let typingTimer = 0;
let fileForUploading;
let maxSize = 524288;

socket.on('refreshUsersList', users => {
	while (userslist.lastChild) {
		userslist.removeChild(userslist.lastChild);
	}
	participants.textContent = 'УЧАСТНИКИ (' + users.length + ')';
	for (let i = 0; i < users.length; i++) {
		let div = document.createElement('div');

		div.className = 'user';
		div.textContent = users[i].fio;
		userslist.appendChild(div);
	}
});

socket.on('refreshPhoto', url => {
	photo.src = url + '?' + randomInt(1,100);
});

socket.on('refreshUserPhoto', user => {
	let messages = document.getElementsByClassName('message');

	[...messages].forEach((msg) => {
		if(msg.querySelector('.message__fio').textContent == user.fio) {
			msg.querySelector('.user__photo img').src = user.photo + '?' + randomInt(1,100);
		}
	});

});

socket.on('message', message => {
	let photo = (message.photo ? (message.photo + '?' + randomInt(1,100)) : 'nophoto.jpg');
	let newDiv = document.createElement('div');

	newDiv.innerHTML = '<div class="message"><div class="user__photo"><img src="' + photo +
				'"></div><div class="message__content"><div><span class="message__fio">' + 
				message.fio + '</span>&nbsp;<span class="message__time">' + message.time +
				'</span></div><div class="message__text">' + message.text + '</div></div></div>';

	messageslist.appendChild(newDiv);
});

socket.on('typing', typingUser => {
	typing.classList.add('typing-visible');
	typing.textContent = typingUser + ' пишет ...';
	clearTimeout(typingTimer);
	typingTimer = setTimeout(() => typing.classList.remove('typing-visible'), 1000);
});

submitbtn.addEventListener('click', e => {
	e.preventDefault();

	let userFio = fio.value.replace(/^\s+|\s+$/g, '');
	let userNick = nick.value.replace(/^\s+|\s+$/g, '');

	if (userFio == '' || userNick == '') return;
	
	let user = { fio: userFio, nick: userNick };

	welcome.textContent = userFio;
	socket.emit('signin', user);
	auth.style.display = 'none';
	fio.value = '';
	nick.value = '';
});

let sendMessage = () => {
	let msg = mymessage.value.replace(/^\s+|\s+$/g, '');

	if (msg == '') return;
	
	let date = new Date();
	let options = {
		hour: 'numeric', minute: 'numeric', second: 'numeric'
	};
	let timeStr = new Intl.DateTimeFormat('ru-RU', options).format(date);
	let message = { text: msg, time: timeStr };

	socket.emit('message', message);
	mymessage.value = '';
}

let randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

sendbtn.addEventListener('click', sendMessage);
mymessage.addEventListener('keyup', e => {
	if(e.keyCode == 13) {
		sendMessage();
	}
});
mymessage.addEventListener('input', () => {
	socket.emit('typing');
});

photo.addEventListener('click', () => {
	upload.classList.remove('hidden');
});

cancelbtn.addEventListener('click', e => {
	e.preventDefault();
	e.stopPropagation();
	upload.classList.add('hidden');
});

uploadbtn.addEventListener('click', e => {
	e.preventDefault();
	e.stopPropagation();
	if (!fileForUploading) {
		alert('Файл не выбран');
		return;
	}
	upload.classList.add('hidden');
	socket.emit('uploadPhoto', fileForUploading);
});

uploaddnd.addEventListener('drop', e => {
	e.preventDefault();
	e.stopPropagation();
	
	delete uploadinput.files[0];

	let files = e.dataTransfer.files;
	
	if (files[0] > maxSize) {
		alert('Размер файла не должен превышать 512Кб');
		return false;
	}
	if (files[0].type != 'image/jpeg') {
		alert(' Можно загружать только JPG-файлы');
		return false;
	}
	var FReader = new FileReader();

	FReader.onload = (e) => {
		uploadimg.setAttribute('src', e.target.result);
		uploadimg.classList.remove('hidden');
		uploaddnd.classList.remove('dragover');
	}
	fileForUploading = files[0];
	FReader.readAsDataURL(files[0]);
});

uploaddnd.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    uploaddnd.classList.add('dragover');

    return false;
});

uploaddnd.addEventListener('dragleave', e => {
    e.preventDefault();
    e.stopPropagation();
    uploaddnd.classList.remove('dragover');

    return false;
});

uploadinput.addEventListener('change', event => {
	event.preventDefault();
}, false);