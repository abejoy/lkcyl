export const handler = async (event: any): Promise<any> => {
    const data = JSON.parse(event.body);
    console.log("Request:", JSON.stringify(event));
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
      body: JSON.stringify([{colorName: 'red', available: true}, {colorName: 'green', available: true}])
    };
}