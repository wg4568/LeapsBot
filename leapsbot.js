const discord = require('discord.js');

const parser = require('./lib/parser.js');
const commands = require('./lib/commands.js');
const secrets = require('./lib/secrets.js');

const client = new discord.Client();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	if (msg.author == client.user) return;

	console.log(msg.content);
});

client.login(secrets.TOKEN);