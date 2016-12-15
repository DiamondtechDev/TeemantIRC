const EventEmitter = require('events').EventEmitter;
const net = require('net');
const tls  = require('tls');
const parse = require(__dirname+'/parser');

class IRCConnectionHandler {
	constructor(connection) {
		this.conn = connection;
	}

	handleUserLine(data) {
		switch(data.command) {
			case 'topic':
				this.conn.write(('{0} {1}'+(data.message != '' ? ' :'+data.message : '')).format(data.command.toUpperCase(), data.arguments[0]));
				break;
			case 'kick':
				this.conn.write('{0} {1} :{2}'.format(data.command.toUpperCase(), data.arguments.join(' '), data.message));
				break;
			case 'part':
				this.conn.write('{0} {1} :{2}'.format(data.command.toUpperCase(), data.arguments[0], data.message));
				break;
			case 'nick':
			case 'whois':
			case 'who':
			case 'names':
			case 'join':
				this.conn.write('{0} {1}'.format(data.command.toUpperCase(), data.arguments[0]));
				break;
			case 'quit':
				this.conn.write('{0} :{1}'.format(data.command.toUpperCase(), (data.message == '' ? 
					this.conn.globalConfig.default_quit_msg : data.message)));
				break;
			case 'privmsg':
				this.conn.write('PRIVMSG {0} :{1}'.format(data.arguments[0], data.message));
				this.conn.emit('pass_to_client', {type: 'message', messageType: 'privmsg', to: data.arguments[0], 
											  user: {nickname: this.conn.config.nickname}, message: data.message, server: data.server});
				break;
			case 'notice':
				this.conn.write('NOTICE {0} :{1}'.format(data.arguments[0], data.message));
				this.conn.emit('pass_to_client', {type: 'message', messageType: 'notice', to: data.arguments[0], 
											  user: {nickname: this.conn.config.nickname}, message: data.message, server: data.server});
				break;
			case 'list':
				this.conn.write(data.command.toUpperCase());
				break;
			case 'ctcp':
				let ctcpmsg = '';
				
				if(data.arguments[1].toLowerCase() == 'ping')
					ctcpmsg = 'PING '+Math.floor(Date.now()/1000);
				else
					ctcpmsg = data.message;

				this.conn.write('PRIVMSG {0} :\x01{1}\x01'.format(data.arguments[0], ctcpmsg));
				this.conn.emit('pass_to_client', {type: 'message', messageType: 'ctcp_request', to: this.conn.config.nickname, 
													  user: {nickname: data.arguments[0]}, message: ctcpmsg, server: data.server});
				break;
			default:
				this.conn.write(data.command.toUpperCase()+' '+data.message);
		}
		if(data.targetType == 'channel' || data.targetType == 'message') {
			this.conn.write('PRIVMSG {0} :{1}'.format(data.target, data.message));
			this.conn.emit('pass_to_client', {type: 'message', messageType: 'privmsg', to: data.target, 
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

	ctcpManage(data) {
		let line = data.trailing.replace(/\x01/g, '').trim().split(' ');

		if(!line[0]) return;
		line[0] = line[0].toUpperCase();

		let resp = '\x01'+line[0]+' {0}\x01';

		if(line[0] == 'PING' && line[1] != null && line[1] != '') {
			resp = resp.format(line.slice(1).join(' '));
		} else if(line[0] == 'CLIENTINFO') {
			resp = resp.format('CLIENTINFO PING '+Object.keys(this.conn.extras.ctcps).join(' '));
		} else if(this.conn.extras.ctcps && this.conn.extras.ctcps[line[0]] != null) {
			resp = resp.format(this.conn.extras.ctcps[line[0]](data, this.conn));
		} else {
			resp = null;
		}

		if (resp != null)
			this.conn.write('NOTICE {0} :{1}'.format(data.user.nickname, resp));

		return resp != null;
	}

	handleServerLine(line) {
		if(this.conn.queue['supportsmsg'] && line.command != '005')  {

			delete this.conn.queue['supportsmsg'];

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
			case 'error':
				this.conn.emit('connerror', {type: 'irc_error', raw: line.raw});
				break;
			case '001':
				this.conn.data.actualServer = line.user.hostname;
				break;
			case '005':
				if(!this.conn.queue['supportsmsg'])
					this.conn.queue['supportsmsg'] = true;

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
			case 'JOIN':
				if(line.trailing) {
					this.conn.emit('pass_to_client', {type: 'event_join_channel', user: line.user, channel: line.trailing, server: serverName });
				} else {
					for(let i in line.arguments) {
						this.conn.emit('pass_to_client', {type: 'event_join_channel', user: line.user, channel: line.arguments[i], server: serverName });
					}
				}
				break;
			case 'PART':
				this.conn.emit('pass_to_client', {type: 'event_part_channel', user: line.user, channel: line.arguments[0], reason: line.trailing, server: serverName });
				break;
			case 'QUIT':
				this.conn.emit('pass_to_client', {type: 'event_quit', user: line.user, reason: line.trailing, server: serverName });
				break;
			case '353':
				if(!this.conn.queue['names'])
					this.conn.queue['names'] = {};

				let splittrail = line.trailing.split(' ');
				for(let a in splittrail) {
					let nick = splittrail[a];
					if(nick.trim() == '') continue;
					if(this.conn.queue['names'][line.arguments[2]])
						this.conn.queue['names'][line.arguments[2]].push(nick);
					else
						this.conn.queue['names'][line.arguments[2]] = [nick];
				}
				
				break;
			case '366':
				if(!this.conn.queue['names']) break;
				if(this.conn.queue['names'][line.arguments[1]]) {
					this.conn.emit('pass_to_client', {type: 'channel_nicks', channel: line.arguments[1], nicks: this.conn.queue['names'][line.arguments[1]], server: serverName});
					delete this.conn.queue['names'][line.arguments[1]];
				}

				if(Object.keys(this.conn.queue['names']).length == 0)
					delete this.conn.queue['names'];

				break;
			case 'PRIVMSG':
				if(line.trailing.indexOf('\x01') == 0 && line.trailing.indexOf('\x01ACTION') != 0)
					return this.ctcpManage(line);

				if(line.user.nickname != '')
					this.conn.emit('pass_to_client', {type: 'message', messageType: 'privmsg', to: line.arguments[0], 
													  user: line.user, message: line.trailing, server: serverName});
				else
					this.conn.emit('pass_to_client', {type: 'server_message', messageType: 'privmsg', message: line.trailing, server: serverName, from: realServerName});
				break;
			case 'NOTICE':
				if(line.trailing.indexOf('\x01') == 0 && line.trailing.indexOf('\x01ACTION') != 0) {
					let composethis = line.trailing.replace(/\x01/g,'').trim().split(' ');
					composethis[0] = composethis[0].toUpperCase();
					let message = composethis.join(' ');
					
					if(composethis[0] == 'PING') 
						message = Math.floor(Date.now()/1000) - composethis[1]+'s';

					this.conn.emit('pass_to_client', {type: 'message', messageType: 'ctcp_response', to: line.arguments[0], 
													  user: line.user, message: message, server: serverName});
					return;
				}

				if(line.user.nickname != '')
					this.conn.emit('pass_to_client', {type: 'message', messageType: 'notice', to: line.arguments[0], 
													  user: line.user, message: line.trailing, server: serverName});
				else
					this.conn.emit('pass_to_client', {type: 'server_message', messageType: 'notice', message: line.trailing, server: serverName, from: realServerName});
				break;
			case 'NICK':
				if(line.user.nickname == this.conn.config.nickname)
					this.conn.config.nickname = line.arguments[0];

				this.conn.emit('pass_to_client', {type: 'nick_change', nick: line.user.nickname, newNick: line.arguments[0], server: serverName});
				break;
			case 'KICK':
				this.conn.emit('pass_to_client', {type: 'event_kick_channel', user: line.user, channel: line.arguments[0], reason: line.trailing, kickee: line.arguments[1], server: serverName});
				break;
			case 'TOPIC':
				this.conn.emit('pass_to_client', {type: 'channel_topic', channel: line.arguments[0], set_by: line.user.nickname, topic: line.trailing, server: serverName});
				break;
			case '332':
				this.conn.emit('pass_to_client', {type: 'channel_topic', channel: line.arguments[1], topic: line.trailing, server: serverName});
				break;
			case '333':
				this.conn.emit('pass_to_client', {type: 'channel_topic', channel: line.arguments[1], set_by: line.arguments[2], time: line.arguments[3], server: serverName});
				break;
			case '375':
			case '372':
			case '376':
				this.conn.emit('pass_to_client', {type: 'server_message', messageType: 'motd', message: line.trailing, server: serverName, from: realServerName});
				break;
			case '006':
			case '007':
			case '251':
			case '255':
			case '270':
			case '290':
			case '292':
			case '323':
			case '351':
			case '381':
				this.conn.emit('pass_to_client', {type: 'server_message', messageType: 'regular', message: line.trailing, server: serverName, from: realServerName});
				break;
			case '252':
			case '254':
			case '396':
			case '042':
				this.conn.emit('pass_to_client', {type: 'server_message', messageType: 'regular', message: line.arguments[1] +' '+ line.trailing, server: serverName, from: realServerName});
				break;
			case '501':
			case '401':
			case '402':
			case '421':
			case '482':
			case '331':
			case '432':
				this.conn.emit('pass_to_client', {type: 'message', to: null, message: line.arguments[1]+': '+line.trailing, 
								server: serverName, user: {nickname: realServerName}, messageType: 'error'});
				break;
			case 'MODE':
				let isChannelMode = false;
				let method = '+';
				if(line.arguments[0].indexOf('#') != -1)
					isChannelMode = true;

				let modes = line.arguments[1];

				if(!modes && line.trailing != '')
					modes = line.trailing;

				let sender = line.user.nickname;
				if(sender == '')
					sender = line.user.hostname;

				method = modes.substring(0, 1);
				modes = modes.substring(1).split('');
				let pass = [];

				if(isChannelMode) {
					for(let i in modes) {
						let mode = modes[i];
						if(this.conn.data.supportedModes[mode])
							this.conn.emit('pass_to_client', {type: 'mode_'+(method=='+'?'add':'del'), target: line.arguments[0], mode: mode, 
										modeTarget: line.arguments[2+parseInt(i)], server: serverName, user: {nickname: sender}});
						else
							pass.push(mode);
					}
				} else {
					pass = modes;
				}

				if(pass.length > 0)
					this.conn.emit('pass_to_client', {type: 'mode', target: line.arguments[0], message: method+pass.join(''), 
								server: serverName, user: {nickname: sender}});
				break;
			case '433':
				let newNick = this.conn.config.nickname + '_';
				this.conn.write('NICK '+newNick);
				this.conn.config.nickname = newNick;
				break;
			case '311':
				// start whois queue
				list = {
					nickname: line.arguments[1],
					hostmask: '{0}!{1}@{2}'.format(line.arguments[1], line.arguments[2], line.arguments[3]),
					realname: line.trailing || ''
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '319':
				// whois: channels
				list = {
					channels: line.trailing.split(' '),
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '378':
				list = {
					connectingFrom: line.trailing,
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '379':
				list = {
					usingModes: line.trailing,
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '312':
				list = {
					server: line.arguments[2],
					server_name: line.trailing || ''
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '313':
				list = {
					title: line.trailing
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '330':
				list = {
					loggedIn: line.trailing+' '+line.arguments[2]
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '335':
				list = {
					bot: true
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '307':
				list = {
					registered: line.trailing
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '671':
				list = {
					secure: true
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '317':
				list = {
					signonTime: line.arguments[3],
					idleSeconds: line.arguments[2]
				};
				this.whoisManage(line.arguments[1], list);
				break;
			case '318':
				if(!this.conn.queue.whois || !this.conn.queue.whois[line.arguments[1]])
					return;

				this.conn.emit('pass_to_client', {type: 'whoisResponse', whois: this.conn.queue.whois[line.arguments[1]], 
								server: serverName, from: realServerName});
				
				delete this.conn.queue.whois[line.arguments[1]];
				break;
			case '321':
				this.conn.emit('pass_to_client', {type: 'listedchan', channel: 'Channel', users: 'Users', topic: 'Topic',
								server: serverName, from: realServerName});
				break;
			case '322':
				this.conn.emit('pass_to_client', {type: 'listedchan', channel: line.arguments[1], users: line.arguments[2], topic: line.trailing,
								server: serverName, from: realServerName});
				break;
			case 'CAP':
				// might come in the future, who knows
				this.conn.write('CAP END');
				break;
		}
	}
}

class IRCConnection extends EventEmitter {
	constructor(providedInfo, globalConfig, extras) {
		super();

		this.globalConfig = globalConfig;
		this.extras = extras || { authenticationSteps: [], ctcps: {} };
		this.config = {
			nickname: 'teemant',
			username: globalConfig.username,
			realname: globalConfig.realname,
			server: 'localhost',
			port: 6667,
			autojoin: [],
			secure: globalConfig.secure_by_default,
			password: '',
			address: '0.0.0.0',
			rejectUnauthorized: globalConfig.rejectUnauthorizedCertificates
		};

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
		return super.on(...args);
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

		this.socket.setEncoding(this.globalConfig.encoding);
		this.socket.setTimeout(this.globalConfig.timeout);

		this.socket.on('error', (data) => {
			this.emit('connerror', {type: 'sock_error', message: 'A socket error occured.', raw: data});
		});

		this.socket.on('lookup', (err, address, family, host) => {
			if(err) {
				this.emit('connerror', {type: 'resolve_error', message: 'Failed to resolve host.'});
			} else {
				this.emit('lookup', {address: address, family: address, host: host});
				this.config.address = address;
			}
		});

		let buffer = '';
		this.socket.on('data', (chunk) => {
			buffer += chunk;
			let data = buffer.split('\r\n');
			buffer = data.pop();
			data.forEach((line) => {
				if(line.indexOf('PING') === 0) {
					this.socket.write('PONG'+line.substring(4)+'\r\n');
					return;
				}
				this.emit('raw', line);
				let parsed = parse(line);
				this.emit('line', parsed);
				this.handler.handleServerLine(parsed);
			});
		});

		this.socket.on('close', (data) => {
			if(!this.queue['close'])
				this.emit('closed', {type: 'sock_closed', raw: data, message: 'Connection closed.'});

			this.connected = false;
			this.authenticated = false;
		});
	}

	authenticate() {
		if (this.config.password)
			this.socket.write('PASS {0}\r\n'.format(this.config.password));
		
		if(this.extras.authenticationSteps) {
			for(let i in this.extras.authenticationSteps) {
				let step = this.extras.authenticationSteps[i];
				step.authenticate(this);
			}
		}

		this.socket.write('USER {0} 8 * :{1}\r\n'.format(this.config.username, this.config.realname));
		this.socket.write('NICK {0}\r\n'.format(this.config.nickname));
	}

	disconnect(message) {
		if(!this.connected) {
			this.emit('connerror', {type: 'sock_closed', message: 'Connection already closed.'});
			return;
		}

		this.queue['close'] = true;
		this.socket.write('QUIT :{0}\r\n'.format(message != null ? message : this.globalConfig.default_quit_msg));
	}

	write(message) {
		if(!this.connected) {
			this.emit('connerror', {type: 'sock_closed', message: 'Connection is closed.'});
			return;
		}
		this.socket.write(message+'\r\n');
	}
	
}

module.exports = IRCConnection;
