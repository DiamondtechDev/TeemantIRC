window.irc = {
	socketUp: false,
	primaryFrame: null,
	timestamps: true,
	timestampFormat: "HH:mm:ss",
	serverData: {},
	serverChatQueue: {},
	chatType: "simple"
};

window.clientdom = {connector: {}};

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

function linkify(text) {
	// see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
	let re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
	let parsed = text.replace(re, function(url) {
		// turn into a link
		let href = url;
		if (url.indexOf('http') !== 0) {
			href = 'http://' + url;
		}
		return '<a href="' + href + '" target="_blank">' + url + '</a>';
	});
	return parsed;
}

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

function toggleClass(element, cl) {
	let classList = element.className.split(" ");
	if(classList.indexOf(cl) != -1)
		removeClass(element, cl);
	else
		addClass(element, cl);
}

let composer = {
	message: {
		simple: function(time, sender, message, type) {
			let element = document.createElement('div');
			element.className = "message type_simple m_"+type;

			if(irc.timestamps)
				element.innerHTML += "<span class='timestamp'>"+time.format(irc.timestampFormat)+"</span>&nbsp;";

			message = linkify(message);

			switch(type) {
				case "action":
					element.innerHTML += "<span class='asterisk'>*</span>&nbsp;<span class='actionee'>"+sender+"</span>&nbsp;";
					element.innerHTML += "<span class='content'>"+message+"</span>";
					break;
				case "part":
				case "quit":
				case "kick":
					element.innerHTML += "<span class='arrowout'>&#11013;</span>&nbsp;<span class='content'><span class='actionee'>"+sender+"</span>";
					element.innerHTML += "&nbsp;"+message+"</span>";
					break;
				case "join":
					element.innerHTML += "<span class='arrowin'>&#10145;</span>&nbsp;<span class='content'><span class='actionee'>"+sender+"</span>";
					element.innerHTML += "&nbsp;"+message+"</span>";
					break;
				default:
					if(sender) {
						element.innerHTML += "<span class='sender'>"+sender+"</span>&nbsp;<span class='content'>"+message+"</span>";
					} else {
						element.innerHTML += "<span class='content'>"+message+"</span>";
						addClass(element, "no_sender");
					}
					break;
			}
			return element;
		}
	}
}

/*********************\
|**                 **|
|**     CLASSES     **|
|**                 **|
\*********************/

class Nicklist {
	constructor(buffer) {
		this.buffer = buffer;
		this.nicks = [];
	}

