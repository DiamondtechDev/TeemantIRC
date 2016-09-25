let EventEmitter = require('events').EventEmitter;
let net = require('net');
let tls  = require('tls');
let configuration = require(__dirname+"/config");
let parse = require(__dirname+"/parser");
let webirc = require(__dirname+"/webirc");

if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != undefined ? args[number] : match;
		});
	};
}

class IRCConnectionHandler {
	constructor(connection) {
		this.conn = connection;
	}

	handleUserLine(data) {
		switch(data.command) {
			case "kick":
			case "part":
				this.conn.write('{0} {1} :{2}'.format(data.command.toUpperCase(), data.arguments[0], data.message));
				break;
			case "nick":
			case "whois":
			case "who":
			case "join":
				this.conn.write('{0} {1}'.format(data.command.toUpperCase(), data.arguments[0]));
				break;
			case "quit":
				this.conn.write('{0} :{1}'.format(data.command.toUpperCase(), (data.message == '' ? configuration.client.default_quit_msg : data.message)));
				break;
			case "privmsg":
				this.conn.write('PRIVMSG {0} :{1}'.format(data.arguments[0], data.message));
				this.conn.emit('pass_to_client', {type: "message", messageType: "privmsg", to: data.arguments[0], 
											  user: {nickname: this.conn.config.nickname}, message: data.message, server: data.server});
				break;
			case "notice":
				this.conn.write('NOTICE {0} :{1}'.format(data.arguments[0], data.message));
				this.conn.emit('pass_to_client', {type: "message", messageType: "notice", to: data.arguments[0], 
											  user: {nickname: this.conn.config.nickname}, message: data.message, server: data.server});
				break;
			case "list":
				this.conn.write(data.command.toUpperCase());
				break;
			default:
				this.conn.write(data.command.toUpperCase()+' '+data.message);
		}
		if(data.targetType == "channel" || data.targetType == "message") {
			this.conn.write('PRIVMSG {0} :{1}'.format(data.target, data.message));
			this.conn.emit('pass_to_client', {type: "message", messageType: "privmsg", to: data.target, 
											  user: {nickname: this.conn.config.nickname}, message: data.message, server: data.server});
		}
	}

	whoisManage(whom, list) {
		if(!this.conn.queue.whois)
			this.conn.queue.whois = {};

		if(!this.conn.queue.whois[whom])
			this.conn.queue.whois[whom] = list;
		else
			for(let a in list)
				this.conn.queue.whois[whom][a] = list[a];
	}

