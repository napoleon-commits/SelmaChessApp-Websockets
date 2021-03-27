const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const tableName = 'SelmaChessWebsocketUsers';

exports.handler = async event => {

    const {connectionId: connectionID} = event.requestContext;

    const scanData = await Dynamo.scan({
        TableName: tableName,
        FilterExpression: "connectionID = :ci",
        ExpressionAttributeValues: {
            ":ci": connectionID,
        }
    });

    if(scanData.Items.length > 0){
        await Dynamo.delete(scanData.Items[0].ID, tableName);
    }

    return Responses._200({message: 'disconnected'});
}