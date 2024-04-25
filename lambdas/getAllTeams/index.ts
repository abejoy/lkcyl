
export const handler = async (event: any): Promise<any> => {
    console.log("Request:", JSON.stringify(event, undefined, 2));
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `Hello from Lambda!`,
    };
};  