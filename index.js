// discord
const { Client, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs')
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

// gss
const { GoogleSpreadsheet } = require('google-spreadsheet');

// .env読み込み
const dotenv = require('dotenv');
dotenv.config();

// 申請リストセット
globalThis.TOURNAMENT_ID = [];
globalThis.APPLICAATION_LIST = [];

// コマンド取得
const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[command.data.name] = command
}


client.once(Events.ClientReady, async (c) => {
    // コマンド登録
    const data = []
    for (const commandName in commands) {
        data.push(commands[commandName].data)
    }
    await client.application.commands.set(data);

    // 起動した時に"Ready!"とBotの名前をコンソールに出力する
	console.log(`Ready! (${c.user.tag})`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    // コマンド実行
    const command = commands[interaction.commandName];
    try {
        if (interaction.commandName === "setapp") {
            const appId = interaction.options.getString('app_id');
            setAppSheet(appId).then( function(value) {
                // 非同期処理が成功した場合
                interaction.reply('申請リストID登録: ' + value);
            });
            
        } else if (interaction.commandName === "settnm") {
            const tnmId = interaction.options.getString('tnm_id');
            const blockId = interaction.options.getString('tnm_block');
            setTnmSheet(blockId, tnmId).then( function(value) {
                // 非同期処理が成功した場合
                interaction.reply(blockId + 'ブロック対戦表ID登録: ' + value);
            });

        } else if (interaction.commandName === "get") {
            const round = interaction.options.getInteger('round');
            const match = interaction.options.getInteger('match');
            const tnmBlock = interaction.options.getString('tnm_block');

            await getMatchCard(tnmBlock, round, match).then( function(value) {
                // 非同期処理が成功した場合
                interaction.reply({ content: value, ephemeral: true  });
            });
        }
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'シートIDが正しく登録できませんでした',
            ephemeral: true,
        })
    }
});

client.on(Events.MessageCreate, message => {
    // Botには反応しないようにする
    if (message.author.bot) return;
    // 指定のサーバー以外では動作しないようにする
    if (message.guild.id !== process.env.SERVER_TOKEN) return;

    console.log(globalThis.APPLICAATION_LIST.length);

    try {
        if(globalThis.APPLICAATION_LIST.length == 0) {
            setAppSheet(process.env.APPLICATION_SHEET_ID).then( function(value) {
                console.log(value);
            });
        }

        console.log(globalThis.TOURNAMENT_ID);

        if(!globalThis.TOURNAMENT_ID['A']) {
            if(process.env.TOURNAMENT_SHEET_ID_A != '') {
                setTnmSheet('A', process.env.TOURNAMENT_SHEET_ID_A).then( function(value) {
                    console.log(value);
                });
            }
            if(process.env.TOURNAMENT_SHEET_ID_B != '') {
                setTnmSheet('B', tnprocess.env.TOURNAMENT_SHEET_ID_B).then( function(value) {
                    console.log(value);
                });
            }
            if(process.env.TOURNAMENT_SHEET_ID_C != '') {
                setTnmSheet('C', process.env.TOURNAMENT_SHEET_ID_C).then( function(value) {
                    console.log(value);
                });
            }
            if(process.env.TOURNAMENT_SHEET_ID_D != '') {
                setTnmSheet('D', process.env.TOURNAMENT_SHEET_ID_D).then( function(value) {
                    console.log(value);
                });
            }
        }

        var pattern = /^card [A-D] [0-9] [0-9]$/;
        if(message.content.match(pattern)) {
            var items = message.content.split(' ');
            getMatchCard(items[1], parseInt(items[2]), parseInt(items[3])).then( function(value) {
                // 非同期処理が成功した場合
                message.channel.send(value);
            });
        }
    } catch (error) {
        console.error(error);
    }
});

client.login(process.env.DISCORD_TOKEN)

/*
 * 
 * 
 * 
 * 
 */
