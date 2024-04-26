export const handler = async (event: any): Promise<any> => {
    const data = JSON.parse(event.body);
    console.log("Request:", JSON.stringify(event));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({messgae: `Store from Lambda!`, data})
    };
}  