import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { AuthorizationType, GraphqlApi, SchemaFile } from 'aws-cdk-lib/aws-appsync';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { BlockPublicAccess, BucketPolicy } from 'aws-cdk-lib/aws-s3';



// import * as sqs from 'aws-cdk-lib/aws-sqs';
export class LkcylStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = `${id}EmailBucket`
    const emailBucket = new s3.Bucket(this, bucketName, {
        bucketName: bucketName.toLowerCase(),
        publicReadAccess: false,
        blockPublicAccess: new BlockPublicAccess({  // Correctly disables all block public access settings
          blockPublicAcls: false,
          ignorePublicAcls: false,
          blockPublicPolicy: false,
          restrictPublicBuckets: false
        }),
        removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Attach a bucket policy that allows public read access
    const bucketPolicy = new BucketPolicy(this, 'BucketPolicy', {
      bucket: emailBucket,  // Associate policy with the created bucket
    });

    bucketPolicy.document.addStatements(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [emailBucket.arnForObjects('*')],  // Apply the policy to all objects
      principals: [new cdk.aws_iam.AnyPrincipal()],  // Allow all users
    }));


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
          `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${id}SendEmailLambda:*`,
        ],
      }),
    ];





    //define team table

    const tableName = `${id}TeamTable`;
    const teamTable = new Table(this, tableName, {
      partitionKey: {name: 'teamName', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName,
    });


    //email service
    //role
    const roleForEmailLambda = new iam.Role(this, `${id}EmailLambdaRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    const roleForEmailLambdaPolicy = new iam.ManagedPolicy(this, `${id}EmailLambdaPolicy`, {
      statements: [
        ...allowLogs,
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ses:SendEmail', 'ses:SendRawEmail'],
          resources: ['*']
        }),
        // new iam.PolicyStatement({
        //   effect: iam.Effect.ALLOW,
        //   actions: ["s3:Get", "s3:GetObject", "s3:PutObject"],
        //   resources: ["*"],
        // }),
      ],
      roles: [roleForEmailLambda],
    });
    emailBucket.grantRead(roleForEmailLambda);
    //lambda
    const emailLambdaFunction = new NodejsFunction(this, `${id}SendEmailLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/emailService/index.ts'),
      role: roleForEmailLambda,
      environment: {
        EMAIL_BUCKET_NAME: emailBucket.bucketName
      }
    });

    //team service
    //role
    const roleForTeamLambda = new iam.Role(this, `${id}TeamLambdaRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    const roleForLambdaPolicy = new iam.ManagedPolicy(
      this,
      `${id}RoleForLambdaPolicy`,
      {
        statements: [
          ...allowLogs,
          // new iam.PolicyStatement({
          //   effect: iam.Effect.ALLOW,
          //   actions: ["s3:Get", "s3:GetObject", "s3:PutObject"],
          //   resources: ["*"],
          // }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:Query', 'dynamodb:UpdateItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: [emailLambdaFunction.functionArn],
          }),
        ],
        roles: [roleForTeamLambda],
      }
    );
    //lambda
    const teamLambdaFunction = new NodejsFunction(this, `${id}GetTeamDataLambda`, {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, 'lambdas/teamService/index.ts'),
      environment: {
        TABLE_NAME: teamTable.tableName,
        EMAIL_LAMBDA_NAME: emailLambdaFunction.functionName,
      },
      role: roleForTeamLambda
    });
    teamTable.grantFullAccess(teamLambdaFunction);

    emailLambdaFunction.grantInvoke(teamLambdaFunction);


    //app sync api

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
    lambdaDs.createResolver(`${id}GetAllTeam`, {
      typeName: 'Query',
      fieldName: 'getAllTeam'
    });

    lambdaDs.createResolver(`${id}GetTeam`, {
      typeName: 'Query',
      fieldName: 'getTeam'
    });

    lambdaDs.createResolver(`${id}AddTeam`, {
      typeName: 'Mutation',
      fieldName: 'addTeam'
    });

    lambdaDs.createResolver(`${id}UpdateTeamPlayers`, {
      typeName: 'Mutation',
      fieldName: 'updateTeamPlayers'
    });

    lambdaDs.createResolver(`${id}GetAvailableColors`, {
      typeName: 'Query',
      fieldName: 'getAvailableColors'
    });

    lambdaDs.createResolver(`${id}GetTableData`, {
      typeName: 'Query',
      fieldName: 'getTableData'
    });

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
