const kate = require('kate-sleep');
const { Plugin } = require('../../../fake_node_modules/powercord/entities');

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
}

function componentFromStr(numStr, percent) {
	var num = Math.max(0, parseInt(numStr, 10));
	return percent ? Math.floor((255 * Math.min(100, num)) / 100) : Math.min(255, num);
}

function rgbToHex(rgb) {
	var rgbRegex = /^\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*$/;
	var result,
		r,
		g,
		b,
		hex = '';
	if ((result = rgbRegex.exec(rgb))) {
		r = componentFromStr(result[1], result[2]);
		g = componentFromStr(result[3], result[4]);
		b = componentFromStr(result[5], result[6]);

		hex = '0x' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}
	return hex;
}

module.exports = class KateSleepPC extends Plugin {
	startPlugin() {
		powercord.api.commands.registerCommand({
			command: 'kate',
			description: 'get kate commands',
			usage: '{p}kate',
			executor: async args => {
				console.log(args);
				if (!args[0])
					return {
						send: false,
						embed: {
							title: 'Kate commands',
							description: '{p}kate status',
						},
					};

				if (args[0] === 'status') {
					const res = await kate.kate();
					return {
						send: false,
						result: !res.successful
							? `Error: ${res.message}`
							: {
									title: 'Kate Status',
									description: `sleeping: ${res.message.sleeping}`,
							  },
					};
				} else if (args[0] === 'panel') {
					const res = await kate.getColor(args[1]);
					return {
						send: false,
						result: !res.successful
							? `Error: ${res.message}`
							: {
									type: 'rich',
									title: `Panel ${args[1]}`,
									description: `R: ${res.message.r}\nG: ${res.message.g}\nB: ${res.message.b}`,
									color: rgbToHex(`${res.message.r},${res.message.g},${res.message.b}`),
							  },
					};
				} else if (args[0] === 'layout') {
					const res = await kate.layout();
					const embed = { type: 'rich', title: `Panels`, description: `Number of panels: ${res.message.numPanels}`, fields: [] };
					res.message.positionData?.forEach(panel =>
						embed.fields.push({
							name: `Panel ${panel.panelId}`,
							value: `X position: ${panel.x}\nY position: ${panel.y}\nShape Type: ${panel.shapeType}`,
							inline: true,
						})
					);
					return {
						send: false,
						result: !res.successful ? `Error: ${res.message}` : embed,
					};
				} else if (args[0] === 'setColor') {
					if (!args[1]) return { send: false, result: 'You need to pass a panel id' };
					else if (!args[2]) return { send: false, result: 'You need to a hex value' };
					console.log(args[2]);
					const res = await kate.color(hexToRgb(args[2]), args[1]);
					return {
						send: false,
						result: !res.successful ? `Error: ${res.message}` : `successfully changed panel **${args[1]}** to **${args[2]}**`,
					};
				}
				return {
					send: false,
					result: 'Kate says hi',
				};
			},
			autocomplete: args => {
				console.log(args);
				if (!args[0])
					return {
						commands: [{ command: 'status' }, { command: 'panel' }, { command: 'layout' }, { command: 'setColor' }],
						header: 'Kate subcommands',
					};
				else return false;
			},
		});
	}
};