async function setAppSheet(id) {
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const appDoc = new GoogleSpreadsheet(id);
    await appDoc.useServiceAccountAuth(creds);
    await appDoc.loadInfo();

    //申請リストのシート情報
    const appData = await appDoc.sheetsByTitle['申請'];
    const appDatas = await appData.getRows();

    appDatas.forEach(function(item) {
        if(item._rawData[0]) {
            globalThis.APPLICAATION_LIST.push(item._rawData);
        }
    });
    console.log('チーム数：' + globalThis.APPLICAATION_LIST.length);
    return appDoc.title;
}

/*
 * 
 * 
 * 
 * 
 */
async function setTnmSheet(block, id) {
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const Tnmdoc = new GoogleSpreadsheet(id);
    await Tnmdoc.useServiceAccountAuth(creds);
    await Tnmdoc.loadInfo();

    // ブロック変数にIDを格納
    globalThis.TOURNAMENT_ID[block] = id;
    return Tnmdoc.title;
}

/*
 * 
 * 
 * 
 * 
 */
async function getMatchCard(block, round, match) {
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const getDoc = new GoogleSpreadsheet(globalThis.TOURNAMENT_ID[block]);
    await getDoc.useServiceAccountAuth(creds);
    await getDoc.loadInfo();

    switch(round) {
        case 1:
            var startColumn = 0;
            var range = 'A:D';
            break;
        case 2:
            var startColumn = 6;
            var range = 'G:J';
            break;
        case 3:
            var startColumn = 12;
            var range = 'M:P';
            break;
        case 4:
            var startColumn = 18;
            var range = 'S:V';
            break;
        case 5:
            var startColumn = 24;
            var range = 'Y:AB';
            break;
    }

    //トーナメント情報を取得
    const sheetTournament = await getDoc.sheetsByTitle['トーナメント'];
    await sheetTournament.loadCells(range);

    var teamA = [];
    var teamB = [];

    var roundOneRows = [];

    for(var i=0;i<sheetTournament.rowCount;i++) {
        
        if(sheetTournament.getCell(i, startColumn).value !== null) {
            roundOneRows.push({'row': i, 'number': sheetTournament.getCell(i, startColumn).value, 'team': sheetTournament.getCell(i, startColumn + 1).value});
        }
        if(i > 84) {
            break;
        }
    }

    var skip = false;

    await roundOneRows.forEach(function(item, index) {
        if(item.number.indexOf('観戦') > 0) {
            if(!skip) {
                teamA.push(roundOneRows[index + 1]);
                if(roundOneRows.length >= index + 3) {
                    if(roundOneRows[index + 2].number.indexOf('観戦') > 0) {
                        teamB.push(roundOneRows[index + 3]);
                        skip = true;
                    } else {
                        teamB.push(roundOneRows[index + 2]);
                    }
                }
            } else {
                skip = false;
            }
        }
    });

    try {
        var teamAList = globalThis.APPLICAATION_LIST.filter(function(item) {
            return item[1] == teamA[match - 1].team;
        })[0];

        var teamBList = globalThis.APPLICAATION_LIST.filter(function(item) {
            return item[1] == teamB[match - 1].team;
        })[0];

        var card = "-------------------------------------------------\n"
        + block + "ブロック　" + round + "回戦\n"
        + teamA[match - 1].number + "「" + teamAList[1] + "」vs\n"
        + teamB[match - 1].number + "「" + teamBList[1] + "」\n\n"
        
        + "（" + teamAList[2] + "）\n"
        + "「" + teamAList[1] + "」\n"
        + teamAList[4] + "\n"
        + teamAList[6] + "\n"
        + teamAList[8] + "\n"
        + teamAList[10] + "\n"
        + "コメント：" + (teamAList[12] != "" ? teamAList[12] : "(無し)" ) + "\n\n"
        
        + "（" + teamBList[2] + "）\n"
        + "「" + teamBList[1] + "」\n"
        + teamBList[4] + "\n"
        + teamBList[6] + "\n"
        + teamBList[8] + "\n"
        + teamBList[10] + "\n"
        + "コメント：" + (teamBList[12] != "" ? teamBList[12] : "(無し)" ) + "\n"
        + "------------------------------------------------";
        return card;
    } catch (error) {
        console.error(error);
    }
}