import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Color, Team, Players, Book } from "../helpers/types/graphql-types";

export enum AllColours {
  Red = 'Red',
  Green = 'Green',
  Bkue = 'Bkue',
  White = 'White',
  Black = 'Black'
}

export type HttpResponse = {
  statusCode: number,
  headers: object,
  body: string
}


const tableName = process.env.TABLE_NAME;
const bookTableName = process.env.BOOK_TABLE_NAME;
const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);


export const handler = async (event: any) => {
  switch (event.info.fieldName) {
    case 'getTeam':
      return await getTeam(event.arguments.teamName);
    case 'addTeam':
      return await addTeam(event.arguments);
    case 'getTeamColors':
      return getTeamColors();
    case 'addBook':
      return addBook(event.arguments);
    case 'getBook':
      return getBook(event.arguments.bookName);
    default:
      throw new Error("Handler not found");
    break;
  }
};  



const getBook = async (bookName: string) => {
  const params = {
    TableName: 'AbeLkcylStackBookTable',
    Key: { bookName }
  };
  try {
    const bookDbRet = await dynamo.send(new GetCommand(params));
    if (bookDbRet.Item){
      return bookDbRet.Item
    }
    return null;
  } catch (err) {
    console.error(`Error getting book from  bookName ${bookName}`, err);
    throw new Error(`Failed to fetch book ${bookName} from ${bookTableName} because: ${err}`);
  }
};

const addBook = async(args: Book): Promise<Book> => {
  const params = {
    TableName: bookTableName,
    Item: args,
  };
  try {
    await dynamo.send( new PutCommand(params));
    return args
  } catch (err) {
    console.error(`Error adding book ${args.bookName}`, err);
    throw new Error(`Failed to add book ${args.bookName} from ${JSON.stringify(args)} because: ${err}`);
  }
}


const getTeam = async (teamName: string) => {
  const params = {
    TableName: tableName,
    Key: { teamName }
  };
  try {
    const teamDynamoReturn = await dynamo.send(new GetCommand(params))
    if(teamDynamoReturn.Item) {
      return teamDynamoReturn.Item;
    }
    return null;
  } catch (err) {
    console.error(`Error getting team from team name ${teamName}`, err);
    throw new Error('Failed to fetch team from DynamoDB');
  }
}


const addTeam = async (args: any) => {
  console.log('potato', args);
  const params = {
    TableName: tableName,
    Item: args,
  };
  const sampleTeam:Team = {
    teamId:'a', 
    teamName: 'b',   
    captianEmail: 'a',
    captianName: 'a',
    managerEmail: 'a',
    managerName: "a",
    players: [{id: '1', name: 'potato', verified: false}],
    teamColor: {name:"red", available:false}
  }
  return sampleTeam;
}

const getTeamColors = async(): Promise<Array<Color>> => {
  const scanParams = {
    TableName: tableName,
    ProjectionExpression: "teamColor"
  };

  const scanResults: Set<Color> = new Set();
  let items;
  try{
    do {
      items = await dynamo.send(new ScanCommand(scanParams));
      items.Items?.forEach((item) => {
        if (item.teamColor && item.teamColor.name) {
          scanResults.add(item.teamColor as Color);
        }
      });
    } while (items.LastEvaluatedKey);
  } catch (err) {
    console.error("Error performing scan on DynamoDB", err);
    throw new Error('Failed to fetch team colors from DynamoDB');
  }
  return Array.from(scanResults);

}
