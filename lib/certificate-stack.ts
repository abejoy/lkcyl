// lib/certificate-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';

interface CertificateStackProps extends cdk.StackProps {
  domainName: {semiUrl: string, fullUrl: string};
}

export class CertificateStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, `${id}domainName`, {
      value: props.domainName.semiUrl,
      exportName: `${id}-DomainName`,
    });

    // const hostedZone = HostedZone.fromLookup(this, `${id}HostedZone`, {
    //   domainName: props.domainName.semiUrl,
    // });

    const hostedZoneId = 'Z02882661ENYGXQX341BE';
    const hostedZone = HostedZone.fromHostedZoneId(this, `${id}HostedZone`, hostedZoneId)

    const certificate = new Certificate(this, `${id}SiteCertificate`, {
      domainName: props.domainName.fullUrl,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, `${id}CertificateArn`, {
        value: certificate.certificateArn,
        exportName: `${id}-CertificateArn`,
    });
  }
}
