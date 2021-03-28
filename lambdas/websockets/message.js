const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WS = require('../common/WebSocketMessage');
const tableName = 'SelmaChessWebsocketUsers';

exports.handler = async (event) => {
    const {connectionId: senderConnectionID} = event.requestContext;
    const body = JSON.parse(event.body);

    try {
        if(body.message === 'init'){
            const scanData = await Dynamo.scan({
                TableName: tableName,
                FilterExpression: "connectionID = :cid",
                ExpressionAttributeValues: {
                    ":cid": String(senderConnectionID),
                },
            });
            if(scanData.Items && scanData.Items.length > 0){
                const senderRecord = await Dynamo.get(scanData.Items[0].ID, tableName);
                const opponentsRecord = await Dynamo.get(senderRecord.opponentsID, tableName);
                const {domainName, stage, connectionID: opponentsConnectionID} = opponentsRecord;
                await WS.send({
                    domainName,
                    stage,
                    connectionID: opponentsConnectionID,
                    message: JSON.stringify({
                        foundOpponent: true
                    }),
                });
            }
        }
    }
    catch(error){
        return Responses._400({message: String(error)});
    }
    return Responses._200({message: 'message'});
};