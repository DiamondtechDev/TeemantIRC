window.irc = {
	socketUp: false,
	primaryFrame: null
};

window.validators = {};

Array.prototype.remove_str = function(str) {
	let arr = this;
	let index = arr.indexOf(str);

	if(indexOf > -1) {
		arr.splice(index, 1);
		return arr;
	}
	return arr;
};

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

class Tab {
	constructor(buffer) {
		this.buffer = buffer;
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

		this.tab = new Tab(this);

		if(type == "channel")
			nicklistDisplayed = true;
	}
}

class IRCConnector {
	constructor(frame) {
		this.frame = frame;
		this.messenger = frame.querySelector('#connmsg');
		this.f_form = frame.querySelector('#IRCConnector');

		this.f_nickname = this.f_form.querySelector('#nickname');
		this.f_channel = this.f_form.querySelector('#channel');
		this.f_server = this.f_form.querySelector('#server');
		this.f_port = this.f_form.querySelector('#port');
		this.formLocked = false;

		let instance = this;

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
			this.authMessage("Erronous nickname!", true);
			return false;
		}

		if (channel.indexOf(",") !== -1) {
			channel = channel.trim().split(",");

			for (let t in channel) {
				if(typeof(t) != "number") continue;
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
			this.authMessage("Erronous server address!", true);
			return false;
		}

		try {
			port = parseInt(port);
		} catch(e) {
			this.authMessage("Erronous port!", true);
			return false;
		}

		if(port < 10 || port > 65535) {
			this.authMessage("Erronous port!", true);
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
	}

	newServerBuffer(serverinfo) {
		console.log("wat");
		if(this.firstServer) {
			this.frame.style.display = "block";
		}

		let newServer = new Buffer(serverinfo.address, serverinfo.address, serverinfo.network, "server");
		this.buffers.push(newServer);
		this.render(newServer);
		this.firstServer = false;
	}

	getBufferByName(buffername) {
		let result = null;
		for (let t in this.buffers) {
			if(typeof(t) != "number") continue;
			let buf = this.buffers[t];
			if(buf.name == buffername)
				result = buf
		}
		return result;
	}

	getBuffersByServer(server) {
		let result = [];
		for (let t in this.buffers) {
			if(typeof(t) != "number") continue;
			let buf = this.buffers[t];
			if(buf.server == server)
				result.push(buf);
		}
		return result;
	}

	getBuffersByType(type) {
		let result = [];
		for (let t in this.buffers) {
			if(typeof(t) != "number") continue;
			let buf = this.buffers[t];
			if(buf.type == type)
				result.push(buf);
		}
		return result;
	}

	render(buffer) {
		console.log(buffer);
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
			case "connect_message":
				irc.auther.authMessage(data.data, data.error);
				break;
		}
	});
}
