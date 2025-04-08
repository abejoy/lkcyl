import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { aws_s3 as s3 } from "aws-cdk-lib";
import {
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

interface LkcylStackProps extends cdk.StackProps {
  path: string;
  domainName: string;
  hostedZoneId: string;
  certificateArn: string;
  emailBucket: cdk.aws_s3.Bucket;
}

export class FrontEndStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LkcylStackProps) {
    super(scope, id, props);

    const emailBucket = props.emailBucket;
    const certificateArn = props.certificateArn;
    const bucketName = `${id}LkcylWebsiteBucket`;
    const iamUser = new iam.User(this, `${id}S3AccessUser`, {
      userName: `${id}-s3-access-user`,
    });

    const accessKey = new iam.CfnAccessKey(this, `${id}AccessKey`, {
      userName: iamUser.userName,
    });

    const websiteBucket = new s3.Bucket(this, bucketName, {
      bucketName: bucketName.toLowerCase(),
      accessControl: BucketAccessControl.PRIVATE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    iamUser.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:ListBucket", // List objects in the specific bucket
          "s3:GetObject", // Read objects from the bucket
          "s3:PutObject", // Write objects to the bucket
          "s3:DeleteObject", // Delete objects from the bucket
        ],
        resources: [
          websiteBucket.bucketArn, // Bucket itself
          websiteBucket.arnForObjects("*"), // Objects in the bucket
          emailBucket.bucketArn,
          emailBucket.arnForObjects("*"),
        ],
      })
    );

    // Execute build command
    // try {
    //   exec(`npm run build`, {
    //     cwd: path.join(__dirname, "..", "frontend"),
    //   });
    // } catch (error) {
    //   console.error("Failed to build the frontend:", error);
    //   process.exit(1); // Stop deployment if the build fails
    // }

    // const bucketDeployment = new BucketDeployment(
    //   this,
    //   `${id}BucketDeployment`,
    //   {
    //     destinationBucket: websiteBucket,
    //     sources: [
    //       Source.asset(path.join(__dirname, "..", "frontend", "build")),
    //     ],
    //   }
    // );

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      `${id}OriginAccessIdentity`
    );
    websiteBucket.grantRead(originAccessIdentity);

    const certificate = Certificate.fromCertificateArn(
      this,
      `${id}SiteCertificate`,
      certificateArn
    );

    const websiteDistribution = new Distribution(
      this,
      `${id}WebsiteDistribution`,
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          cachePolicy: CachePolicy.CACHING_DISABLED,
          origin: new S3Origin(websiteBucket, { originAccessIdentity }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        errorResponses: [
          {
            httpStatus: 404, // Handle 404 errors
            responseHttpStatus: 200, // Return a 200 status
            responsePagePath: "/index.html", // Serve index.html for SPA routes
            ttl: cdk.Duration.seconds(0), // Cache duration for error responses
          },
        ],
        domainNames: [props.domainName],
        certificate,
      }
    );

    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      `${id}HostedZone`,
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      }
    );

    const alRecord = new ARecord(this, `${id}SiteAliasRecord`, {
      recordName: props.domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
      zone: hostedZone,
    });

    // // Optionally output the S3 bucket URL
    new cdk.CfnOutput(this, `${id}BucketWebsiteURL`, {
      value: websiteBucket.bucketWebsiteUrl,
      description: "URL of the website hosted on S3",
    });

    new cdk.CfnOutput(this, `${id}AccessKeyId`, {
      value: accessKey.ref, // Access Key ID
      description: "Access Key ID for the S3 bucket",
    });

    new cdk.CfnOutput(this, `${id}SecretAccessKey`, {
      value: accessKey.attrSecretAccessKey, // Secret Access Key
      description: "Secret Access Key for the S3 bucket",
    });

    new cdk.CfnOutput(this, `${id}WebsiteDomainName`, {
      value: websiteDistribution.distributionDomainName,
      description: "URL for the website",
    });

    new cdk.CfnOutput(this, `${id}AllRecordDomainName`, {
      value: alRecord.domainName,
      description: "URL of the website hosted on S3",
    });
  }
}
