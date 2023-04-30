const { SlashCommandBuilder  } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('get')
        .setDescription('対戦カードを取得')
        .addStringOption(option =>
            option.setName('team_a')
                .setDescription('取得したいチーム番号①')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team_b')
                .setDescription('取得したいチーム番号②')),
    async execute(interaction) {
    }
}