window.irc = {
	socketUp: false,
	primaryFrame: null,
	config: {
		colors: true,
		sharedInput: false,
		timestamps: true,
		timestampFormat: "HH:mm:ss",
		colorNicknames: true,
		colorNicklist: false,
		scrollOnResize: true,
		scrollOnFocus: true,
		theme: "default"
	},
	serverData: {},
	serverChatQueue: {},
	chatType: "simple",
	documentTitle: "TeemantIRC",
};

window.clientdom = {connector: {}, settings: {}};

window.colorizer = {
	get_random_color: function(nickname) {
		let themefunc = window.themes.available[irc.config.theme].nick_pallete;

		Math.seedrandom(nickname);
		let h = rand(themefunc.H[0], themefunc.H[1]);
		let s = rand(themefunc.S[0], themefunc.S[1]);
		let l = rand(themefunc.L[0], themefunc.L[1]);
		return 'hsl(' + h + ',' + s + '%,' + l + '%)';
	},
	strip: function(message) {
		return message.replace(/(\x03\d{0,2}(,\d{0,2})?)/g, '').replace(/[\x0F\x02\x16\x1F]/g, '');
	}
}

let urlParams = {};

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

window.validators.escapeHTML = function(str) {
	return str.replace(/\</g, '&lt;').replace(/\>/, '&gt;');
}

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
				messages.push("<span class='hostmask'>"+whoisData[key]+"</span>: "+validators.escapeHTML(whoisData['realname']));
				break;
			case "idleSeconds":
				let msgs = "is idle for "+whoisData[key]+" seconds";
				if(whoisData['signonTime'])
					msgs += ", signed on at "+new Date(parseInt(whoisData['signonTime'])*1000);
				messages.push(msgs);
				break;
			case "loggedIn":
			case "registered":
			case "connectingFrom":
			case "usingModes":
			case "title":
				messages.push(validators.escapeHTML(whoisData[key]));
				break;
			case "channels":
				messages.push(whoisData[key].join(" "));
				break;
			case "server":
				let adfd = "is on <span class='server nick'>"+whoisData[key]+"</span>";
				if(whoisData['server_name'])
					adfd += "&nbsp;<span class='hostmask'>"+validators.escapeHTML(whoisData['server_name'])+"</span>";
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

function remove_str(arr, str) {
	let index = arr.indexOf(str);

	if(index > -1) {
		arr.splice(index, 1);
		return arr;
	}
	return arr;
};

function grep(items, callback) {
	let filtered = [];
	for (let i in items) {
		let item = items[i];
		let cond = callback(item);
		if (cond) {
			filtered.push(item);
		}
	}

	return filtered;
};

function match(word, array) {
	return grep(
		array,
		function(w) {
			return w.toLowerCase().indexOf(word.toLowerCase()) == 0;
		}
	);
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
		return '<a href="' + href + '" target="_blank" rel="nofollow">' + url + '</a>';
	});
	return parsed;
}

function removeClass(element, cl) {
	let classList = element.className.split(" ");

	if(classList.indexOf(cl) != -1)
		classList.splice(classList.indexOf(cl), 1);
	
	element.className = classList.join(" ");
}

function addClass(element, cl) {
	let classList = element.className.split(" ");
	
	if(classList.indexOf(cl) != -1)
		return;

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

			if(irc.config.timestamps)
				element.innerHTML += "<span class='timestamp'>"+time.format(irc.config.timestampFormat)+"</span>&nbsp;";

			if(irc.config.colors)
				message = colorizer.stylize(message);
			else
				message = colorizer.strip(message);

			message = linkify(message);

			switch(type) {
				case "mode":
					element.innerHTML += "<span class='asterisk'>&#8505;</span>&nbsp;<span class='actionee nick'>"+sender+"</span>&nbsp;";
					element.innerHTML += "<span class='content'>"+message+"</span>";
					break;
				case "action":
					element.innerHTML += "<span class='asterisk'>&#9889;</span>&nbsp;<span class='actionee nick'>"+sender+"</span>&nbsp;";
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
				case "ctcp_response":
					element.innerHTML += "<span class='asterisk'>&#8505;</span>&nbsp;CTCP response from <span class='actionee nick'>"+sender+"</span>&nbsp;";
					element.innerHTML += "<span class='content'>"+message+"</span>";
					break;
				case "ctcp_request":
					element.innerHTML += "<span class='asterisk'>&#8505;</span>&nbsp;CTCP request to <span class='actionee nick'>"+sender+"</span>&nbsp;";
					element.innerHTML += "<span class='content'>"+message+"</span>";
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

			if(irc.config.colorNicknames == true) {
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
			}
			return element;
		}
	},
	theme_selection: function(name, theme) {
		let btn = document.createElement('div');
		btn.className = "theme_button theme_"+theme.type;
		let sampler = document.createElement('div');
		sampler.className = "sampler";
		sampler.style['background-color'] = theme.colorSamples.background;
		let toolbar = document.createElement('span');
		toolbar.className = "s_toolbar";
		toolbar.style['background-color'] = theme.colorSamples.toolbar;
		let nameb = document.createElement('span');
		nameb.className = "name";
		nameb.innerHTML = theme['name'];
		sampler.appendChild(toolbar);
		btn.appendChild(sampler);
		btn.appendChild(nameb);
		btn.setAttribute('id', 'theme-'+name);

		return btn;
	}
}

