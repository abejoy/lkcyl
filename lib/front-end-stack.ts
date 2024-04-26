import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { CachePolicy, Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { exec } from 'child_process';
import { LkcylStack } from './lkcyl-stack';
import path from "path";

interface LkcylStackProps extends cdk.StackProps {
    path: string
    backendStack: LkcylStack
}
  

export class FrontEndStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LkcylStackProps) {
        super(scope, id, props);

        const websiteBucket = new s3.Bucket(this, `${id}LkcylWebsiteStack`, {
            accessControl: BucketAccessControl.PRIVATE,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // Execute build command
        try {
            exec(`npm run build`, {
                cwd: path.join(__dirname, '..', 'frontend'),
            });
        } catch (error) {
            console.error('Failed to build the frontend:', error);
            process.exit(1); // Stop deployment if the build fails
        }

        const bucketDeployment = new BucketDeployment(this, `${id}BucketDeployment`, {
        destinationBucket: websiteBucket,
        sources: [Source.asset(path.join(__dirname, '..', 'frontend', 'build'))],
        });

        const originAccessIdentity = new OriginAccessIdentity(this, `${id}OriginAccessIdentity`);
        websiteBucket.grantRead(originAccessIdentity);

        const websiteDistribution = new Distribution(this, `${id}WebsiteDistribution`, {
        defaultRootObject: 'index.html',
        defaultBehavior: {
            cachePolicy: CachePolicy.CACHING_DISABLED,
            origin: new S3Origin(websiteBucket, {originAccessIdentity})
        }
        });


        // // Optionally output the S3 bucket URL
        new cdk.CfnOutput(this, `${id}BucketWebsiteURL`, {
        value: websiteBucket.bucketWebsiteUrl,
        description: 'URL of the website hosted on S3',
        });

        new cdk.CfnOutput(this, `${id}WebsiteDomainName`, {
        value: websiteDistribution.distributionDomainName,
        description: 'URL for the website'
        });
    }
}  