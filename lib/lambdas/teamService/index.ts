import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  PutCommandInput,
  GetCommandInput,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";

import {
  Team,
  AvailableColor,
  Color,
  Player,
  PlayerInput,
} from "../helpers/types/graphql-types";
import { EmailTemplate, EmailToSend } from "../emailService";

export type HttpResponse = {
  statusCode: number;
  headers: object;
  body: string;
};

interface ColorCounts {
  [key: string]: number;
}

interface TeamMutationInput extends Team {
  playerNames: string[];
}

const TableName = process.env.TABLE_NAME || "";

const dynamoClient = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

const lambdaClinet = new LambdaClient();

export const handler = async (event: any) => {
  switch (event.info.fieldName) {
    case "getTeam":
      return await getTeam(event.arguments.teamName);
    case "getAllTeam":
      return await getAllTeam();
    case "addTeam":
      return await addTeam(event.arguments);
    case "getAvailableColors":
      return getTeamColors();
    case "getTableData":
      return getTableData();
    case "sendEmailsToCaptianManagers":
      return sendCustomEmail(event.arguments.subject, event.arguments.body);
    case "updateTeamPlayers":
      return updateTeamPlayers(
        event.arguments.teamName,
        event.arguments.players
      );
    default:
      throw new Error("Handler not found");
      break;
  }
};

const updateTeamPlayers = async (
  teamName: string,
  players: PlayerInput[]
): Promise<Team> => {
  try {
    const team = await getTeam(teamName);
    if (!team) {
      throw new Error(`Team not Found`);
    }
    team.players = players;
    await updateTeam(team);
    return team as Team;
  } catch (err) {
    throw new Error(`Failed to update team Players ${JSON.stringify(err)}`);
  }
};

