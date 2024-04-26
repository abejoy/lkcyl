import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import path, { join } from "path";
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { AuthorizationType, GraphqlApi, SchemaFile } from 'aws-cdk-lib/aws-appsync';

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





    //define team table

    const tableName = `${id}TeamTable`;
    const teamTable = new Table(this, tableName, {
      partitionKey: {name: 'teamId', type: AttributeType.STRING},
      sortKey: {name: 'teamName', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName,
    });


    const bookTableName = `${id}BookTable`;
    const bookTable = new Table(this, bookTableName, {
      partitionKey: {name: 'bookName', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: bookTableName,
    });



    //roles
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
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:Query', 'dynamodb:UpdateItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
            resources: ["*"],
          }),
        ],
        roles: [roleForLambda],
      }
    );



    // Define the API Gateway

    // Define the Lambda resource



    const teamLambdaFunction = new NodejsFunction(this, `${id}GetTeamDataLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/getAllTeams/index.ts'),
      environment: {
        TABLE_NAME: teamTable.tableName,
        BOOK_TABLE_NAME: bookTable.tableName,
      },
      role: roleForLambda
    });
    bookTable.grantFullAccess(teamLambdaFunction);
    // teamTable.grantReadWriteData(teamLambdaFunction);

    // const getAvailableColoursFunction = new NodejsFunction(this, `${id}GetAvailableColoursLambda`, {
    //   runtime: Runtime.NODEJS_18_X,
    //   handler: 'index.handler',
    //   entry: join(__dirname, 'lambdas/getAvailableColours/index.ts'),
    //   role: roleForLambda
    // });


    const api = new GraphqlApi(this, `${id}Api`, {
      name: 'team-api',
      schema: SchemaFile.fromAsset(join(__dirname, 'graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
        },
      },
      xrayEnabled: true
    });


    const lambdaDs = api.addLambdaDataSource(`${id}LambdaDataSource`, teamLambdaFunction);

    //Define resolvers
    lambdaDs.createResolver(`${id}GetTeam`, {
      typeName: 'Query',
      fieldName: 'getTeam'
    });

    lambdaDs.createResolver(`${id}AddTeam`, {
      typeName: 'Mutation',
      fieldName: 'addTeam'
    });

    lambdaDs.createResolver(`${id}GetAvailableColors`, {
      typeName: 'Query',
      fieldName: 'getAvailableColors'
    });

    lambdaDs.createResolver(`${id}GetBook`, {
      typeName: 'Query',
      fieldName: 'getBook'
    });

    lambdaDs.createResolver(`${id}AddBook`, {
      typeName: 'Mutation',
      fieldName: 'addBook'
    });



    // const api = new apigateway.RestApi(this, `${id}TeamEndpointApi`, {
    //   restApiName: `${id}Api`,
    //   description: 'backend for lkcyl app',
    // });

    // api.root.addCorsPreflight({
    //   allowOrigins: ['*'],
    //   allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'],
    //   allowCredentials: true,
    // })


    // const teamResource = api.root.addResource('teams');
    // teamResource.addMethod(HttpMethod.GET, new apigateway.LambdaIntegration(getTeamDataFunction, {requestTemplates}));
    // teamResource.addMethod(HttpMethod.PUT,  new apigateway.LambdaIntegration(storeTeamDataFunction, {requestTemplates}));

    // const colourResource = api.root.addResource('colours');
    // colourResource.addMethod(HttpMethod.GET, new apigateway.LambdaIntegration(getAvailableColoursFunction));

    // Output the API Gateway endpoint URL
    new cdk.CfnOutput(this, `${id}ApiEndpoint`, {
      value: api.graphqlUrl,
      description: 'URL for the API Gateway endpoint'
    });

    new cdk.CfnOutput(this, `${id}ApiKey`, {
      value: api.apiKey || 'no key',
      description: 'URL for the API Gateway endpoint'
    });


  }
}
