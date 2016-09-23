window.irc = {
	socketUp: false,
	primaryFrame: null,
	timestamps: true
};

window.validators = {};

window.validators.iporhost = function(str) {
	let valid = false;

	if(str.match(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i)) {
		valid = true;
	} else if (str.match(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/i)) {
		valid = true;
	}

	return valid;
}

window.validators.nickname = function(str) {
	if(str.match(/[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*/i)) {
		return true;
	}
	return false;
}

function remove_str(arr, str) {
	let index = arr.indexOf(str);

	if(index > -1) {
		arr.splice(index, 1);
		return arr;
	}
	return arr;
};


function removeClass(element, cl) {
	let classList = element.className.split(" ");
	remove_str(classList, cl);
	element.className = classList.join(" ");
}

function addClass(element, cl) {
	let classList = element.className.split(" ");
	classList.push(cl);
	element.className = classList.join(" ");
}

class Nicklist {
	constructor(buffer) {
		this.buffer = buffer;
		this.nicks = [];
	}

	render(frame) {

	}
}

class Tab {
	constructor(buffer) {
		this.buffer = buffer;
		this.element = null;
	}

	// Create a tab element
	renderTab(frame) {
		let internals = "<span id='title'>"+ this.buffer.title +"</span><span id='unread'></span><span id='close'>x</span>";
		let ttt = document.createElement('div');
		ttt.innerHTML = internals;
		ttt.className = "tab";
		ttt.setAttribute('id', 'tab-'+this.name);
		frame.appendChild(ttt);
		this.element = ttt;

		let instance = this;
		ttt.addEventListener('click', function() {
			if(instance.buffer.active)
				return;
			irc.chat.render(instance.buffer);
		}, false);
	}

	setActive(active) {
		if(this.element) {
			this.element.className = "tab";
			if(active) {
				addClass(this.element, "active");
			}
		}
	}

	setUnreadCount(count) {
		if(this.element) {
			let counter = this.element.querySelector('#unread');
			if(count == 0) 
				counter.innerHTML = "";
			else
				counter.innerHTML = count;
		}
	}

	close() {
		console.log('close requested for '+this.buffer.title);
	}
}

class Buffer {
	constructor(servername, buffername, tabname, type) {
		this.messages = [];
		this.nicklist = [];
		this.topic = null;
		this.input = "";
		this.lastscroll = 0;

		this.server = servername;
		this.name = buffername;
		this.title = tabname;
		this.type = type;

		this.nicklistDisplayed = false;
		this.active = false;

		this.tab = new Tab(this);
		this.tab.renderTab(irc.primaryFrame.querySelector('.tabby'));

		if(type == "channel")
			this.nicklistDisplayed = true;

		this.frame = irc.primaryFrame.querySelector('#chat');
		this.letterbox = this.frame.querySelector('.letterbox');
	}

	render() {
		this.active = true;
		this.tab.setActive(true);

		let chat = this.frame.querySelector('.chatarea');
		let topicbar = chat.querySelector('.topicbar');
		let nicklist = chat.querySelector('.nicklist');

		chat.className = "chatarea";
		nicklist.innerHTML = "";
		topicbar.innerHTML = "";

		if(this.nicklistDisplayed) {
			addClass(chat, 'vnicks');
		}

		if(this.topic != null && this.topic != "") {
			addClass(chat, 'vtopic');
			topicbar.innerHTML = this.topic;
		}

		this.renderMessages();
	}

	renderMessages() {
		if(!this.active) return;

		this.letterbox.innerHTML = "";

		let instance = this;
		for(let t in this.messages) {
			let mesg = instance.messages[t];
			instance.appendMessage({message: mesg.message, sender: mesg.sender, type: mesg.type, time: mesg.time});
		}
	}

	appendMessage(meta) {
		let mesgConstr = document.createElement('div');
		mesgConstr.className = "message m_"+meta.type;

		let construct = "";
		if(irc.timestamps)
			construct += "<span class='timestamp'>"+meta.time+"</span>";

		if(meta.sender != null)
			construct += "<span class='sender'>"+meta.sender+"</span>";
		else
			addClass(mesgConstr, "no_sender");

		construct += "<span class='content'>"+meta.message+"</span>";

		mesgConstr.innerHTML = construct;
		this.letterbox.appendChild(mesgConstr);
	}

	addMessage(message, sender, type) {
		let mesg = {message: message, sender: sender, type: type, time: Date.now()}
		this.messages.push(mesg);

		if(this.active)
			this.appendMessage(mesg);
	}

	close() {

	}
}

class IRCConnector {
	constructor(frame) {
		let instance = this;

		this.frame = frame;
		this.messenger = frame.querySelector('#connmsg');
		this.f_form = frame.querySelector('#IRCConnector');

		this.f_nickname = this.f_form.querySelector('#nickname');
		this.f_channel = this.f_form.querySelector('#channel');
		this.f_server = this.f_form.querySelector('#server');
		this.f_port = this.f_form.querySelector('#port');
		this.formLocked = false;

		this.f_form.onsubmit = function(e) {
			if(instance.formLocked) {
				e.preventDefault(); 
				return false;
			}

			instance.formLocked = true;

			let success = instance.validateForm(e);

			if(!success)
				instance.formLocked = false;
		}
	}

	validateForm(event) {
		event.preventDefault();

		let nickname = this.f_nickname.value;
		let channel = this.f_channel.value;
		let server = this.f_server.value;
		let port = this.f_port.value;

		if (!window.validators.nickname(nickname)) {
			this.authMessage("Erroneous nickname!", true);
			return false;
		}

		if (channel.indexOf(",") !== -1) {
			channel = channel.trim().split(",");

			for (let t in channel) {
				let chan = channel[t];
				
				channel[t] = chan.trim();

				if (chan.indexOf("#") != 0) {
					channel[t] = "#"+chan;
				}
			}
		} else if(channel != "") {
			channel = channel.trim();
			if (channel.indexOf("#") != 0) {
				channel = "#"+channel;
			}
			channel = [channel];
		} else {
			channel = [];
		}

		if(!window.validators.iporhost(server)) {
			this.authMessage("Erroneous server address!", true);
			return false;
		}

		try {
			port = parseInt(port);
		} catch(e) {
			this.authMessage("Erroneous port!", true);
			return false;
		}

		if(port < 10 || port > 65535) {
			this.authMessage("Erroneous port!", true);
			return false;
		}

		irc.socket.emit('irc_create', {nickname: 	nickname,
									   autojoin: 	channel,
									   server: 		server,
									   port: 		port,
									   password: 	null,
									   secure: 	false });
		return true;
	}

	authMessage(message, error) {
		this.messenger.innerHTML = "<span class='msg"+(error?" error":"")+"'>"+message+"</span>";
	}

	authComplete() {
		this.frame.style.display = "none";
		this.formLocked = false;
	}
}

class IRCChatWindow {
	constructor(frame) {
		this.frame = frame;
		this.buffers = [];
		this.frame.style.display = "none";
		this.firstServer = true;

		this.currentBuffer = null;

		irc.switchBuffer = this.render;
	}

	getBufferByName(buffername) {
		let result = null;
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.name == buffername)
				result = buf
		}
		return result;
	}

	getActiveBuffer() {
		let result = null;
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.active == true)
				result = buf
		}
		return result;
	}

	getBuffersByServer(server) {
		let result = [];
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.server == server)
				result.push(buf);
		}
		return result;
	}

	getBufferByNameServer(server, channel) {
		let result = null;
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.server == server && buf.name == channel)
				result = buf;
		}
		return result;
	}

	getBuffersByType(type) {
		let result = [];
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.type == type)
				result.push(buf);
		}
		return result;
	}

	newServerBuffer(serverinfo) {
		if(this.firstServer) {
			this.frame.style.display = "block";
		}

		let newServer = new Buffer(serverinfo.address, serverinfo.address, serverinfo.network, "server");
		this.buffers.push(newServer);
		this.render(newServer);
		this.firstServer = false;
	}

	createBuffer(server, name, type, autoswitch) {
		let buf = this.getBufferByNameServer(server, name);
		if(buf) {
			if(autoswitch)
				this.render(buf);
			return;
		}

		buf = new Buffer(server, name, name, type);
		this.buffers.push(buf);

		if(autoswitch)
			this.render(buf);
	}

	messageBuffer(name, server, message) {
		let buf = this.getBufferByNameServer(server, name);
		if(buf == null)
			return;
		buf.addMessage(message.message, message.from, message.type);
	}

	render(buffer) {
		let instance = this;
		let activeNow = this.getActiveBuffer();

		if(activeNow) {
			activeNow.tab.setActive(false);
			activeNow.active = false;
		}

		buffer.render();
	}
}

window.onload = function() {
	irc.socket = io.connect('http://localhost:8080');

	irc.primaryFrame = document.querySelector('.ircclient');
	irc.auther = new IRCConnector(irc.primaryFrame.querySelector("#authdialog"));
	irc.chat = new IRCChatWindow(irc.primaryFrame.querySelector("#chat"));

	irc.socket.on('connect', function (data) {
		irc.socketUp = true;
	});

	irc.socket.on('disconnect', function (data) {
		irc.socketUp = false;
		alert("Server died. Please try again later.");
	});

	// Does everything
	irc.socket.on('act_client', function (data) {
		switch(data.type) {
			case "event_connect":
				irc.auther.authComplete();
				irc.chat.newServerBuffer(data);
				break;
			case "event_join_channel":
				irc.chat.createBuffer(data.server, data.name, "channel", true);
				break;
			case "server_message":
				irc.chat.messageBuffer(data.to, data.server, {message: data.message, type: data.messageType, from: data.from});
				break;
			case "connect_message":
				irc.auther.authMessage(data.data, data.error);
				break;
		}
	});
}
