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


export const getHttpResponse = <T>(data: T): HttpResponse => {
  return {
      statusCode: 200,
      headers: {
          'Content-Type': 'application/json',

          // 👇 allow CORS for all origins
          'Access-Control-Allow-Origin': '*', // Required for CORS support to work
          'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
          'Access-Control-Allow-Credentials': 'true', // Required for cookies, authorization headers with HTTPS
          'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
      },
      body: JSON.stringify(data)
  };
}

export const handler = async (event: any): Promise<any> => {
    console.log("Request:", JSON.stringify(event, undefined, 2));
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `Hello from Lambda!`,
    };
};  