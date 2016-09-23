window.irc = {
	socketUp: false,
	primaryFrame: null,
	timestamps: true,
	timestampFormat: "HH:mm:ss",
	supportedPrefixes: "@%+",
	modeTranslation: {
		"o": "@",
		"h": "%",
		"v": "+"
	}
};

/*********************\
|**                 **|
|**    UTILITIES    **|
|**                 **|
\*********************/

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

Date.prototype.format = function (format, utc){
	var date = this;
	var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }

	var y = utc ? date.getUTCFullYear() : date.getFullYear();
	format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
	format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
	format = format.replace(/(^|[^\\])y/g, "$1" + y);

	var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
	format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
	format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
	format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
	format = format.replace(/(^|[^\\])M/g, "$1" + M);

	var d = utc ? date.getUTCDate() : date.getDate();
	format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
	format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
	format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
	format = format.replace(/(^|[^\\])d/g, "$1" + d);

	var H = utc ? date.getUTCHours() : date.getHours();
	format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
	format = format.replace(/(^|[^\\])H/g, "$1" + H);

	var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
	format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
	format = format.replace(/(^|[^\\])h/g, "$1" + h);

	var m = utc ? date.getUTCMinutes() : date.getMinutes();
	format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
	format = format.replace(/(^|[^\\])m/g, "$1" + m);

	var s = utc ? date.getUTCSeconds() : date.getSeconds();
	format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
	format = format.replace(/(^|[^\\])s/g, "$1" + s);

	var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
	format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
	f = Math.round(f / 10);
	format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
	f = Math.round(f / 10);
	format = format.replace(/(^|[^\\])f/g, "$1" + f);

	var T = H < 12 ? "AM" : "PM";
	format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
	format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

	var t = T.toLowerCase();
	format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
	format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

	var tz = -date.getTimezoneOffset();
	var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
	if (!utc)
	{
		tz = Math.abs(tz);
		var tzHrs = Math.floor(tz / 60);
		var tzMin = tz % 60;
		K += ii(tzHrs) + ":" + ii(tzMin);
	}
	format = format.replace(/(^|[^\\])K/g, "$1" + K);

	var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
	format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
	format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

	format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
	format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

	format = format.replace(/\\(.)/g, "$1");

	return format;
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

/*********************\
|**                 **|
|**     CLASSES     **|
|**                 **|
\*********************/

class Nicklist {
	constructor(buffer, frame) {
		this.buffer = buffer;
		this.frame = frame;
		this.nicks = [];
	}

	sort() {
		this.nicks.sort(function (a,b) {
			let rex = new RegExp('^['+irc.supportedPrefixes+']');
			let nicks = [a.prefix.replace(rex,'').toLowerCase(), b.prefix.replace(rex,'').toLowerCase()];
			let prefix = [];
			if (rex.test(a.prefix)) prefix.push(irc.supportedPrefixes.indexOf(a.prefix[0])); 
				else prefix.push(irc.supportedPrefixes.length+1);
			if (rex.test(b.prefix)) prefix.push(irc.supportedPrefixes.indexOf(b.prefix[0])); 
				else prefix.push(irc.supportedPrefixes.length+1);
			if (prefix[0] < prefix[1]) return -1;
			if (prefix[0] > prefix[1]) return 1;
			if (nicks[0] > nicks[1]) return 1;
			if (nicks[0] < nicks[1]) return -1;
			return 0;
		});
		return this.nicks;
	}

	appendToList(nick) {
		if(!this.buffer.active) return;

		let str = document.createElement("div");
		str.className = "nick";
		str.setAttribute('id', 'nick-'+nick.nickname);
		let construct = "<span class='prefix'>"+nick.prefix+"</span><span class='nickname'>"+nick.nickname+"</span>";
		str.innerHTML = construct;
		this.frame.appendChild(str);
	}

	render() {
		this.frame.innerHTML = "";
		for(let n in this.nicks) {
			let nick = this.nicks[n];
			this.appendToList(nick);
		}
	}

	nickAdd(nickname) {
		let newbie = { nickname: nickname, prefix: "", modes: [] }
		this.nicks.push(newbie);
		this.render();
	}

	nickRemove(nickname) {
		let nickIndex = this.getNickIndex(nickname);

		if(nickIndex != null)
			this.nicks.splice(nickIndex, 1);
		else
			return;

		this.render();
	}

	nickChange(oldNickname, newNickname) {
		let nickIndex = this.getNickIndex(oldNickname);

		if(nickIndex != null)
			this.nicks[nickIndex].nickname = newNickname;
		else
			return;

		this.render();
	}

