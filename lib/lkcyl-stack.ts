import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import path, { join } from "path";

// import * as sqs from 'aws-cdk-lib/aws-sqs';
export class LkcylStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const requestTemplates = { "application/json": '{ "statusCode": "200" }' };

    const allowLogs = [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:*"],
        resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:*"],
        resources: [
          `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${id}imageToS3Lambda:*`,
        ],
      }),
    ];
    const roleForLambda = new iam.Role(this, `${id}OpenAILambdaRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    const roleForLambdaPolicy = new iam.ManagedPolicy(
      this,
      `${id}RoleForLambdaPolicy`,
      {
        statements: [
          ...allowLogs,
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:Get", "s3:GetObject", "s3:PutObject"],
            resources: ["*"],
          }),
        ],
        roles: [roleForLambda],
      }
    );



    // Define the API Gateway

    // Define the Lambda resource



    const getTeamDataFunction = new NodejsFunction(this, `${id}GetTeamDataLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/getAllTeams/index.ts'),
      role: roleForLambda
    });

    // const getTeamDataFunction = new lambda.Function(this, `${id}GetTeamDataLambda`, {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset('lib/lambdas/getAllTeams'),
    //   role: roleForLambda,
    // });


    const storeTeamDataFunction = new NodejsFunction(this, `${id}StoreTeamDataLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/storeTeam/index.ts'),
      role: roleForLambda
    });

    // const storeTeamDataFunction = new lambda.Function(this, `${id}StoreTeamDataLambda`, {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset('lib/lambdas/storeTeam'),
    //   role: roleForLambda,
    // });

    const getAvailableColoursFunction = new NodejsFunction(this, `${id}GetAvailableColoursLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/getAvailableColours/index.ts'),
      role: roleForLambda
    });

    // const getAvailableColoursFunction = new lambda.Function(this, `${id}GetAvailableColoursLambda`, {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset('lib/lambdas/getAvailableColours'),
    //   role: roleForLambda,
    // });



    const api = new apigateway.RestApi(this, `${id}TeamEndpointApi`, {
      restApiName: `${id}Api`,
      description: 'backend for lkcyl app',
    });

    api.root.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'],
      allowCredentials: true,
    })


    const teamResource = api.root.addResource('teams');
    teamResource.addMethod(HttpMethod.GET, new apigateway.LambdaIntegration(getTeamDataFunction, {requestTemplates}));
    teamResource.addMethod(HttpMethod.PUT,  new apigateway.LambdaIntegration(storeTeamDataFunction, {requestTemplates}));

    const colourResource = api.root.addResource('colours');
    colourResource.addMethod(HttpMethod.GET, new apigateway.LambdaIntegration(getAvailableColoursFunction));

    // Output the API Gateway endpoint URL
    new cdk.CfnOutput(this, `${id}ApiEndpoint`, {
      value: api.url,
      description: 'URL for the API Gateway endpoint'
    });


  }
}