	handleServerLine(line) {
		if(this.conn.queue["supportsmsg"] && line.command != "005")  {

			delete this.conn.queue["supportsmsg"];

			if(this.conn.config.autojoin.length > 0)
				for(let t in this.conn.config.autojoin)
					this.conn.write('JOIN '+this.conn.config.autojoin[t]);

			this.conn.emit('authenticated', {});
		}

		let serverName = this.conn.config.server;
		let realServerName = this.conn.data.actualServer;
		if(line.user.nickname == '')
			realServerName = line.user.hostname;

		let list = null;
		switch(line.command) {
			case "error":
				this.conn.emit("connerror", {type: "irc_error", raw: line.raw});
				break;
			case "001":
				this.conn.data.actualServer = line.user.hostname;
				break
			case "005":
				if(!this.conn.queue["supportsmsg"])
					this.conn.queue["supportsmsg"] = true;

				this.conn.authenticated = true;

				let argv = line.arguments.slice(1);
				for(let a in argv) {
					let t = argv[a];
					if(t.indexOf('=') != -1) {
						t = t.split('=');
						if(t[0] === 'PREFIX') {
							let d = t[1].match(/\((\w+)\)(.*)/);
							let r = d[1].split('');
							let aa = d[2].split('');
							for(let b in r)
								this.conn.data.supportedModes[r[b]] = aa[b];
						} else if(t[0] === 'NETWORK') {
							this.conn.data.network = t[1];
						} else if(t[0] === 'CHANNELLEN') {
							this.conn.data.max_channel_length = parseInt(t[1]);
						}

						this.conn.data.serverSupports[t[0]] = t[1];
					} else {
						this.conn.data.serverSupports[t] = true;
					}
				}
				break;
			case "JOIN":
				this.conn.emit('pass_to_client', {type: "event_join_channel", user: line.user, channel: line.trailing, server: serverName });
				break;
			case "PART":
				this.conn.emit('pass_to_client', {type: "event_part_channel", user: line.user, channel: line.arguments[0], reason: line.trailing, server: serverName });
				break;
			case "QUIT":
				this.conn.emit('pass_to_client', {type: "event_quit", user: line.user, reason: line.trailing, server: serverName });
				break;
			case "353":
				if(!this.conn.queue["names"])
					this.conn.queue['names'] = {};

				let splittrail = line.trailing.split(' ');
				for(let a in splittrail) {
					let nick = splittrail[a];
					if(nick.trim() == "") continue;
					if(this.conn.queue["names"][line.arguments[2]])
						this.conn.queue["names"][line.arguments[2]].push(nick);
					else
						this.conn.queue["names"][line.arguments[2]] = [nick];
				}
				
				break;
			case "366":
				if(!this.conn.queue["names"]) break;
				if(this.conn.queue["names"][line.arguments[1]]) {
					this.conn.emit('pass_to_client', {type: "channel_nicks", channel: line.arguments[1], nicks: this.conn.queue["names"][line.arguments[1]], server: serverName});
					delete this.conn.queue["names"][line.arguments[1]];
				}

				if(Object.keys(this.conn.queue["names"]).length == 0)
					delete this.conn.queue["names"];
				break;
			case "PRIVMSG":
				let type = "privmsg";

				if(line.trailing.indexOf('\x01ACTION') == 0) {
					// TODO: remove once proper CTCP handling is done;
				} else if(line.trailing.indexOf('\x01') == 0) {
					// TODO: handle CTCPs
					return;
				}

				if(line.user.nickname != "")
					this.conn.emit('pass_to_client', {type: "message", messageType: type, to: line.arguments[0], 
													  user: line.user, message: line.trailing, server: serverName});
				else
					this.conn.emit('pass_to_client', {type: "server_message", messageType: type, message: line.trailing, server: serverName, from: realServerName});
				break;
			case "NOTICE":
				if(line.user.nickname != "")
					this.conn.emit('pass_to_client', {type: "message", messageType: "notice", to: line.arguments[0], 
													  user: line.user, message: line.trailing, server: serverName});
				else
					this.conn.emit('pass_to_client', {type: "server_message", messageType: "notice", message: line.trailing, server: serverName, from: realServerName});
				break;
			case "NICK":
				if(line.user.nickname == this.conn.config.nickname)
					this.conn.config.nickname = line.arguments[0];

				this.conn.emit('pass_to_client', {type: "nick_change", nick: line.user.nickname, newNick: line.arguments[0], server: serverName});
				break;
			case "KICK":
				this.conn.emit('pass_to_client', {type: "event_kick_channel", user: line.user, channel: line.arguments[0], kickee: line.arguments[1], server: serverName});
				break;
			case "TOPIC":
				this.conn.emit('pass_to_client', {type: "channel_topic", channel: line.arguments[0], set_by: line.user.nickname, topic: line.trailing, server: serverName});
				break;
			case "332":
				this.conn.emit('pass_to_client', {type: "channel_topic", channel: line.arguments[1], topic: line.trailing, server: serverName});
				break;
			case "333":
				this.conn.emit('pass_to_client', {type: "channel_topic", channel: line.arguments[1], set_by: line.arguments[2], time: line.arguments[3], server: serverName});
				break;
			case "375":
			case "372":
			case "376":
				this.conn.emit('pass_to_client', {type: "server_message", messageType: "motd", message: line.trailing, server: serverName, from: realServerName});
				break;
			case "351":
			case "251":
			case "290":
			case "292":
			case "255":
				this.conn.emit('pass_to_client', {type: "server_message", messageType: "regular", message: line.trailing, server: serverName, from: realServerName});
				break;
			case "252":
			case "254":
			case "042":
				this.conn.emit('pass_to_client', {type: "server_message", messageType: "regular", message: line.arguments[1] +" "+ line.trailing, server: serverName, from: realServerName});
				break;
			case "MODE":
				let isChannelMode = false;
				let method = '+';
				if(line.arguments[0].indexOf('#') != -1)
					isChannelMode = true;

				let modes = line.arguments[1];
				method = modes.substring(0, 1);
				modes = modes.substring(1).split('');
				let pass = [];

				if(isChannelMode) {
					for(let i in modes) {
						let mode = modes[i];
						if(this.conn.data.supportedModes[mode])
							this.conn.emit('pass_to_client', {type: "mode_"+(method=='+'?'add':'del'), target: line.arguments[0], mode: mode, 
										modeTarget: line.arguments[2+parseInt(i)], server: serverName, user: line.user});
						else
							pass.push(mode);
					}
				} else {
					pass = modes;
				}

				if(pass.length > 0)
					this.conn.emit('pass_to_client', {type: "mode", target: line.arguments[0], message: line.arguments.slice(1).join(" "), 
								server: serverName, user: line.user});
				break;
			case "433":
				let newNick = this.conn.config.nickname + "_";
				this.conn.write('NICK '+newNick);
				this.conn.config.nickname = newNick;
				break;
			case "401":
			case "402":
			case "421":
			case "432":
				this.conn.emit('pass_to_client', {type: "message", to: null, message: line.arguments[1]+': '+line.trailing, 
								server: serverName, user: {nickname: realServerName}, messageType: "error"});
				break;
			case "311":
				// start whois queue
				list = {
					nickname: line.arguments[1],
					hostmask: "{0}!{1}@{2}".format(line.arguments[1], line.arguments[2], line.arguments[3]),
					realname: line.trailing || ""
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case "319":
				// whois: channels
				list = {
					channels: line.trailing.split(" "),
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case "378":
				list = {
					connectingFrom: line.trailing,
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case "379":
				list = {
					usingModes: line.trailing,
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case "312":
				list = {
					server: line.arguments[2],
					server_name: line.trailing || ""
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "313":
				list = {
					title: line.trailing
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "330":
				list = {
					loggedIn: line.trailing+' '+line.arguments[2]
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "335":
				list = {
					bot: true
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "307":
				list = {
					registered: line.trailing
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "671":
				list = {
					secure: true
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "317":
				list = {
					signonTime: line.arguments[3],
					idleSeconds: line.arguments[2]
				}
				this.whoisManage(line.arguments[1], list);
				break;
			case "318":
				if(!this.conn.queue.whois || !this.conn.queue.whois[line.arguments[1]])
					return;
				this.conn.emit('pass_to_client', {type: "whoisResponse", whois: this.conn.queue.whois[line.arguments[1]], 
								server: serverName, from: realServerName});
				delete this.conn.queue.whois[line.arguments[1]];
				break;
			case "321":
				this.conn.emit('pass_to_client', {type: "listedchan", channel: "Channel", users: "Users", topic: "Topic",
								server: serverName, from: realServerName});
				break;
			case "322":
				this.conn.emit('pass_to_client', {type: "listedchan", channel: line.arguments[1], users: line.arguments[2], topic: line.trailing,
								server: serverName, from: realServerName});
				break;
		}
	}
}

class IRCConnection extends EventEmitter {
	constructor(providedInfo, userInfo) {
		super();

		this.config = {
			nickname: "teemant",
			username: configuration.client.username,
			realname: configuration.client.realname,
			server: "localhost",
			port: 6667,
			autojoin: [],
			secure: configuration.client.secure_by_default,
			password: "",
			address: "0.0.0.0",
			rejectUnauthorized: configuration.tls.rejectUnauthorized
		};

		this.userInfo = userInfo;

		for(let a in providedInfo) {
			this.config[a] = providedInfo[a];
		}

		this.socket = null;
		this.connected = false;
		this.authenticated = false;

		this.handler = new IRCConnectionHandler(this);

		this.data = {
			serverSupports: {},
			network: this.config.server,
			actualServer: this.config.server,
			max_channel_length: 64,
			supportedModes: {}
		};
		this.authorizationError = '';
		this.queue = {};
	}

	on(...args) {
		return super.on(...args)
	}

	emit(...args) {
		return super.emit(...args);
	}

	connect() {
		this.socket = (this.config.secure ? tls : net).connect({port: this.config.port, host: this.config.server, 
																rejectUnauthorized: this.config.rejectUnauthorized}, () => {
			this.connected = true;
			this.authenticate();
		});

		this.socket.setEncoding(configuration.client.encoding);
		this.socket.setTimeout(configuration.client.timeout);

		this.socket.on('error', (data) => {
			this.emit('connerror', {type: "sock_error", message: "A socket error occured.", raw: data});
		});

		this.socket.on('lookup', (err, address, family, host) => {
			if(err) {
				this.emit('connerror', {type: "resolve_error", message: "Failed to resolve host."});
			} else {
				this.emit('lookup', {address: address, family: address, host: host});
				this.config.address = address;
			}
		});

		let buffer = "";
		this.socket.on('data', (chunk) => {
			buffer += chunk;
			let data = buffer.split('\r\n');
			buffer = data.pop();
			data.forEach((line) => {
				if(line.indexOf('PING') === 0) {
					this.socket.write('PONG'+line.substring(4)+'\r\n');
					return
				}
				this.emit('raw', line);
				let parsed = parse(line);
				this.emit('line', parsed);
				this.handler.handleServerLine(parsed);
			});
		});

		this.socket.on('close', (data) => {
			if(!this.queue['close'])
				this.emit('closed', {type: "sock_closed", raw: data, message: "Connection closed."});

			this.connected = false;
			this.authenticated = false;
		})
	}

	authenticate() {
		if (this.config.password)
			this.socket.write('PASS {0}\r\n'.format(this.config.password));
		
		let serverpass = webirc.get_password(this.config.address);

		if(serverpass)
			this.socket.write('WEBIRC {0} cgiirc {1} {2}\r\n'.format(serverpass, this.userInfo.hostname, this.userInfo.ipaddr));

		this.socket.write('USER {0} 8 * :{1}\r\n'.format(this.config.username, this.config.realname));
		this.socket.write('NICK {0}\r\n'.format(this.config.nickname));
	}

	disconnect(message) {
		if(!this.connected) {
			this.emit('connerror', {type: "sock_closed", message: "Connection already closed."});
			return;
		}

		this.queue['close'] = true;
		this.socket.write('QUIT :{0}\r\n'.format(message != null ? message : configuration.client.default_quit_msg));
	}

	write(message) {
		if(!this.connected) {
			this.emit('connerror', {type: "sock_closed", message: "Connection is closed."});
			return;
		}
		this.socket.write(message+'\r\n');
	}
	
}

module.exports = IRCConnection;
