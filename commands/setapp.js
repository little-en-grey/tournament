const { SlashCommandBuilder  } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setapp')
        .setDescription('申請リストIDを登録')
        .addStringOption(option =>
            option.setName('app_id')
                .setDescription('申請リストのスプレッドシートID')
				.setRequired(true)),
    async execute(interaction) {
        
    }
}