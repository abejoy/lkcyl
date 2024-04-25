#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LkcylStack } from '../lib/lkcyl-stack';
import * as path from 'path';
import { FrontEndStack } from '../lib/front-end-stack';

const replaceNonAlphaNumHyphens = (input?: string, replacement = "-") =>
  input?.replace(/[^A-z0-9-]|_/gu, replacement) || '';

const stackName = replaceNonAlphaNumHyphens(process.env.STAGE);

const app = new cdk.App();
const backendStack = new LkcylStack(app, `${stackName}LkcylStack`, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new FrontEndStack(app, `${stackName}FrontEndStack`, {
  path: path.join(__dirname, '..', 'frontend', 'build'),
  backendStack
})