window.irc = {
	socketUp: false,
	primaryFrame: null,
	timestamps: true,
	timestampFormat: "HH:mm:ss",
	serverData: {},
	serverChatQueue: {},
	chatType: "simple",
};

window.clientdom = {connector: {}};

window.colorizer = {
	theme: {
		H: [1, 360],
		S: [30, 100],
		L: [30, 70]
	},
	get_random_color: function(nickname) {
		Math.seedrandom(nickname);
		let h = rand(colorizer.theme.H[0], colorizer.theme.H[1]); // color hue between 1 and 360
		let s = rand(colorizer.theme.S[0], colorizer.theme.S[1]); // saturation 30-100%
		let l = rand(colorizer.theme.L[0], colorizer.theme.L[1]); // lightness 30-70%
		return 'hsl(' + h + ',' + s + '%,' + l + '%)';
	}
}

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

irc.whoisMessage = function(whoisData, buffer) {
	let messages = [];
	for(let key in whoisData) {
		switch(key) {
			case "hostmask":
				messages.push("<span class='hostmask'>"+whoisData[key]+"</span>: "+whoisData['realname']);
				break;
			case "idleSeconds":
				let msgs = "is idle for "+whoisData[key]+" seconds";
				if(whoisData['signonTime'])
					msgs += ", signed on at "+new Date(parseInt(whoisData['signonTime'])*1000);
				messages.push(msgs);
				break;
			case "loggedIn":
			case "registered":
			case "title":
				messages.push(whoisData[key]);
				break;
			case "channels":
				messages.push(whoisData[key].join(" "));
				break;
			case "server":
				let adfd = "is on <span class='server nick'>"+whoisData[key]+"</span>";
				if(whoisData['server_name'])
					adfd += "&nbsp;<span class='hostmask'>"+whoisData['server_name']+"</span>";
				messages.push(adfd);
				break;
			case "secure":
				messages.push("is using a secure connection.");
				break;
			case "bot":
				messages.push("is a bot on "+irc.serverData[buffer.server].network);
				break;
		}
	}

	for(let i in messages) {
		let mesg = "[<span class='nick'>"+whoisData.nickname+"</span>]&nbsp;"+messages[i];
		buffer.addMessage(mesg, null, "whois");
	}
}

function rand(min, max) {
    return parseInt(Math.random() * (max-min+1), 10) + min;
}

if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != undefined ? args[number] : match;
		});
	};
}

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

function objectGetKey(obj, value) {
	let key = null;
	for(let f in obj) {
		if(obj[f] == value)
			key = f;
	}
	return key;
}

