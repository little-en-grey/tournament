const { SlashCommandBuilder  } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('settnm')
        .setDescription('対戦表IDを登録')
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
        .addStringOption(option =>
            option.setName('tnm_id')
                .setDescription('対戦表のスプレッドシートID')
				.setRequired(true)),
    async execute(interaction) {
        
    }
}