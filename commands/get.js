const { SlashCommandBuilder  } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('get')
        .setDescription('対戦カードを取得')
        .addStringOption(option =>
            option.setName('tnm_block')
                .setDescription('対戦表のブロック')
                .setRequired(true)
                .addChoices(
                    {name:'A', value:'A'},
                    {name:'B', value:'B'},
                    {name:'C', value:'C'},
                    {name:'D', value:'D'}
                ))
        .addIntegerOption(option =>
            option.setName('round')
                .setDescription('何回戦')
				.setRequired(true))
        .addIntegerOption(option =>
            option.setName('match')
                .setDescription('トーナメント表の上から何個目の試合')
                .setRequired(true)),
    async execute(interaction) {
    }
}