	sort() {
		let spfx = irc.serverData[this.buffer.server].supportedPrefixes
		this.nicks.sort(function (a,b) {
			let rex = new RegExp('^['+spfx+']');
			let nicks = [a.prefix.replace(rex,'').toLowerCase(), b.prefix.replace(rex,'').toLowerCase()];
			let prefix = [];
			if (rex.test(a.prefix)) prefix.push(spfx.indexOf(a.prefix[0])); 
				else prefix.push(spfx.length+1);
			if (rex.test(b.prefix)) prefix.push(spfx.indexOf(b.prefix[0])); 
				else prefix.push(spfx.length+1);
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
		let construct = "";

		if(nick.prefix != "")
			construct += "<span class='prefix'>"+nick.prefix+"</span>";
		else
			construct += "<span class='no-prefix'>&nbsp;</span>";

		construct += "<span class='nickname'>"+nick.nickname+"</span>";
		str.innerHTML = construct;
		clientdom.nicklist.appendChild(str);
	}

	render() {
		if(!this.buffer.active) return;
		clientdom.nicklist.innerHTML = "";
		this.sort();
		for(let n in this.nicks) {
			let nick = this.nicks[n];
			this.appendToList(nick);
		}
	}

	nickAdd(nickname) {
		let newbie = { nickname: nickname, prefix: "", modes: [] }
		if(this.getNickIndex(nickname) != null) return;
		this.nicks.push(newbie);
		this.render();
	}

	nickAddObject(obj) {
		if(this.getNickIndex(obj.nickname) != null) return;
		this.nicks.push(obj);
	}

	nickRemove(nickname) {
		let nickIndex = this.getNickIndex(nickname);

		if(nickIndex != null)
			this.nicks.splice(nickIndex, 1);
		else
			return;

		if(!this.buffer.active) return;
		let tt = clientdom.nicklist.querySelector('#nick-'+nickname);
		if(tt) tt.remove();
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
		this.closeRequested = false;
	}

	// Create a tab element
	renderTab() {
		let internals = "<span id='title'>"+ this.buffer.title +"</span><span id='unread' class='none'></span>";
		
		let ttt = document.createElement('div');
		ttt.innerHTML = internals;
		ttt.className = "tab";
		ttt.setAttribute('id', 'tab-'+this.name);
		clientdom.tabby.appendChild(ttt);
		this.element = ttt;

		if(this.buffer.type != "server") {
			ttt.innerHTML += "<span id='close'>x</span>"
			ttt.querySelector('#close').addEventListener('click', () => {
				this.close();
			}, false);
		}

		ttt.addEventListener('click', () => {
			if(this.closeRequested) return;

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
		this.closeRequested = true;
		this.buffer.closeBuffer();
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
		this.active = false;

		this.tab = new Tab(this);
		this.tab.renderTab(clientdom.tabby);

		if(type == "channel")
			this.nicklist = new Nicklist(this, clientdom.nicklist);
	}

	render() {
		this.active = true;
		this.tab.setActive(true);
		this.unreadCount = 0;
		this.tab.setUnreadCount(0);

		clientdom.chat.className = "chatarea";
		clientdom.nicklist.innerHTML = "";
		clientdom.topicbar.innerHTML = "";

		if(this.nicklist) {
			addClass(clientdom.chat, 'vnicks');
			this.nicklist.render();
		}

		if(this.topic != null && this.topic != "") {
			addClass(clientdom.chat, 'vtopic');
			clientdom.topicbar.innerHTML = linkify(this.topic);
		}

		this.renderMessages();
		clientdom.letterbox.scrollTop = this.lastscroll;

		clientdom.currentNickname.innerHTML = irc.serverData[this.server].my_nick;
	}

	renderMessages() {
		if(!this.active) return;

		clientdom.letterbox.innerHTML = "";

		for(let t in this.messages) {
			let mesg = this.messages[t];
			this.appendMessage({message: mesg.message, sender: mesg.sender, type: mesg.type, time: mesg.time});
		}
	}

	appendMessage(meta) {
		let mesgConstr = composer.message[irc.chatType](meta.time, meta.sender, meta.message, meta.type);
		clientdom.letterbox.appendChild(mesgConstr);

		let lFactor = clientdom.letterbox.offsetHeight + clientdom.letterbox.scrollTop
		if(lFactor > clientdom.letterbox.scrollHeight - 100)
			clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
	}

	topicChange(topic) {
		if(this.active) {
			clientdom.topicbar.innerHTML = linkify(topic);

			if(this.topic == null)
				addClass(clientdom.chat, "vtopic");
		}
		this.topic = topic;
	}

	addMessage(message, sender, type, time) {
		let mesg = {message: message, sender: sender, type: type, time: time || new Date()}
		this.messages.push(mesg);

		if(type == "regular")
			console.log(sender);

		if(this.active)
			this.appendMessage(mesg);
		else
			this.unreadCount += 1;

		this.tab.setUnreadCount(this.unreadCount);
	}

	switchOff() {
		this.tab.setActive(false);
		this.lastscroll = clientdom.letterbox.scrollTop;
		this.active = false;
	}

	closeBuffer() {
		irc.chat.closeBuffer(this);
	}
}

class IRCConnector {
	constructor() {
		this.formLocked = false;

		clientdom.connector.form.onsubmit = (e) => {
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

		let nickname = clientdom.connector.nickname.value;
		let channel = clientdom.connector.channel.value;
		let server = clientdom.connector.server.value;
		let port = clientdom.connector.port.value;

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
		clientdom.connector.messenger.innerHTML = "<span class='msg"+(error?" error":"")+"'>"+message+"</span>";
	}

	authComplete() {
		clientdom.connector.frame.style.display = "none";
		this.formLocked = false;
	}
}

class InputHandler {
	constructor() {
		this.history = [];

		clientdom.input.onkeyup = (evt) => {
			let key = evt.keyCode || evt.which || evt.charCode || 0;
			if (key == 13) {
				this.handleInput();
			}
		}

		clientdom.send.onclick = (e) => {
			this.handleInput();
		}
	}

	handleInput() {
		let inp = clientdom.input.value;
		let buf = irc.chat.getActiveBuffer();

		if(!buf) return;
		if(inp.trim() == "") return;
		let listargs = inp.split(' ');

		if(listargs[0].indexOf('/') == 0)
			return;

		irc.socket.emit("userinput", {target: buf.name, targetType: buf.type, server: buf.server, message: inp, splitup: inp.split(" ")});
		this.history.push(inp);
		clientdom.input.value = "";
	}
}

class IRCChatWindow {
	constructor() {
		this.buffers = [];
		clientdom.frame.style.display = "none";
		this.firstServer = true;
		this.currentBuffer = null;
		this.input_handler = new InputHandler();
		clientdom.smsctrig.onclick = (e) => {
			toggleClass(clientdom.chat, "vopentrig");
		}
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

	getBufferByServerName(server, channel) {
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
			clientdom.frame.style.display = "block";
		}

		let prefixes = "";

		for(let v in serverinfo.supportedModes) {
			prefixes += serverinfo.supportedModes[v];
		}

		irc.serverData[serverinfo.address] = {
			modeTranslation: serverinfo.supportedModes,
			supportedPrefixes: prefixes,
			network: serverinfo.network,
			my_nick: serverinfo.nickname
		}

		let newServer = new Buffer(serverinfo.address, serverinfo.address, serverinfo.network, "server");
		this.buffers.push(newServer);
		this.render(newServer);
		this.firstServer = false;

		if(irc.serverChatQueue[serverinfo.address]) {
			for(let a in irc.serverChatQueue[serverinfo.address]) {
				let mesg = irc.serverChatQueue[serverinfo.address][a];
				newServer.addMessage(mesg.message, mesg.from, mesg.type, mesg.time);
			}
			delete irc.serverChatQueue[serverinfo.address];
		}

	}

	createBuffer(server, name, type, autoswitch) {
		let buf = this.getBufferByServerName(server, name);
		if(buf) {
			if(autoswitch)
				this.render(buf);
			return buf;
		}

		buf = new Buffer(server, name, name, type);
		this.buffers.push(buf);

		if(autoswitch)
			this.render(buf);

		return buf;
	}

	closeBuffer(buffer) {
		if(buffer.type == "server") return; // Don't close server buffers, lol
		if(buffer.type == "channel") console.log("TODO: PART");
		let bufIndex = this.buffers.indexOf(buffer);

		if(buffer.active) {
			console.log(bufIndex);
			if (bufIndex == 0) {
				if(this.buffers[bufIndex+1]) {
					this.render(this.buffers[bufIndex+1]);
				}
			} else {
				this.render(this.buffers[bufIndex-1]);
			}
		}

		buffer.tab.element.remove();
		this.buffers.splice(bufIndex, 1);
	}

	messageBuffer(name, server, message) {
		let buf = this.getBufferByServerName(server, name);

		if(buf == null)
			buf = this.createBuffer(server, name, "message", false);

		buf.addMessage(message.message, message.from, message.type);
	}

	buildNicklist(channel, server, nicks) {
		let buf = this.getBufferByServerName(server, channel);

		if(buf == null)
			return;

		for(let n in nicks) {
			let nick = {nickname: "", prefix: ""};

			if(irc.serverData[buf.server].supportedPrefixes.split('').indexOf(nicks[n].substring(0, 1)) != -1) {
				nick.prefix = nicks[n].substring(0, 1);
				nick.nickname = nicks[n].substring(1);
			} else {
				nick.nickname = nicks[n];
			}

			buf.nicklist.nickAddObject(nick);
		}

		if(buf.active)
			buf.nicklist.render();
	}

	nickChange(server, oldNick, newNick) {
		let buffers = this.getBuffersByServer(server);

		if(irc.serverData[server].my_nick == oldNick) {
			irc.serverData[server].my_nick = newNick;

			let activeBuf = this.getActiveBuffer();

			if(activeBuf.server == server) {
				activeBuf.my_nickname.innerHTML = newNick;
			}
		}

		for(let i in buffers) {
			let buffer = buffers[i];

			if(buffer.type != "channel") continue;
			if(buffer.nicklist.getNickIndex(oldNick) == null) continue;

			buffer.nicklist.nickChange(oldNick, newNick);
			buffer.addMessage(oldNick+" is now known as "+newNick, null, "nick");
		}
	}

	topicChange(channel, server, topic, changer) {
		let buf = this.getBufferByServerName(server, channel);
		
		if (!buf) return;

		buf.topicChange(topic);
		if(changer)
			buf.addMessage(changer+" set the topic of "+channel+ " to \""+topic+"\"", null, "topic");
		else
			buf.addMessage("Topic of "+channel+ " is \""+topic+"\"", null, "topic");
	}

	handleQuit(server, user, reason) {
		let buffers = this.getBuffersByServer(server);

		for(let i in buffers) {
			let buffer = buffers[i];

			if(buffer.type != "channel") continue;
			if(buffer.nicklist.getNickIndex(user.nickname) == null) continue;

			buffer.nicklist.nickRemove(user.nickname);
			buffer.addMessage("<span class='hostmask'>"+user.username+"@"+user.hostname+
							  "</span> has quit <span class='reason'>"+reason+"</span>", user.nickname, "quit");
		}
	}

	handleJoin(server, user, channel) {
		let buffer = this.getBufferByServerName(server, channel);

		if(!buffer) return;

		buffer.addMessage("<span class='hostmask'>"+user.username+"@"+user.hostname+"</span> has joined "+channel, user.nickname, "join");
		buffer.nicklist.nickAdd(user.nickname);
	}

	handleLeave(server, user, channel, reason, kicker) {
		let buffer = this.getBufferByServerName(server, channel);

		if(!buffer) return;

		if(kicker)
			buffer.addMessage("has kicked "+user+" <span class='reason'>"+reason+"</span>", kicker.nickname, "part");
		else
			buffer.addMessage("<span class='hostmask'>"+user.username+"@"+user.hostname+"</span> has left"+
								channel+(reason != null ? "&nbsp;<span class='reason'>"+reason+"</span>" : ""), user.nickname, "part");
		if(kicker)
			buffer.nicklist.nickRemove(user);
		else
			buffer.nicklist.nickRemove(user.nickname);
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
	irc.primaryFrame = document.querySelector('.ircclient');

	clientdom.connector['frame'] = irc.primaryFrame.querySelector('#authdialog');
	clientdom.connector['messenger'] = clientdom.connector.frame.querySelector('#connmsg');
	clientdom.connector['form'] = clientdom.connector.frame.querySelector('#IRCConnector');
	clientdom.connector['nickname'] = clientdom.connector.form.querySelector('#nickname');
	clientdom.connector['channel'] = clientdom.connector.form.querySelector('#channel');
	clientdom.connector['server'] = clientdom.connector.form.querySelector('#server');
	clientdom.connector['port'] = clientdom.connector.form.querySelector('#port');
	clientdom['tabby'] = irc.primaryFrame.querySelector('.tabby')
	clientdom['frame'] = irc.primaryFrame.querySelector('#chat');
	clientdom['letterbox'] = clientdom.frame.querySelector('.letterbox');
	clientdom['nicklist'] = clientdom.frame.querySelector('.nicklist');
	clientdom['currentNickname'] = clientdom.frame.querySelector('.my_nickname');
	clientdom['input'] = clientdom.frame.querySelector('.userinput');
	clientdom['send'] = clientdom.frame.querySelector('.sendbutton');
	clientdom['chat'] = clientdom.frame.querySelector('.chatarea');
	clientdom['topicbar'] = clientdom.chat.querySelector('.topicbar');
	clientdom['smsctrig'] = clientdom.chat.querySelector('.smsc-nicklistbtn');

	irc.socket = io.connect();

	irc.auther = new IRCConnector();
	irc.chat = new IRCChatWindow();

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
				if(data.user.nickname == irc.serverData[data.server].my_nick)
					irc.chat.createBuffer(data.server, data.channel, "channel", true);
				irc.chat.handleJoin(data.server, data.user, data.channel);
				break;
			case "event_kick_channel":
				irc.chat.handleLeave(data.server, data.kickee, data.channel, data.reason, data.user);
				break;
			case "event_part_channel":
				irc.chat.handleLeave(data.server, data.user, data.channel, data.reason);
				break;
			case "event_quit":
				irc.chat.handleQuit(data.server, data.user, data.reason);
				break;
			case "message":
				if(data.to == irc.serverData[data.server].my_nick)
					irc.chat.messageBuffer(data.user.nickname, data.server, {message: data.message, type: data.messageType, from: data.user.nickname});
				else
					irc.chat.messageBuffer(data.to, data.server, {message: data.message, type: data.messageType, from: data.user.nickname});
				break;
			case "channel_nicks":
				irc.chat.buildNicklist(data.channel, data.server, data.nicks);
				break;
			case "channel_topic":
				if(data['topic'] && data['set_by'])
					irc.chat.topicChange(data.channel, data.server, data.topic, data['set_by']);
				else if(data['topic'])
					irc.chat.topicChange(data.channel, data.server, data.topic, null);
				else if(data['set_by'])
					irc.chat.messageBuffer(data.channel, data.server, {message: "Topic set by "+data.set_by+" on "+new Date(data.time*1000), type: "topic", from: null});
				break;
			case "nick_change":
				irc.chat.nickChange(data.server, data.nick, data.newNick);
				break;
			case "server_message":
				if(data['error']) data.messageType = "error";
				if(irc.chat.getBuffersByServer(data.server).length == 0) {
					if(!irc.serverChatQueue[data.server]) {
						irc.serverChatQueue[data.server] = [];
					} else {
						irc.serverChatQueue[data.server].push({type: data.messageType, message: data.message, from: data.from || null, time: new Date()});
					}
				} else {
					irc.chat.messageBuffer(data.server, data.server, {message: data.message, type: data.messageType, from: data.from || null});
				}
				break;
			case "connect_message":
				irc.auther.authMessage(data.message, data.error);
				break;
		}
	});
}
