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
globalThis.headerValues = [];

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
            const teamA = interaction.options.getString('team_a');
            const teamB = interaction.options.getString('team_b') ?? null;

            var pattern = /^([A-D])([1-9]|1[0-6])-[1-4]$/;
            if(!teamA.match(pattern)) {
                await interaction.reply({
                    content: 'チームAの指定が間違っています',
                    ephemeral: true,
                });
                return;
            }

            if(teamB != null && !teamB.match(pattern)) {
                await interaction.reply({
                    content: 'チームBの指定が間違っています',
                    ephemeral: true,
                });
                return;
            }

            if(teamB != null) {
                var blockA = teamA.substring(0,1);
                var blockB = teamB.substring(0,1);

                if(blockA !== blockB) {
                    await interaction.reply({
                        content: 'チームAとチームBの指定ブロックは統一してください',
                        ephemeral: true,
                    });
                    return;
                }
            }

            await getMatchCard(teamA, teamB).then( function(value) {
                // 非同期処理が成功した場合
                interaction.reply(value);
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

    try {
        if(message.content == 'set list') {
            // 申請リストをセット
            if(APPLICAATION_LIST.length == 0) {
                setAppSheet(process.env.APPLICATION_SHEET_ID).then( function(value) {
                    console.log(value);
                    message.channel.send(value);
                });
                message.channel.send('seted list.');
            }
            console.log(TOURNAMENT_ID);

            if(!TOURNAMENT_ID['A']) {
                if(process.env.TOURNAMENT_SHEET_ID_A != '') {
                    setTnmSheet('A', process.env.TOURNAMENT_SHEET_ID_A).then( function(value) {
                        console.log(value);
                        message.channel.send(value);
                    });
                }
                if(process.env.TOURNAMENT_SHEET_ID_B != '') {
                    setTnmSheet('B', process.env.TOURNAMENT_SHEET_ID_B).then( function(value) {
                        console.log(value);
                        message.channel.send(value);
                    });
                }
                if(process.env.TOURNAMENT_SHEET_ID_C != '') {
                    setTnmSheet('C', process.env.TOURNAMENT_SHEET_ID_C).then( function(value) {
                        console.log(value);
                        message.channel.send(value);
                    });
                }
                if(process.env.TOURNAMENT_SHEET_ID_D != '') {
                    setTnmSheet('D', process.env.TOURNAMENT_SHEET_ID_D).then( function(value) {
                        console.log(value);
                        message.channel.send(value);
                    });
                }
            }
        }

        // パターン `get A1-1 A2-2`などに対応 一度に3チーム以上の取得は不可 別ブロックの取得は不可 
        var pattern = /^get ([A-D])([1-9]|1[0-6])-[1-4]( \1([1-9]|1[0-6])-[1-4]){0,1}$/;
        if(message.content.match(pattern)) {
            var items = message.content.split(' ');
            getMatchCard(items[1], items[2] ?? null).then( function(value) {
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
 * 申請リストを取得する
 * 
 * @param string id
 * @return string
 */
async function setAppSheet(id) {
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const appDoc = new GoogleSpreadsheet(id);
    await appDoc.useServiceAccountAuth(creds);
    await appDoc.loadInfo();

    //申請リストのシート情報
    const appData = await appDoc.sheetsByTitle['申請'];
    const appDatas = await appData.getRows();

    // 申請リストのヘッダー
    headerValues = appData.headerValues;

    appDatas.forEach(function(item) {
        if(item._rawData[headerValues.indexOf('タイムスタンプ')]) {
            APPLICAATION_LIST.push(item._rawData);
        }
    });
    console.log(APPLICAATION_LIST);
    console.log('チーム数：' + APPLICAATION_LIST.length);
    return appDoc.title;
}

/*
 * 対戦表のIDを配列にセットする
 * 
 * @param string id
 * @return string
 */
async function setTnmSheet(block, id) {
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const Tnmdoc = new GoogleSpreadsheet(id);
    await Tnmdoc.useServiceAccountAuth(creds);
    await Tnmdoc.loadInfo();

    // ブロック変数にIDを格納
    TOURNAMENT_ID[block] = id;
    return Tnmdoc.title;
}

/*
 * 対戦表のチーム番号からチーム情報を取得する
 * 
 * @param string teamA
 * @param string teamB
 * @return string
 */
async function getMatchCard(teamA, teamB = null) {
    const block = teamA.substring(0,1);
    const creds = require(process.env.API_KEY_JSON); // ダウンロードしたJSON
    const getDoc = new GoogleSpreadsheet(TOURNAMENT_ID[block]);
    await getDoc.useServiceAccountAuth(creds);
    await getDoc.loadInfo();

    const teamName = headerValues.indexOf('チーム名')
    const teamNameKana = headerValues.indexOf('チーム名のフリガナ')
    const memberName1 = headerValues.indexOf('プレイヤー名(代表者)')
    const memberName2 = headerValues.indexOf('プレイヤー名(Player2)')
    const memberName3 = headerValues.indexOf('プレイヤー名(Player3)')
    const memberName4 = headerValues.indexOf('プレイヤー名(Player4)')
    const teamComment = headerValues.indexOf('コメントや意気込みなど')

    try{
        //トーナメント情報を取得
        const sheetTournament = await getDoc.sheetsByTitle['チーム一覧'];
        await sheetTournament.loadCells('B:F');

        // Aチームの情報取得
        var teamAInfo = await getTeamInfo(teamA);
        for(var i=0;i<sheetTournament.rowCount;i++) {
            // row: i , column: 1(B列), 4(E列)
            if(sheetTournament.getCell(i, 1).value == teamAInfo['blockNum']) {
                if(sheetTournament.getCell(i, 4).value == teamAInfo['rank']) {
                    teamAInfo['teamName'] = sheetTournament.getCell(i, 5).value
                    break;
                }
            }
        }
        if(!teamAInfo['teamName']) {
            return teamAInfo['blockNum'] + '-' + teamAInfo['rank'] + 'チームが確定していません';
        }

        console.log(teamAInfo);

        var teamAList = APPLICAATION_LIST.filter(function(item) {
            return item[teamName] == teamAInfo['teamName'];
        })[0];

        // Bチームが指定されていれば情報取得
        if(teamB != null) {
            var teamBInfo = await getTeamInfo(teamB);
            for(var i=0;i<sheetTournament.rowCount;i++) {
                // row: i , column: 1(B列), 4(E列)
                if(sheetTournament.getCell(i, 1).value == teamBInfo['blockNum']) {
                    if(sheetTournament.getCell(i, 4).value == teamBInfo['rank']) {
                        teamBInfo['teamName'] = sheetTournament.getCell(i, 5).value
                        break;
                    }
                }
            }
            if(!teamBInfo['teamName']) {
                return teamBInfo['blockNum'] + '-' + teamBInfo['rank'] + 'チームが確定していません';
            }
            var teamBList = APPLICAATION_LIST.filter(function(item) {
                return item[teamName] == teamBInfo['teamName'];
            })[0];
        }
        console.log(teamAList);
        var card = "-------------------------------------------------\n"
        + "\n"
        + teamAInfo['blockNum'] + '-' + teamAInfo['rank'] + "「" + teamAList[teamName] + "」" 
        
        if(teamB != null) {
            card = card + "vs\n"
            + teamBInfo['blockNum'] + '-' + teamBInfo['rank'] + "「" + teamBList[teamName] + "」\n\n"
        } else {
            card = card + "\n\n"
        }

        card = card + "（" + teamAList[teamNameKana] + "）\n"
        + "「" + teamAList[teamName] + "」\n"
        + teamAList[memberName1] + "\n"
        + teamAList[memberName2] + "\n"
        + teamAList[memberName3] + "\n"
        + teamAList[memberName4] + "\n"
        + "コメント：" + (teamAList[teamComment] != "" ? teamAList[teamComment] : "(無し)" ) + "\n\n"
        
        if(teamB != null) {
            card = card + "（" + teamBList[teamNameKana] + "）\n"
            + "「" + teamBList[teamName] + "」\n"
            + teamBList[memberName1] + "\n"
            + teamBList[memberName2] + "\n"
            + teamBList[memberName3] + "\n"
            + teamBList[memberName4] + "\n"
            + "コメント：" + (teamBList[teamComment] != "" ? teamBList[teamComment] : "(無し)" ) + "\n"
        }
        card = card + "------------------------------------------------";
        return card;
    } catch (error) {
        console.error(error);
    }
}

/*
 * チーム番号から情報を取得する
 * 
 * @param string team
 * @return array
 */
async function getTeamInfo(team) {
    // 本選進出番号 
    var rank = '';
    // ブロック
    var blockNum = team.substring(0, team.indexOf('-'));
    switch (team.substring(team.length-1, team.length)) {
        case '1':
            rank = '①';
            break;
        case '2':
            rank = '②';
            break;
        case '3':
            rank = '③';
            break;
        case '4':
            rank = '④';
            break;
    }
    return {
        'rank': rank,
        'blockNum': blockNum
    };
}