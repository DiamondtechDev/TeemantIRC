function swapSheet(name) {
	document.querySelector("#theme_stylesheet").setAttribute('href', "css/"+name+".css");
}

window.themes = {
	available: {
		default: {
			name: "Default",
			type: "bright",
			nick_pallete: {
				H: [1, 360],
				S: [30, 100],
				L: [30, 70]
			},
			stylesheet: "theme_default",
			default: true,
			colorSamples: {
				toolbar: "#00c7e0",
				background: "#f5f5f5"
			}
		},

		night: {
			name: "Night",
			type: "dark",
			nick_pallete: {
				H: [1, 360],
				S: [30, 100],
				L: [50, 100]
			},
			stylesheet: "theme_night",
			default: false,
			colorSamples: {
				toolbar: "#008e8e",
				background: "#1d1d1d"
			}
		}
	},

	change_theme: function(name) {
		if(name in themes.available) {
			swapSheet(themes.available[name].stylesheet);
			window.irc.config.theme = name;
		}
	}
}
