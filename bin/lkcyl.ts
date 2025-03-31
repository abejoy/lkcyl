#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LkcylStack } from "../lib/lkcyl-stack";
import * as path from "path";
import { FrontEndStack } from "../lib/front-end-stack";
import { CertificateStack } from "../lib/certificate-stack";

export type DomainNameType = {
  semiUrl: string;
  fullUrl: string;
};
const semiUrl = "lkcyl.com";
const fullUrl = `www.${semiUrl}`;
const hostedZoneId = "Z03555901I0K5QXEDMKGD";
const certificateArn =
  "arn:aws:acm:us-east-1:220329959474:certificate/4d52315d-fcdd-4d9e-92cc-504cde3e21e5"; //update this

const replaceNonAlphaNumHyphens = (input?: string, replacement = "-") =>
  input?.replace(/[^A-z0-9-]|_/gu, replacement) || "";

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
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// const certificateStack = new CertificateStack(
//   app,
//   `${stackName}CertificateStack`,
//   {
//     // env: {region: 'us-east-1', account:'220329959474'},
//     env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
//     domainName: { semiUrl, fullUrl },
//     hostedZoneId,
//   }
// );

new FrontEndStack(app, `${stackName}FrontEndStack`, {
  path: path.join(__dirname, "..", "frontend", "build"),
  domainName: fullUrl,
  hostedZoneId,
  backendStack,
  certificateArn,
});