/*****************************\
|**                         **|
|**     CLIENT COMMANDS     **|
|**                         **|
\*****************************/

// commandName: {execute: function(buffer, handler, command, message, listargs) {}, description: ""}
let commands = {
	join: {execute: function(buffer, handler, command, message, listargs) {
		if (!listargs[1]) {
			if(!buffer.alive) {
				irc.socket.emit("userinput", {command: "join", server: buffer.server, message: "", arguments: [buffer.name]});
			} else {
				handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');
			}
		} else {
			irc.socket.emit("userinput", {command: "join", server: buffer.server, message: "", arguments: [listargs[1]]});
		}
	}, description: "<channel> - Join a channel"}, 

	part: {execute: function(buffer, handler, command, message, listargs) {
		if (!listargs[1] && buffer.type == "channel") {
			irc.socket.emit("userinput", {command: "part", server: buffer.server, message: "", arguments: [buffer.name]});
		} else if(buffer.type != "channel") {
			handler.commandError(buffer, listargs[0].toUpperCase()+': Buffer is not a channel.');
		} else if(listargs[1]) {
			if(listargs[1].indexOf('#') != -1) {
				let msg = "";
				if(listargs[2])
					msg = listargs.slice(2).join(" ");
				irc.socket.emit("userinput", {command: "part", server: buffer.server, message: msg, arguments: [listargs[1]]});
			} else {
				if(buffer.type == "channel") {
					irc.socket.emit("userinput", {command: "part", server: buffer.server, message: listargs.slice(1).join(" "), arguments: [buffer.name]});
				} else {
					handler.commandError(buffer, listargs[0].toUpperCase()+': Buffer is not a channel.');
				}
			}
		}
	}, description: "[<#channel>|<message>] [message] - Leave the channel. If no channel specified, leave the current buffer.", aliases: ['leave']},

	topic: {execute: function(buffer, handler, command, message, listargs) {
		if (!listargs[1] && buffer.type == "channel") {
			irc.socket.emit("userinput", {command: "topic", server: buffer.server, message: "", arguments: [buffer.name]});
		} else if(buffer.type != "channel") {
			handler.commandError(buffer, listargs[0].toUpperCase()+': Buffer is not a channel.');
		} else if(listargs[1]) {
			if(listargs[1].indexOf('#') != -1) {
				let msg = "";
				if(listargs[2])
					msg = listargs.slice(2).join(" ");
				irc.socket.emit("userinput", {command: "topic", server: buffer.server, message: msg, arguments: [listargs[1]]});
			} else {
				if(buffer.type == "channel") {
					irc.socket.emit("userinput", {command: "topic", server: buffer.server, message: listargs.slice(1).join(" "), arguments: [buffer.name]});
				} else {
					handler.commandError(buffer, listargs[0].toUpperCase()+': Buffer is not a channel.');
				}
			}
		}
	}, description: "[<#channel>|<topic>] [topic] - Sets/prints the current topic of the channel.", aliases: ['t']},

	kick: {execute: function(buffer, handler, command, message, listargs) {
		if(buffer.type != "channel")
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Buffer is not a channel!');
		if(!listargs[1])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameter <user>!');
		irc.socket.emit("userinput", {command: "kick", server: buffer.server, message: listargs.slice(2).join(" "), arguments: [buffer.name, listargs[1]]});
	}, description: "<user> <message> - Kick the following user from the channel."},

	quit: {execute: function(buffer, handler, command, message, listargs) {
		irc.socket.emit("userinput", {command: "quit", server: buffer.server, message: listargs.slice(1).join(" "), arguments: []});
	}, description: "[<message>] - Quit the current server with message.", aliases: ['exit']},

	mode: {execute: function(buffer, handler, command, message, listargs) {
		irc.socket.emit("userinput", {command: "mode", server: buffer.server, message: listargs.slice(1).join(" "), arguments: []});
	}, description: "[target] [mode] - Set/remove mode of target."},

	msg: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1] || !listargs[2])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');
		if(listargs[1] == '*')
			listargs[1] = buffer.name;
		irc.socket.emit("userinput", {command: "privmsg", server: buffer.server, message: listargs.slice(2).join(" "), arguments: [listargs[1]]});
	}, description: "<target> <message> - Sends a message to target.", aliases: ['privmsg', 'q', 'query', 'say']},

	ctcp: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1] || !listargs[2])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');
		if(listargs[1] == '*')
			listargs[1] = buffer.name;
		
		listargs[2] = listargs[2].toUpperCase();

		irc.socket.emit("userinput", {command: "ctcp", server: buffer.server, message: listargs.slice(2).join(" "), arguments: listargs.slice(1)});
	}, description: "<target> <type> [arguments] - Sends a CTCP request to target."},

	notice: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1] || !listargs[2])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');
		if(listargs[1] == '*')
			listargs[1] = buffer.name;
		irc.socket.emit("userinput", {command: "notice", server: buffer.server, message: listargs.slice(2).join(" "), arguments: [listargs[1]]});
	}, description: "<target> <message> - Sends a NOTICE to target."},

	action: {execute: function(buffer, handler, command, message, listargs) {
		irc.socket.emit("userinput", {command: "privmsg", server: buffer.server, message: "\x01ACTION "+message.substring(command.length+2)+"\x01", arguments: [buffer.name]});
	}, description: "<message> - 'act' as yourself", aliases: ['me']},

	list: {execute: function(buffer, handler, command, message, listargs) {
		irc.socket.emit("userinput", {command: "list", server: buffer.server, message: "", arguments: listargs.splice(1)});
	}, description: "- List all channels on the current server."},

	nick: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1]) {
			if(buffer.server != '') {
				let mynick = irc.serverData[buffer.server].my_nick;
				buffer.addMessage("Your nickname is: <span class='nick'>"+mynick+"</span>", null, "help");
			}
			return;
		}
		irc.socket.emit("userinput", {command: "nick", server: buffer.server, message: "", arguments: listargs.splice(1)});
	}, description: "- List all channels on the current server.", aliases: ['nickname']},

	names: {execute: function(buffer, handler, command, message, listargs) {
		let channel = "";
		if(!listargs[1]) {
			if(buffer.type == 'channel')
				channel = buffer.name;
			else
				return handler.commandError(buffer, '/'+cmd.toUpperCase()+': Buffer is not a channel!');
		} else if(listargs[1].indexOf('#') == 0) {
			channel = listargs[1];
		} else {
			return handler.commandError(buffer, '/'+cmd.toUpperCase()+': Invalid channel name!');
		}
		irc.socket.emit("userinput", {command: "names", server: buffer.server, message: "", arguments: [channel]});
	}, description: "- List all users on the current channel.", aliases: ['nicknames']},

	quote: {execute: function(buffer, handler, command, message, listargs) {
		irc.socket.emit("userinput", {command: listargs[1], server: buffer.server, message: listargs.slice(2).join(" "), arguments: listargs.splice(2)});
	}, description: "<command> [args] - Send a raw command to the server.", aliases: ['raw']},

	whois: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');

		irc.socket.emit("userinput", {command: "whois", server: buffer.server, message: "", arguments: [listargs[1]]});
	}, description: "<nickname> - Display information about a user."},

	connect: {execute: function(buffer, handler, command, message, listargs) {
		clientdom.connector.frame.style.display = "block";
		irc.auther.authMessage("Create a new connection", false);
		irc.auther.canClose = true;
	}, description: "- Create a new connection."},

	help: {execute: function(buffer, handler, command, message, listargs) {
		if(!listargs[1])
			return handler.commandError(buffer, listargs[0].toUpperCase()+': Missing parameters!');

		let cmd = listargs[1].toLowerCase();
		if(cmd.indexOf('/') === 0)
			cmd = cmd.substring(1);

		if(cmd in commands) {
			if("description" in commands[cmd])
				buffer.addMessage("<span class='command'>/"+cmd.toUpperCase()+"</span>&nbsp;"+
					validators.escapeHTML(commands[cmd].description), null, "help");
			else
				buffer.addMessage("<span class='command'>/"+cmd.toUpperCase()+"</span> - No description provided", null, "help");
		} else {
			let foundAliased = null;
			for(let cmd2 in commands) {
				if(!commands[cmd2]['aliases']) continue;
				if(commands[cmd2].aliases.indexOf(cmd) != -1) foundAliased = cmd2;
			}
			if(foundAliased) {
				if("description" in commands[foundAliased])
					buffer.addMessage("<span class='command'>/"+cmd.toUpperCase()+"</span>&nbsp;"+
						validators.escapeHTML(commands[foundAliased].description), null, "help");
				else
					buffer.addMessage("<span class='command'>/"+cmd.toUpperCase()+"</span> - No description provided", null, "help");
			} else {
				handler.commandError(buffer, '/'+cmd.toUpperCase()+': Unknown command!');
			}
		}
	}, description: "<command> - Display help for command"},

	clear: {execute: function(buffer, handler, command, message, listargs) {
		buffer.clearMessages();
	}, description: "- Clears the current buffer."}
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
		this.simplifiedNicksList = [];
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

		if(irc.config.colorNicklist)
			construct += "<span class='nickname' style='color: "+colorizer.get_random_color(nick.nickname)+";'>"+nick.nickname+"</span>";
		else
			construct += "<span class='nickname'>"+nick.nickname+"</span>";

		str.innerHTML = construct;
		clientdom.nicklist.appendChild(str);
	}

	render() {
		if(!this.buffer.active) return;
		clientdom.nicklist.innerHTML = "";
		this.simplifiedNicksList = [];
		this.sort();

		for(let n in this.nicks) {
			let nick = this.nicks[n];
			this.simplifiedNicksList.push(nick.nickname);
			this.appendToList(nick);
		}

		irc.chat.input_handler.searchNicknames = this.simplifiedNicksList;
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
		remove_str(this.simplifiedNicksList, nickname);
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

		ttt.innerHTML += "<span id='close'>x</span>"
		ttt.querySelector('#close').addEventListener('click', () => {
			this.close();
		}, false);

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

		if(type != "applet") {
			this.tab = new Tab(this);
			this.tab.renderTab();
		}

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

		if(!irc.config.sharedInput)
			clientdom.input.value = this.input;

		if(this.nicklist) {
			addClass(clientdom.chat, 'vnicks');
			this.nicklist.render();
		}

		if(this.topic != null && this.topic != "") {
			addClass(clientdom.chat, 'vtopic');
			if(irc.config.colors)
				clientdom.topicbar.innerHTML = linkify(colorizer.stylize(this.topic));
			else
				clientdom.topicbar.innerHTML = linkify(colorizer.strip(this.topic));
		}

		this.renderMessages();
		if(this.wasAtBottom)
			clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
		else
			clientdom.letterbox.scrollTop = this.lastscroll;

		clientdom.currentNickname.innerHTML = irc.serverData[this.server].my_nick;

		irc.chat.changeTitle("TeemantIRC - "+this.title);
	}

	renderMessages() {
		if(!this.active) return;

		clientdom.letterbox.innerHTML = "";

		for(let t in this.messages) {
			let mesg = this.messages[t];
			this.appendMessage({message: mesg.message, sender: mesg.sender, type: mesg.type, time: mesg.time});
		}
	}

	clearMessages() {
		this.messages = [];

		if(this.active)
			clientdom.letterbox.innerHTML = "";
	}

	appendMessage(meta) {
		let mesgConstr = composer.message[irc.chatType](meta.time, meta.sender, meta.message, meta.type);

		if(irc.serverData[this.server]) {
			let mynick = irc.serverData[this.server].my_nick;
			if((meta.type == "privmsg" || meta.type == "notice" || meta.type == "action") && 
				meta.message.toLowerCase().indexOf(mynick.toLowerCase()) != -1 && meta.sender != mynick)
				addClass(mesgConstr, "mentioned");
		}

		clientdom.letterbox.appendChild(mesgConstr);

		let lFactor = clientdom.letterbox.offsetHeight + clientdom.letterbox.scrollTop
		if(lFactor > clientdom.letterbox.scrollHeight - 100)
			clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
	}

	topicChange(topic) {
		if(this.active) {
			if(irc.config.colors)
				clientdom.topicbar.innerHTML = linkify(colorizer.stylize(topic));
			else
				clientdom.topicbar.innerHTML = linkify(colorizer.strip(topic));

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
			if(irc.serverData[this.server]) {
				let mynick = irc.serverData[this.server].my_nick;
				if((type == "privmsg" || type == "notice" || type == "action") && 
					message.toLowerCase().indexOf(mynick.toLowerCase()) != -1 && sender != mynick)
					console.log("TODO: notify user of mentioned");
			}
		}

		this.tab.setUnreadCount(this.unreadCount);
	}

	switchOff() {
		irc.chat.input_handler.searchNicknames = [];

		let lFactor = clientdom.letterbox.offsetHeight + clientdom.letterbox.scrollTop
		if(lFactor > clientdom.letterbox.scrollHeight - 100)
			this.wasAtBottom = true;
		else
			this.wasAtBottom = false;

		if(!irc.config.sharedInput)
			this.input = clientdom.input.value;

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

class ThemeSelector {
	constructor(settings, variable) {
		this.settings = settings;
		this.variable = variable;
	}

	set_active_selection(name) {
		let all = clientdom.settings.available_themes.querySelectorAll('.theme_button');
		if(all.length > 0) {
			for(let a in all) {
				if(all[a] && all[a]['className']) {
					let elem = all[a];
					if(elem.getAttribute('id') == 'theme-'+name) {
						addClass(elem, "selected");
					} else {
						removeClass(elem, "selected");
					}
				}
			}
		}
	}

	bindButton(button, theme) {
		button.onclick = (e) => {
			this.settings.themeSelection = theme;
			this.set_active_selection(theme);
		}
	}

	render() {
		clientdom.settings.available_themes.innerHTML = "";

		for(let n in window.themes.available) {
			let theme = window.themes.available[n];
			let button = composer.theme_selection(n, theme);

			clientdom.settings.available_themes.appendChild(button);

			this.bindButton(button, n);
		}
	}
}

class Settings extends Buffer {
	constructor() {
		super("", "settings", "Settings", "applet");
		this.tab = null;
		this.isOpen = false;
		this.timeout = null;

		this.themeSelection = "";

		this.themeSelector = new ThemeSelector(this);
		this.themeSelector.render();

		clientdom.settings.save.onclick = (e) => {
			this.saveSpecified();
		}

		clientdom.settings.open.onclick = (e) => {
			this.open();
		}
	}

	switch_theme() {
		if(this.themeSelection != '') {
			window.themes.change_theme(this.themeSelection);
			irc.config.theme = this.themeSelection;
			this.themeSelector.set_active_selection(this.themeSelection);
		}
	}

	open() {
		if(this.isOpen) {
			irc.chat.render(this);
			return;
		}

		this.tab = new Tab(this);
		this.tab.renderTab();
		irc.chat.buffers.push(this);
		irc.chat.render(this);
		this.isOpen = true;
	}

	closeBuffer() {
		irc.chat.closeBuffer(this);
		this.tab = null;
		this.isOpen = false;
	}

	saveSpecified() {
		if(this.timeout)
			clearTimeout(this.timeout);

		this.switch_theme();

		for(let key in irc.config) {
			let value = irc.config[key];
			let type = typeof(value);

			if(clientdom.settings[key]) {
				if(type == "boolean")
					irc.config[key] = clientdom.settings[key].checked;
				else
					irc.config[key] = clientdom.settings[key].value;
			}
		}
		clientdom.settings.saveStatus.innerHTML = "<span class='success'>Settings saved!</span>";

		if("localStorage" in window) {
			window.localStorage['teemant_settings'] = JSON.stringify(irc.config);
		}

		this.timeout = setTimeout(function() {
			clientdom.settings.saveStatus.innerHTML = "";
		}, 3000);
	}

	setInitialValues() {
		if("localStorage" in window) {
			if(window.localStorage['teemant_settings']) {
				try {
					let settings = JSON.parse(window.localStorage.teemant_settings);
					for(let key in irc.config) {
						let value = irc.config[key];
						let type = typeof(value);

						if(settings[key]) {
							if(key == 'theme') {
								this.themeSelection = settings[key];
								continue;
							}

							if(type == "boolean")
								clientdom.settings[key].checked = settings[key];
							else
								clientdom.settings[key].value = settings[key];
						}
					}
					this.saveSpecified();
					return;
				} catch(e) {}
			}
		}

		for(let key in irc.config) {
			let value = irc.config[key];
			let type = typeof(value);

			if(clientdom.settings[key]) {
				if(type == "boolean")
					clientdom.settings[key].checked = value;
				else
					clientdom.settings[key].value = value;
			}
		}
	}

	addMessage(message, sender, type, time) {
		// Don't send messages to the settings buffer
		return;
	}

	switchOff() {
		this.active = false;
		this.tab.setActive(false);
		clientdom.settings.frame.style.display = "none";
	}

	render() {
		this.active = true;
		this.tab.setActive(true);
		clientdom.chat.className = "chatarea";
		clientdom.nicklist.innerHTML = "";
		clientdom.topicbar.innerHTML = "";
		clientdom.letterbox.innerHTML = "";
		clientdom.settings.frame.style.display = "block";
		irc.chat.changeTitle("TeemantIRC - Settings");
	}
}

class IRCConnector {
	constructor() {
		this.formLocked = false;
		this.canClose = false;

		clientdom.connector.form.onsubmit = (e) => {
			if(this.formLocked) {
				e.preventDefault(); 
				return false;
			}

			this.formLocked = true;

			this.validateForm(e);
		}

		clientdom.connector.onkeyup = (e) => {
			let key = evt.keyCode || evt.which || evt.charCode || 0;
			if(key === 27 && this.canClose)
				this.authComplete();
		}

		clientdom.connector.pwtrigger.onclick = (e) => {
			this.togglePassword();
		} 
	}

	fillFormFromURI() {
		for(let param in urlParams) {
			let value = urlParams[param];

			switch(param) {
				case "nick":
				case "nickname":
					if (window.validators.nickname(value))
						clientdom.connector.nickname.value = value.replace(/\?/g, rand(10000, 99999));
					break;
				case "secure":
				case "ssl":
					if(value == "true" || value == "1")
						clientdom.connector.secure.checked = true;
					break;
				case "password":
					if(value == "true" || value == "1") {
						clientdom.connector.pwtrigger.checked = true;
						this.togglePassword();
					}
					break;
				case "server":
				case "host":
					if(window.validators.iporhost(value))
						clientdom.connector.server.value = value;
					break;
				case "port":
					try {
						let ppp = parseInt(value);
						clientdom.connector.port.value = ppp;
					} catch(e) {}
					break;
			}
		}
		if(window.location.hash)
			clientdom.connector.channel.value = window.location.hash;
		
		if(window.location.pathname.length > 4) {
			let t1 = window.location.pathname.substring(1, window.location.pathname.length-1);
			let proposed = "";

			if(t1.indexOf('/') != -1) {
				proposed = t1.split('/');
				proposed = proposed[proposed.length-1]
			} else {
				proposed = t1;
			}

			if(window.validators.iporhost(proposed))
				clientdom.connector.server.value = proposed;
		}
	}

	validateForm(event) {
		event.preventDefault();

		let nickname = clientdom.connector.nickname.value;
		let password = clientdom.connector.password.value;
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

		if(!clientdom.connector.pwtrigger.checked)
			password = "";

		irc.socket.emit('irc_create', {nickname: 	nickname,
									   autojoin: 	channel,
									   server: 		server,
									   port: 		port,
									   password: 	password,
									   secure: 		clientdom.connector.secure.checked });
		return true;
	}

	authMessage(message, error) {
		clientdom.connector.messenger.innerHTML = "<span class='msg"+(error?" error":"")+"'>"+message+"</span>";
		if(error)
			this.formLocked = false;
	}

	togglePassword() {
		if(clientdom.connector.pwtrigger.checked)
			clientdom.connector.pwbox.style.display = "block";
		else
			clientdom.connector.pwbox.style.display = "none";
	}

	authComplete() {
		clientdom.connector.frame.style.display = "none";
		this.formLocked = false;
	}
}

class InputHandler {
	constructor() {
		this.history = [];
		this.historyCaret = 0;
		this.searchNicknames = [];

		this.index = -1;
		this.words = [];
		this.last = "";

		clientdom.input.onkeyup = (evt) => {
			let key = evt.keyCode || evt.which || evt.charCode || 0;
			if (key == 13) {
				this.handleInput();
				return;
			}

			this.keyUpHandle(evt, key);
		}

		clientdom.input.onkeydown = (e) => {
			let key = e.keyCode || e.which || e.charCode || 0;
			if (e.ctrlKey || e.shiftKey || e.altKey) {
				return;
			}

			this.keyDownHandle(e, key);
		}

		clientdom.input.onfocus = (e) => {
			if(irc.config.scrollOnFocus)
				clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
		}

		clientdom.send.onclick = (e) => {
			this.handleInput();
		}
	}

	keyUpHandle(e, key) {
		if(key == 38 || key == 40) {
			clientdom.input.selectionStart = clientdom.input.value.length;
			clientdom.input.selectionEnd = clientdom.input.value.length;
		} else if(key == 9) return;
		let input = clientdom.input.value;
		let word = input.split(/ |\n/).pop();

		// Reset iteration.
		this.tabCompleteReset();

		// Check for matches if the current word is the last word.
		if (clientdom.input.selectionStart == input.length && word.length) {
			// Call the match() function to filter the words.
			this.tabWords = match(word, this.searchNicknames);
			if(input.indexOf(word) == 0)
				for(let n in this.tabWords)
					this.tabWords[n] += ": ";
		}

	}

	keyDownHandle(e, key) {
		if(key == 38) {
			if(this.historyCaret <= 0) {
				this.historyCaret = 0;
			} else {
				this.historyCaret -= 1;
			}

			let selection = this.history[this.historyCaret];

			if(selection) {
				clientdom.input.value = selection;
				this.tabCompleteReset();
			}

			return;
		} else if(key == 40) {
			if(this.historyCaret >= this.history.length) {
				this.historyCaret = this.history.length;
			} else {
				this.historyCaret += 1;
			}

			let selection = this.history[this.historyCaret]

			if(!this.history[this.historyCaret])
				selection = '';

			clientdom.input.value = selection;
			this.tabCompleteReset();

			return;
		}

		if(key == 9) {
			e.preventDefault();

			this.index++;

			// Get next match.
			let word = this.tabWords[this.index % this.tabWords.length];
			if (!word) {
				return;
			}

			let value = clientdom.input.value;
			this.lastWord = this.lastWord || value.split(/ |\n/).pop();

			// Return if the 'minLength' requirement isn't met.
			if (this.lastWord.length < 1)
				return;

			let text = value.substr(0, clientdom.input.selectionStart - this.lastWord.length) + word;
			clientdom.input.value = text;

			// Remember the word until next time.
			this.lastWord = word;

			return;
		}
	}

	tabCompleteReset() {
		this.index = -1;
		this.lastWord = "";
		this.tabWords = [];
	}

	handleInput() {
		let message = clientdom.input.value;
		let buffer = irc.chat.getActiveBuffer();

		if(!buffer) return;
		if(message.trim() == "") return;

		let listargs = message.split(' ');

		if(listargs[0].indexOf('/') == 0) {
			let command = listargs[0].substring(1).toLowerCase();
			if(command.toLowerCase() in commands) {
				let cmd = commands[command];
				if("execute" in cmd)
					cmd.execute(buffer, this, command, message, listargs);
			} else {
				let foundAliased = null;
				for(let cmd in commands) {
					if(!commands[cmd]['aliases']) continue;
					if(commands[cmd].aliases.indexOf(command) != -1) foundAliased = commands[cmd];
				}
				if(foundAliased)
					foundAliased.execute(buffer, this, command, message, listargs);
				else
					this.commandError(buffer, listargs[0].toUpperCase()+': Unknown command!');
			}

		} else {
			irc.socket.emit("userinput", {command: "privmsg", server: buffer.server, message: message, arguments: [buffer.name]});
		}

		this.history.push(message);
		this.historyCaret = this.history.length;
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

	destroyAllBuffers() {
		// Wipe all server data
		irc.serverData = {};
		irc.serverChatQueue = {};
		this.buffers = [];

		// Clear tabs
		clientdom.tabby.innerHTML = "";

		// Reset to the defaults
		irc.auther.authMessage("Disconnected", true);
		clientdom.frame.style.display = "none";
		this.firstServer = true;
	}

	getBufferByName(buffername) {
		let result = null;
		for (let t in this.buffers) {
			let buf = this.buffers[t];
			if(buf.name.toLowerCase() == buffername.toLowerCase())
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
			if(buf.server == server && buf.name.toLowerCase() == channel.toLowerCase())
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
			window.onbeforeunload = function(e) {
				return 'IRC will disconnect.';
			}
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
		if(buffer.type == "server")
			irc.socket.emit("userinput", {command: "quit", server: buffer.server, message: "Server tab closed", arguments: []});
		else if(buffer.type == "channel" && buffer.alive)
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

		if(this.buffers.length == 0 || (this.buffers.length == 1 && this.buffers[0].type == "applet")) {
			irc.chat.destroyAllBuffers();
			irc.auther.authMessage("Create a new connection", false);
			irc.auther.canClose = false;
			clientdom.connector.frame.style.display = "block";
		}
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

		let channelSendNicks = [];

		for(let n in nicks) {
			let nick = {nickname: "", prefix: "", modes: []};

			if(irc.serverData[buf.server].supportedPrefixes.split('').indexOf(nicks[n].substring(0, 1)) != -1) {
				nick.prefix = nicks[n].substring(0, 1);
				nick.nickname = nicks[n].substring(1);
				nick.modes = [objectGetKey(irc.serverData[buf.server].modeTranslation, nick.prefix)];
				channelSendNicks.push("<span class='prefix'>{0}</span><span class='nick'>{1}</span>".format(nick.prefix, nick.nickname));
			} else {
				nick.nickname = nicks[n];
				channelSendNicks.push("<span class='nick'>{1}</span>".format(nick.prefix, nick.nickname));
			}

			buf.nicklist.nickAddObject(nick);
		}

		buf.addMessage("Nicks <span class='channel'>{0}</span>: {1}".format(channel, channelSendNicks.join(', ')), null, "names");

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
			buffer.addMessage("{0} is now known as {1}".format(oldNick, newNick), null, "nick");
		}
	}

	topicChange(channel, server, topic, changer) {
		let buf = this.getBufferByServerName(server, channel);
		
		if (!buf) return;

		buf.topicChange(topic);
		if(changer)
			buf.addMessage("<span class='nick'>{0}</span> has changed the topic of {1} to \"{2}\"".format(changer, channel, topic), 
				null, "topic");
		else
			buf.addMessage("Topic of <span class='channel'>{0}</span> is \"{1}\"".format(channel, topic), null, "topic");
	}

	handleQuit(server, user, reason) {
		let buffers = this.getBuffersByServer(server);

		for(let i in buffers) {
			let buffer = buffers[i];

			if(buffer.type != "channel") continue;
			if(buffer.nicklist.getNickIndex(user.nickname) == null) continue;

			buffer.nicklist.nickRemove(user.nickname);
			buffer.addMessage("<span class='hostmask'>{0}@{1}</span> has quit <span class='reason'>{2}</span>".format(user.username, 
				user.hostname, reason), user.nickname, "quit");
		}
	}

	handleJoin(server, user, channel) {
		let buffer = this.getBufferByServerName(server, channel);

		if(!buffer) return;

		if(user.nickname == irc.serverData[server].my_nick)
			buffer.setAliveStatus(true);
		else
			buffer.nicklist.nickAdd(user.nickname);

		buffer.addMessage("<span class='hostmask'>{0}@{1}</span> has joined <span class='channel'>{2}</span>".format(user.username, 
				user.hostname, channel), user.nickname, "join");
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
			buffer.addMessage("has kicked <span class='nick'>{0}</span> <span class='reason'>{1}</span>".format(user, reason), kicker.nickname, "part");
		else
			buffer.addMessage("<span class='hostmask'>{0}@{1}</span> has left <span class='channel'>{2}</span>{3}".format(user.username, 
				user.hostname, (reason != null ? "&nbsp;<span class='reason'>"+reason+"</span>" : "")), user.nickname, "part");
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
			buf.addMessage("set mode <span class='channel'>{0}</span> <span class='mode'>+{1} {2}</span>".format(data.target,
							data.mode, data.modeTarget), data.user.nickname, "mode");
		} else if(data.type == "mode_del") {
			buf.nicklist.modeRemoved(data.modeTarget, data.mode);
			buf.addMessage("set mode <span class='channel'>{0}</span> <span class='mode'>-{1} {2}</span>".format(data.target,
							data.mode, data.modeTarget), data.user.nickname, "mode");
		} else {
			buf.addMessage("set mode <span class='channel'>{0}</span> <span class='mode'>{1}</span>".format(data.target,
							data.message), data.user.nickname, "mode");
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

	changeTitle(title) {
		// TODO: notify of hot buffers
		document.title = title;
		irc.documentTitle = title;
	}

	render(buffer) {
		let activeNow = this.getActiveBuffer();
		this.input_handler.tabCompleteReset();

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

function parseURL() {
	let match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);

	irc.auther.fillFormFromURI();
}

window.onpopstate = parseURL;

window.onresize = function() {
	if(irc.config.scrollOnResize)
		clientdom.letterbox.scrollTop = clientdom.letterbox.scrollHeight;
}

window.onload = function() {
	irc.primaryFrame = document.querySelector('.ircclient');

	clientdom.settings['frame'] = irc.primaryFrame.querySelector('.settings');

	for(let key in irc.config) {
		clientdom.settings[key] = clientdom.settings.frame.querySelector('#s_'+key);
	}

	clientdom.settings['available_themes'] = clientdom.settings.frame.querySelector('.available_themes');
	clientdom.settings['save'] = clientdom.settings.frame.querySelector('#save_settings');
	clientdom.settings['saveStatus'] = clientdom.settings.frame.querySelector('#settings_status');
	clientdom.connector['frame'] = irc.primaryFrame.querySelector('#authdialog');
	clientdom.connector['messenger'] = clientdom.connector.frame.querySelector('#connmsg');
	clientdom.connector['form'] = clientdom.connector.frame.querySelector('#IRCConnector');
	clientdom.connector['nickname'] = clientdom.connector.form.querySelector('#nickname');
	clientdom.connector['password'] = clientdom.connector.form.querySelector('#password');
	clientdom.connector['pwtrigger'] = clientdom.connector.form.querySelector('#password_trig');
	clientdom.connector['pwbox'] = clientdom.connector.form.querySelector('.password_box');
	clientdom.connector['channel'] = clientdom.connector.form.querySelector('#channel');
	clientdom.connector['server'] = clientdom.connector.form.querySelector('#server');
	clientdom.connector['port'] = clientdom.connector.form.querySelector('#port');
	clientdom.connector['secure'] = clientdom.connector.form.querySelector('#secure');
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
	clientdom.settings['open'] = irc.primaryFrame.querySelector('.open_settings');

	irc.socket = io.connect();

	irc.settings = new Settings();
	irc.auther = new IRCConnector();
	irc.chat = new IRCChatWindow();

	parseURL();
	irc.settings.setInitialValues();

	irc.socket.on('connect', function (data) {
		irc.socketUp = true;
	});

	irc.socket.on('disconnect', function (data) {
		irc.socketUp = false;
		irc.chat.destroyAllBuffers();
		clientdom.connector.frame.style.display = "block";
	});

	// Does everything
	irc.socket.on('act_client', function (data) {
		if(data['message'])
			data.message = validators.escapeHTML(data.message);
		if(data['reason'])
			data.reason = validators.escapeHTML(data.reason);
		
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
			case "event_server_quit":
				let serverz = irc.chat.getBuffersByServer(data.server);
				for(let a in serverz) {
					let serv = serverz[a];
					serv.addMessage("You are no longer talking on this server.", null, "error");
					serv.setAliveStatus(false);
				}
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
};
