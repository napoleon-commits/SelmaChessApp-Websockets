const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WS = require('../common/WebSocketMessage');

const tableName = 'SelmaChessWebsocketUsers';


exports.handler = async (event) => {
    const
    {
        connectionId: connectionID,
        domainName,
        stage,
    } = event.requestContext;
    const {username, elo} = event.queryStringParameters;
    const data = {
        ID: username,
        elo: Number(elo),
        connectionID,
        domainName,
        stage,
        gameStatus: "",
        fens: ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'],
    };
    try {
        const scanData = await Dynamo.scan({
            TableName: tableName,
            FilterExpression: "opponentsID = :oid",
            ExpressionAttributeValues: {
                ":oid": "",
            },
        });
        if(scanData.Items && scanData.Items.length > 0){
            const randomOpponentNumber = Math.floor(Math.random()*scanData.Items.length);
            const record = await Dynamo.get(scanData.Items[randomOpponentNumber].ID, tableName);
            const {domainName, stage, connectionID, color: opponentsColor,} = record;
            data['color'] = (opponentsColor === 'white') ? 'black' : 'white';
            data['opponentsID'] = scanData.Items[randomOpponentNumber].ID;
            await Dynamo.write(data, tableName);
            await WS.send({domainName,stage,connectionID, message: JSON.stringify({foundOpponent: true})});
            await Dynamo.update({
                TableName: tableName,
                Key: {
                    ID: scanData.Items[randomOpponentNumber].ID,
                },
                UpdateExpression: "set opponentsID = :oid",
                ExpressionAttributeValues: {
                    ":oid": String(username),
                },
                ReturnValues: "UPDATED_NEW",
            });
        }
        else if(scanData.Items && scanData.Items.length === 0){
            data['color'] = (((Math.floor(Math.random() * (10**13))) % 2 === 0)? 'white': 'black');
            data['opponentsID'] = "";
            await Dynamo.write(data, tableName);
        }
        else {
            return Responses._400({message: 'scan data error.'});    
        }
    }
    catch(error){
        return Responses._400({message: String(error)});
    }
    return Responses._200({message: 'connected'});
}