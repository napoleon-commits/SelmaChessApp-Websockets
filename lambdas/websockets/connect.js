const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

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
            //
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