	getNickIndex(nickname) {
		let result = null;
		
		for(let n in this.nicks)
			if(this.nicks[n].nickname == nickname) result = n;

		return result;
	}

	modeAdded(nickname, newMode) {
		let nickIndex = this.getNickIndex(nickname);
		let nick = null;

		if(nickIndex != null)
			nick = this.nicks[nickIndex];
		else
			return;

		for(let mode in irc.modeTranslation) {
			let prefix = irc.modeTranslation[m];
			if(newMode == mode)
				this.nicks[nickIndex].prefix = prefix;
		}

		this.render();
	}

	modeRemoved(nickname, oldMode) {
		let nickIndex = this.getNickIndex(nickname);
		let nick = null;

		if(nickIndex != null)
			nick = this.nicks[nickIndex];
		else
			return;

		for(let mode in irc.modeTranslation) {
			let prefix = irc.modeTranslation[m];
			if(newMode == mode)
				this.nicks[nickIndex].prefix = "";
		}

		this.render();
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

		ttt.addEventListener('click', () => {
			if(this.buffer.active)
				return;
			irc.chat.render(this.buffer);
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
			if(count == 0) {
				counter.className = "none";
			} else {
				counter.innerHTML = count;
				counter.className = "";
			}
		}
	}

	close() {
		console.log('close requested for '+this.buffer.title);
	}
}

class Buffer {
	constructor(servername, buffername, tabname, type) {
		this.messages = [];
		this.nicklist = null;
		this.topic = null;
		this.input = "";
		this.lastscroll = 0;
		this.unreadCount = 0;

		this.server = servername;
		this.name = buffername;
		this.title = tabname;
		this.type = type;

		this.nicklistDisplayed = false;
		this.active = false;

		this.tab = new Tab(this);
		this.tab.renderTab(irc.primaryFrame.querySelector('.tabby'));

		if(type == "channel") {
			this.nicklistDisplayed = true;
			this.nicklist = new Nicklist(this);
		}

		this.frame = irc.primaryFrame.querySelector('#chat');
		this.letterbox = this.frame.querySelector('.letterbox');
	}

	render() {
		this.active = true;
		this.tab.setActive(true);
		this.unreadCount = 0;
		this.tab.setUnreadCount(0);

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
		this.letterbox.scrollTop = this.lastscroll;
	}

	renderMessages() {
		if(!this.active) return;

		this.letterbox.innerHTML = "";

		for(let t in this.messages) {
			let mesg = this.messages[t];
			this.appendMessage({message: mesg.message, sender: mesg.sender, type: mesg.type, time: mesg.time});
		}
	}

	appendMessage(meta) {
		let mesgConstr = document.createElement('div');
		mesgConstr.className = "message type_simple m_"+meta.type;

		let construct = "";
		if(irc.timestamps)
			construct += "<span class='timestamp'>"+meta.time.format(irc.timestampFormat)+"</span>";

		if(meta.sender != null)
			construct += "<span class='sender'>"+meta.sender+"</span>";
		else
			addClass(mesgConstr, "no_sender");

		construct += "<span class='content'>"+meta.message+"</span>";

		mesgConstr.innerHTML = construct;
		this.letterbox.appendChild(mesgConstr);

		let lFactor = this.letterbox.offsetHeight + this.letterbox.scrollTop
		if(lFactor > this.letterbox.scrollHeight - 100)
			this.letterbox.scrollTop = this.letterbox.scrollHeight;
	}

	addMessage(message, sender, type) {
		let mesg = {message: message, sender: sender, type: type, time: new Date()}
		this.messages.push(mesg);

		if(this.active)
			this.appendMessage(mesg);
		else
			this.unreadCount += 1;

		this.tab.setUnreadCount(this.unreadCount);
	}

	switchOff() {
		this.tab.setActive(false);
		this.lastscroll = this.letterbox.scrollTop;
		this.active = false;
	}

	close() {

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

		this.f_form.onsubmit = (e) => {
			if(this.formLocked) {
				e.preventDefault(); 
				return false;
			}

			this.formLocked = true;

			let success = this.validateForm(e);

			if(!success)
				this.formLocked = false;
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

	closeBuffer(buffer) {
		// todo: close
	}

	messageBuffer(name, server, message) {
		let buf = this.getBufferByNameServer(server, name);

		if(buf == null)
			buf = this.createBuffer(server, name, "message", false);

		buf.addMessage(message.message, message.from, message.type);
	}

	render(buffer) {
		let activeNow = this.getActiveBuffer();

		if(activeNow) 
			activeNow.switchOff();

		buffer.render();
	}
}

/**************************\
|**                      **|
|**    INITIALIZATION    **|
|**                      **|
\**************************/

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