let composer = {
	message: {
		simple: function(time, sender, message, type) {
			let element = document.createElement('div');
			element.className = "message type_simple m_"+type;

			if(irc.timestamps)
				element.innerHTML += "<span class='timestamp'>"+time.format(irc.timestampFormat)+"</span>&nbsp;";

			message = colorizer.stylize(message);
			message = linkify(message);

			switch(type) {
				case "mode":
				case "action":
					element.innerHTML += "<span class='asterisk'>*</span>&nbsp;<span class='actionee nick'>"+sender+"</span>&nbsp;";
					element.innerHTML += "<span class='content'>"+message+"</span>";
					break;
				case "part":
				case "quit":
				case "kick":
					element.innerHTML += "<span class='arrowout'>&#11013;</span>&nbsp;<span class='content'><span class='actionee nick'>"+sender+"</span>";
					element.innerHTML += "&nbsp;"+message+"</span>";
					break;
				case "join":
					element.innerHTML += "<span class='arrowin'>&#10145;</span>&nbsp;<span class='content'><span class='actionee nick'>"+sender+"</span>";
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

			if(sender) {
				let sndr1 = element.querySelector('.sender');
				if(sndr1)
					sndr1.style.color = colorizer.get_random_color(sndr1.innerHTML);
			}

			let sndr2 = element.querySelectorAll('.nick');
			if(sndr2.length > 0)
				for(let a in sndr2)
					if(sndr2[a] && sndr2[a]['style'])
						sndr2[a].style.color = colorizer.get_random_color(sndr2[a].innerHTML);
			
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

		let modeTranslations = irc.serverData[this.buffer.server].modeTranslation;
		let prefixes = irc.serverData[this.buffer.server].supportedPrefixes;

		nick.modes.push(newMode);

		for(let mode in modeTranslations) {
			let prefix = modeTranslations[mode];
			if(nick.modes.indexOf(mode) == -1) continue;
			let a = nick.modes.indexOf(mode) - 1;
			if(a >= 0) {
				if(prefixes.indexOf(modeTranslations[nick.modes[a]]) < prefixes.indexOf(prefix)) {
					nick.prefix = modeTranslations[nick.modes[a]];
					break;
				}
			} else {
				nick.prefix = prefix;
				break;
			}
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

		let modeTranslations = irc.serverData[this.buffer.server].modeTranslation;
		let prefixes = irc.serverData[this.buffer.server].supportedPrefixes;

		remove_str(nick.modes, oldMode);

		let currentLowest = "";

		for(let n in nick.modes) {
			let mode = nick.modes[n];
			let nextMode = nick.modes[n+1];
			if(!nextMode && mode) {
				currentLowest = modeTranslations[mode];
				break;
			} else if(nextMode) {
				if(prefixes.indexOf(modeTranslations[nextMode]) > prefixes.indexOf(modeTranslations[mode]))
					currentLowest = modeTranslations[nextMode];
			} else {
				break;
			}
		}

		nick.prefix = currentLowest;

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
		ttt.setAttribute('id', 'tab-'+this.buffer.name);
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

	setTitle(title) {
		let titleEl = this.element.querySelector('#title');
		if(titleEl)
			titleEl.innerHTML = title;
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
		this.wasAtBottom = false;
		this.unreadCount = 0;

		this.server = servername;
		this.name = buffername;
		this.title = tabname;
		this.type = type;
		this.active = false;
		this.alive = true;

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
			clientdom.topicbar.innerHTML = linkify(colorizer.stylize(this.topic));
		}

		this.renderMessages();
		if(this.wasAtBottom)
			clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
		else
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

		if((meta.type == "privmsg" || meta.type == "notice") && meta.message.indexOf(irc.serverData[this.server].my_nick) != -1)
			addClass(mesgConstr, "mentioned");

		clientdom.letterbox.appendChild(mesgConstr);

		let lFactor = clientdom.letterbox.offsetHeight + clientdom.letterbox.scrollTop
		if(lFactor > clientdom.letterbox.scrollHeight - 100)
			clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
	}

	topicChange(topic) {
		if(this.active) {
			clientdom.topicbar.innerHTML = linkify(colorizer.stylize(topic));

			if(this.topic == null)
				addClass(clientdom.chat, "vtopic");
		}
		this.topic = topic;
	}

	addMessage(message, sender, type, time) {
		let mesg = {message: message, sender: sender, type: type, time: time || new Date()}
		this.messages.push(mesg);

		if(this.active) {
			this.appendMessage(mesg);
		} else {
			this.unreadCount += 1;
			if((type == "privmsg" || type == "notice") && message.indexOf(irc.serverData[this.server].my_nick) != -1)
				console.log("TODO: notify user of mentioned");
		}

		this.tab.setUnreadCount(this.unreadCount);
	}

	switchOff() {
		let lFactor = clientdom.letterbox.offsetHeight + clientdom.letterbox.scrollTop
		if(lFactor > clientdom.letterbox.scrollHeight - 100)
			this.wasAtBottom = true;
		else
			this.wasAtBottom = false;

		this.tab.setActive(false);
		this.lastscroll = clientdom.letterbox.scrollTop;
		this.active = false;
	}

	setAliveStatus(status) {
		this.alive = status;
		if(this.alive)
			this.tab.setTitle(this.title);
		else
			this.tab.setTitle('<i>('+this.title+')</i>');
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

			this.validateForm(e);
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
		if(error)
			this.formLocked = false;
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

		if(listargs[0].indexOf('/') == 0) {
			let cmd = listargs[0].substring(1).toLowerCase();
			switch(cmd) {
				case "join":
					if (!listargs[1]) {
						if(!buf.alive) {
							irc.socket.emit("userinput", {command: "join", server: buf.server, message: "", arguments: [buf.name]});
						} else {
							this.commandError(buf, listargs[0].toUpperCase()+': Missing parameters!');
						}
					} else {
						irc.socket.emit("userinput", {command: "join", server: buf.server, message: "", arguments: [listargs[1]]});
					}
					break;
				case "part":
					if (!listargs[1] && buf.type == "channel") {
						irc.socket.emit("userinput", {command: "part", server: buf.server, message: "", arguments: [buf.name]});
					} else if(buf.type != "channel") {
						this.commandError(buf, listargs[0].toUpperCase()+': Buffer is not a channel.');
					} else if(listargs[1]) {
						if(listargs[1].indexOf('#')) {
							let msg = "";
							if(listargs[2])
								msg = listargs.slice(2).join(" ");
							irc.socket.emit("userinput", {command: "part", server: buf.server, message: msg, arguments: [listargs[1]]});
						} else {
							if(buf.type == "channel") {
								irc.socket.emit("userinput", {command: "part", server: buf.server, message: listargs.slice(1).join(" "), arguments: [buf.name]});
							} else {
								this.commandError(buf, listargs[0].toUpperCase()+': Buffer is not a channel.');
							}
						}
					}
					break;
				case "msg":
				case "privmsg":
				case "say":
					if(!listargs[1] || !listargs[2])
						return this.commandError(buf, listargs[0].toUpperCase()+': Missing parameters!');
					if(listargs[1] == '*')
						listargs[1] = buf.name;
					irc.socket.emit("userinput", {command: "privmsg", server: buf.server, message: listargs.slice(2).join(" "), arguments: [listargs[1]]});
					break;
				case "notice":
					if(!listargs[1] || !listargs[2])
						return this.commandError(buf, listargs[0].toUpperCase()+': Missing parameters!');
					if(listargs[1] == '*')
						listargs[1] = buf.name;
					irc.socket.emit("userinput", {command: "notice", server: buf.server, message: listargs.slice(2).join(" "), arguments: [listargs[1]]});
					break;
				case "me":
				case "action":
					irc.socket.emit("userinput", {command: "privmsg", server: buf.server, message: "\x01ACTION "+inp.substring(cmd.length+2)+"\x01", arguments: [buf.name]});
					break;
				case "nick":
				case "list":
					irc.socket.emit("userinput", {command: cmd, server: buf.server, message: "", arguments: listargs.splice(1)});
					break;
				case "quote":
				case "raw":
					irc.socket.emit("userinput", {command: listargs[1], server: buf.server, message: listargs.slice(2).join(" "), arguments: listargs.splice(2)});
					break;
				case "whois":
					if(!listargs[1])
						return this.commandError(buf, listargs[0].toUpperCase()+': Missing parameters!');

					irc.socket.emit("userinput", {command: "whois", server: buf.server, message: "", arguments: [listargs[1]]});
					break;
				default:
					this.commandError(buf, listargs[0].toUpperCase()+': Unknown command!');
			}
		} else {
			irc.socket.emit("userinput", {command: "privmsg", server: buf.server, message: inp, arguments: [buf.name]});
		}

		this.history.push(inp);
		clientdom.input.value = "";
	}

	commandError(buffer, message) {
		buffer.addMessage(message, null, "error");
		return true;
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

	getServerBuffer(server) {
		let result = null;
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.server == server)
				result = buf;
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
			my_nick: serverinfo.nickname,
			max_channel_length: serverinfo.max_channel_length
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
		if(buffer.type == "channel" && buffer.alive)
			irc.socket.emit("userinput", {command: "part", server: buffer.server, message: "Tab closed", arguments: [buffer.name]});
		
		let bufIndex = this.buffers.indexOf(buffer);

		if(buffer.active) {
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

		if(message.type == "privmsg" && message.message.indexOf('\x01ACTION') == 0) {
			message.message = message.message.substring(8);
			message.type = "action";
		} 

		buf.addMessage(message.message, message.from, message.type);
	}

	buildNicklist(channel, server, nicks) {
		let buf = this.getBufferByServerName(server, channel);

		if(buf == null)
			return;

		for(let n in nicks) {
			let nick = {nickname: "", prefix: "", modes: []};

			if(irc.serverData[buf.server].supportedPrefixes.split('').indexOf(nicks[n].substring(0, 1)) != -1) {
				nick.prefix = nicks[n].substring(0, 1);
				nick.nickname = nicks[n].substring(1);
				nick.modes = [objectGetKey(irc.serverData[buf.server].modeTranslation, nick.prefix)];
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
				clientdom.currentNickname.innerHTML = newNick;
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

		if(user.nickname == irc.serverData[server].my_nick)
			buffer.setAliveStatus(true);

		buffer.addMessage("<span class='hostmask'>"+user.username+"@"+user.hostname+"</span> has joined "+channel, user.nickname, "join");
		buffer.nicklist.nickAdd(user.nickname);
	}

	handleLeave(server, user, channel, reason, kicker) {
		let buffer = this.getBufferByServerName(server, channel);

		if(!buffer) return;

		if(user['nickname']) {
			if(user.nickname == irc.serverData[server].my_nick)
				buffer.setAliveStatus(false);
		} else {
			if(user == irc.serverData[server].my_nick)
				buffer.setAliveStatus(false);
		}

		if(kicker)
			buffer.addMessage("has kicked <span class='nick'>"+user+"</span> <span class='reason'>"+reason+"</span>", kicker.nickname, "part");
		else
			buffer.addMessage("<span class='hostmask'>"+user.username+"@"+user.hostname+"</span> has left "+
								channel+(reason != null ? "&nbsp;<span class='reason'>"+reason+"</span>" : ""), user.nickname, "part");
		if(kicker)
			buffer.nicklist.nickRemove(user);
		else
			buffer.nicklist.nickRemove(user.nickname);
	}

	handleMode(data) {
		let buf = null;
		if(data.target == irc.serverData[data.server].my_nick)
			buf = this.getServerBuffer(data.server);
		else
			buf = this.getBufferByServerName(data.server, data.target);

		if(!buf) return;

		if(data.type == "mode_add") {
			buf.nicklist.modeAdded(data.modeTarget, data.mode);
			buf.addMessage("set mode <span class='channel'>"+data.target+"</span> <span class='mode'>+"+data.mode+" "+
							data.modeTarget+"</span>", data.user.nickname, "mode");
		} else if(data.type == "mode_del") {
			buf.nicklist.modeRemoved(data.modeTarget, data.mode);
			buf.addMessage("set mode <span class='channel'>"+data.target+"</span> <span class='mode'>-"+data.mode+" "+
							data.modeTarget+"</span>", data.user.nickname, "mode");
		} else {
			buf.addMessage("set mode <span class='channel'>"+data.target+"</span> <span class='mode'>"+data.message+"</span>", 
							data.user.nickname, "mode");
		}
	}

	joinChannels(server, channel) {
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

		irc.socket.emit("userinput", {command: "join", server: server, message: "", arguments: channel});
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
				if(data.to == irc.serverData[data.server].my_nick) {
					irc.chat.messageBuffer(data.user.nickname, data.server, {message: data.message, type: data.messageType, from: data.user.nickname});
				} else if(data.to == null) {
					let atest = irc.chat.getActiveBuffer();

					if(atest.server != data.server)
						atest = irc.chat.getServerBuffer(data.server);

					atest.addMessage(data.message, data.user.nickname, data.messageType);
				} else {
					irc.chat.messageBuffer(data.to, data.server, {message: data.message, type: data.messageType, from: data.user.nickname});
				}
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
			case "mode_add":
			case "mode_del":
			case "mode":
				irc.chat.handleMode(data);
				break;
			case "server_message":
				if(data['error']) data.messageType = "error";
				if(irc.chat.getServerBuffer(data.server) == null) {
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
			case "whoisResponse":
				irc.whoisMessage(data.whois, irc.chat.getActiveBuffer());
				break;
			case "listedchan":
				irc.chat.messageBuffer(data.server, data.server, {message: "<span class='channel'>"+data.channel+"</span>"+
						"&nbsp<span class='usercount'>"+data.users+"</span>&nbsp;<span class='topic'>"+data.topic+"</span>", 
						type: "listentry", from: data.from});
				break;
		}
	});
}