const getTableData = async (): Promise<Array<Array<string>>> => {
  const tableData: Array<Array<string>> = [];
  const scanParams: ScanCommandInput = {
    TableName,
    ProjectionExpression: "teamName, kcylUnit, teamColor, players",
  };
  let data;
  try {
    do {
      data = await dynamo.send(new ScanCommand(scanParams));
      data.Items?.forEach((item) => {
        if (item.teamName) {
          const { teamName, kcylUnit, teamColor, players } = item;
          const rowTable: Array<string> = [
            teamName,
            kcylUnit,
            teamColor,
            areAllPlayersVerified(players),
          ];
          tableData.push(rowTable);
        }
      });
      scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (data.LastEvaluatedKey);
  } catch (err) {
    throw new Error(
      `Failed to fetch Table data  DynamoDB ${JSON.stringify(err)}`
    );
  }
  return tableData;
};

const areAllPlayersVerified = (players: Player[]): string => {
  return String(players.every((player) => player.verified)).toUpperCase();
};

const getAllTeam = async (): Promise<Team[]> => {
  const scanParams: ScanCommandInput = {
    TableName,
  };
  const teamsScanned: Team[] = [];
  let items;
  try {
    do {
      items = await dynamo.send(new ScanCommand(scanParams));
      items.Items?.forEach((item) => {
        if (item.teamName) {
          teamsScanned.push(item as Team);
        }
      });
      scanParams.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (items.LastEvaluatedKey);
  } catch (err) {
    throw new Error("Failed to fetch All team from DynamoDB");
  }
  return teamsScanned;
};

const getTeam = async (teamName: string): Promise<Team | null> => {
  const params: GetCommandInput = {
    TableName,
    Key: { teamName },
  };
  try {
    const teamDynamoReturn = await dynamo.send(new GetCommand(params));
    if (teamDynamoReturn.Item) {
      return teamDynamoReturn.Item as Team;
    }
    return null;
  } catch (err) {
    console.error(`Error getting team from team name ${teamName}`, err);
    throw new Error("Failed to fetch team from DynamoDB");
  }
};
const sendEmail = async (emailsToSend: EmailToSend[]) => {
  const emailLambdaParams: InvokeCommandInput = {
    FunctionName: process.env.EMAIL_LAMBDA_NAME,
    Payload: Buffer.from(JSON.stringify({ emailsToSend })),
  };
  lambdaClinet.send(new InvokeCommand(emailLambdaParams));
  //for logging
  // const response = await lambdaClinet.send(new InvokeCommand(emailLambdaParams));
  // return new TextDecoder("utf-8").decode(response.Payload);
};

const updateTeam = async (team: Team) => {
  const dynamoParams: PutCommandInput = {
    TableName,
    Item: team,
  };
  return dynamo.send(new PutCommand(dynamoParams));
};

const addTeam = async (args: TeamMutationInput) => {
  const {
    teamName,
    teamColor,
    managerEmail,
    managerName,
    captianName,
    captianEmail,
    kcylUnit,
    gender,
    additionalMessage,
    captainPhone,
    managerPhone,
  } = args;
  const isTeamNameTaken: boolean = await checkIfEntryExists(teamName);
  if (isTeamNameTaken) throw new Error(`Team Name: ${teamName} already exists`);

  const players: Player[] = args.playerNames.map((playerName) => ({
    name: playerName,
    verified: false,
  }));

  const teamToAdd: Team = {
    teamName,
    managerName,
    managerEmail,
    captianName,
    captianEmail,
    teamColor,
    players,
    kcylUnit,
    gender,
    additionalMessage,
    captainPhone,
    managerPhone,
  };

  try {
    await updateTeam(teamToAdd);

    const emailsToSendCaptian: EmailToSend = {
      emailAddressToSend: [teamToAdd.captianEmail],
      emailTemplate: EmailTemplate.Captian,
      emailArgs: teamToAdd,
    };

    const emailsToSendManager: EmailToSend = {
      emailAddressToSend: [teamToAdd.managerEmail],
      emailTemplate: EmailTemplate.Manager,
      emailArgs: teamToAdd,
    };
    const emailToAdmin: EmailToSend = {
      emailAddressToSend: [],
      emailTemplate: EmailTemplate.Admin,
      emailArgs: teamToAdd,
    };

    const emailsToSend: EmailToSend[] = [
      emailsToSendCaptian,
      emailsToSendManager,
      emailToAdmin,
    ];
    sendEmail(emailsToSend);
    return teamToAdd;
  } catch (err) {
    throw new Error(`Failed to addteam ${JSON.stringify(err)}`);
  }
};

const sendCustomEmail = (subject: string, body: string): string => {
  return "todo";
};

const checkIfEntryExists = async (teamName: string): Promise<boolean> => {
  const params: GetCommandInput = {
    TableName,
    Key: { teamName },
    ProjectionExpression: "teamName", // Specify a small attribute or one that exists in all records
  };
  try {
    const data = await dynamo.send(new GetCommand(params));
    if (data.Item) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error(`Failed to check if entry exists ${JSON.stringify(err)}`);
  }
};

//todo
const getTeamColors = async (): Promise<Array<AvailableColor>> => {
  const colorCounts: ColorCounts = {};
  const scanParams: ScanCommandInput = {
    TableName,
    ProjectionExpression: "teamColor",
  };
  try {
    let scanResults;
    do {
      scanResults = await dynamo.send(new ScanCommand(scanParams));
      scanResults.Items?.forEach((item) => {
        if (item.teamColor) {
          colorCounts[item.teamColor] = (colorCounts[item.teamColor] || 0) + 1;
        }
      });
      scanParams.ExclusiveStartKey = scanResults.LastEvaluatedKey;
    } while (scanResults.LastEvaluatedKey);
    const availableColors: AvailableColor[] = Object.values(Color).map(
      (color) => ({
        colorName: color,
        available: (colorCounts[color] || 0) < 2,
      })
    );
    return availableColors;
  } catch (err) {
    throw new Error("Failed to fetch All team colors from DynamoDB");
  }
};
