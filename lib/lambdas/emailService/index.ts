import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
  SendRawEmailCommand,
  SendRawEmailCommandInput,
} from "@aws-sdk/client-ses";
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  Color,
  Gender,
  Maybe,
  Player,
  Team,
} from "../helpers/types/graphql-types";
import mime from "mime-types";

export enum EmailTemplate {
  Captain = "Captain",
  Manager = "Manager",
  Admin = "Admin",
  Custom = "Custom",
}

export type EmailToSend = {
  emailAddressToSend: Array<string>;
  emailSubject?: string;
  emailBody?: string;
  emailTemplate: EmailTemplate;
  emailArgs?: Team;
};

type ReplacementMap = { [key: string]: string };
type ReplacementArgs = {
  name: string;
  teamName: string;
  unit: string;
  gender: string;
  allPlayers: string;
  role: string;
  color: string;
  teamDetails: string;
};
const emailBucketName = process.env.EMAIL_BUCKET_NAME;
const Source: string = "london.region.kcyl@gmail.com";

const sesClient = new SESClient();
const s3Clent = new S3Client();

const sendEmail = async (
  ToAddresses: string[],
  subject: string = "",
  body: string = ""
) => {
  const params: SendEmailCommandInput = {
    Source,
    Destination: { ToAddresses },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } },
    },
  };
  return sesClient.send(new SendEmailCommand(params));
};

// Helper function to convert stream to base64
const streamToBase64 = (stream: NodeJS.ReadableStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => {
      // Combine all chunks into a single buffer and then convert to Base64
      const buffer = Buffer.concat(chunks);
      resolve(buffer.toString("base64"));
    });
  });
};

const streamToString = (stream: NodeJS.ReadableStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
};

const fetchS3Response = async (
  Key: string
): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({
    Bucket: emailBucketName,
    Key,
  });
  return s3Clent.send(command);
};
const fetchAndEncodeFile = async (Key: string): Promise<string | undefined> => {
  const response = await fetchS3Response(Key);
  return streamToBase64(response.Body as NodeJS.ReadableStream); /// am i doing this right
};

const sendEmailWithAttachment = async (
  recipients: string[],
  subject: string,
  bodyHtml: string,
  attachmentFillePathsInBucket: string[]
) => {
  try {
    const recipientString = recipients.join(", ");
    const boundary = "----=_NextPart_000_001";
    let rawMessage = `From: ${Source}
To: ${recipientString}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 7bit

${bodyHtml}
`;

    for (const attachmentFilePath of attachmentFillePathsInBucket) {
      const attachmentContent = await fetchAndEncodeFile(attachmentFilePath);
      const contentType =
        mime.lookup(attachmentFilePath) || "application/octet-stream";
      const filename = attachmentFilePath.split("/").pop();
      rawMessage += `
--${boundary}
Content-Type: ${contentType}
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${filename}"

${attachmentContent}
`;
    }

    const params: SendRawEmailCommandInput = {
      RawMessage: { Data: Buffer.from(rawMessage) },
    };

    const result = await sesClient.send(new SendRawEmailCommand(params));
    return result;
  } catch (err) {
    throw new Error(
      `Failed to send email with attachement ${JSON.stringify(err)}`
    );
  }
};

const fetchAdminEmails = async (): Promise<string[]> => {
  try {
    // Fetch the file from S3
    const response = await fetchS3Response("adminEmails.csv");

    // Convert the response body (stream) to a string
    const fileContent = await streamToString(
      response.Body as NodeJS.ReadableStream
    );

    // Split the CSV content by commas and trim whitespace
    const adminEmails = fileContent.split(",").map((email) => email.trim());
    return adminEmails;
  } catch (error) {
    console.error("Error fetching or parsing the CSV file:", error);
    throw error;
  }
};

const replaceStringArgs = (
  template: string = "",
  replacements: ReplacementArgs
): string => {
  if (!template) {
    return "";
  }
  let result = template;
  for (const key in replacements) {
    const regex = new RegExp(`\\$${key}`, "g");
    result = result.replace(regex, replacements[key as keyof ReplacementArgs]);
  }
  return result;
};

const getHtmlBody = async (
  s3TextPath: string,
  replacementParams: ReplacementArgs
): Promise<string | undefined> => {
  const response = await fetchS3Response(s3TextPath);
  const htmlStringBeforeArgs = await response.Body?.transformToString("utf-8");
  return replaceStringArgs(htmlStringBeforeArgs, replacementParams);
};

const getAllPlayersAsFormatedString = (
  players: Maybe<Maybe<Player>[]> = []
): string => {
  const playersString: string[] =
    players?.map((player) => player?.name || "") || [];
  return playersString.join("<br/>");
};

const getTeamDetailsText = (team: Team | string): string => {
  if (typeof team === "string") {
    return team;
  }
  const players: string = getAllPlayersAsFormatedString(team.players);
  return `<br/>Team Name: ${team.teamName}<br/><br/>Manager Details<br/>Name: ${team.managerName}<br/>Number:${team.managerPhone}<br/>Email:${team.managerEmail}<br/><br/>Captain Details:<br/>Name:${team.captainName}<br/>Number:${team.captainPhone}<br/>Email:${team.captainEmail}<br/><br/>Team Colour:${team.teamColor}<br/><br/>KcylUnit:${team.kcylUnit}<br/><br/>Aditional Message:${team.additionalMessage}<br/><br/>Players:<br/>${players}`;
};

export const handler = async (event: any) => {
  try {
    const toret: any = [];
    const emailsToSend: EmailToSend[] = event.emailsToSend;
    if (!Array.isArray(emailsToSend) || emailsToSend.length === 0) {
      throw new Error("No emails to send");
    }

    const adminEmailsToSend: string[] = await fetchAdminEmails();

    let emailSentData: any;
    for (const emailToSend of emailsToSend) {
      const ToAddresses = emailToSend.emailAddressToSend;
      const sub = "National 7 aside Football Tournament";
      const allPlayers: string = getAllPlayersAsFormatedString(
        emailToSend.emailArgs?.players
      );
      const teamName = emailToSend.emailArgs?.teamName || "";
      const unit = emailToSend.emailArgs?.kcylUnit || "";
      const gender = emailToSend.emailArgs?.gender || "";
      const color = emailToSend.emailArgs?.teamColor || "";
      const teamDetails = getTeamDetailsText(
        emailToSend.emailArgs || "undefined Team"
      );

      switch (emailToSend.emailTemplate) {
        case EmailTemplate.Custom:
          emailSentData = await sendEmail(
            ToAddresses,
            emailToSend.emailSubject,
            emailToSend.emailBody
          );
          break;
        case EmailTemplate.Captain:
          const capReplacementParams: ReplacementArgs = {
            name: emailToSend.emailArgs?.captainName || "",
            teamName,
            unit,
            gender,
            allPlayers,
            role: emailToSend.emailTemplate,
            color,
            teamDetails,
          };
          const htmlBody: string =
            (await getHtmlBody(
              "emailbody/captianEmail.txt",
              capReplacementParams
            )) || "";
          emailSentData = await sendEmailWithAttachment(
            emailToSend.emailAddressToSend,
            sub,
            htmlBody,
            ["attachments/poster.jpeg"]
          );
          break;
        case EmailTemplate.Manager:
          const managerReplacementParams: ReplacementArgs = {
            name: emailToSend.emailArgs?.managerName || "",
            teamName,
            unit,
            gender,
            allPlayers,
            role: emailToSend.emailTemplate,
            color,
            teamDetails,
          };
          const managerHtmlBody: string =
            (await getHtmlBody(
              "emailbody/captianEmail.txt",
              managerReplacementParams
            )) || "";
          emailSentData = await sendEmailWithAttachment(
            emailToSend.emailAddressToSend,
            sub,
            managerHtmlBody,
            ["attachments/poster.jpeg"]
          );
          break;
        case EmailTemplate.Admin:
          const adminReplacementParams: ReplacementArgs = {
            name: emailToSend.emailArgs?.managerName || "",
            teamName,
            unit,
            gender,
            allPlayers,
            role: emailToSend.emailTemplate,
            color,
            teamDetails,
          };
          const adminHtmlBody: string =
            (await getHtmlBody(
              "emailbody/admin.txt",
              adminReplacementParams
            )) || "";
          emailSentData = await sendEmailWithAttachment(
            adminEmailsToSend,
            `Team ${teamName} Registered`,
            adminHtmlBody,
            []
          );
          break;
        default:
          break;
      }

      toret.push(emailSentData);
    }
    return { statusCode: 200, body: toret };
  } catch (err) {
    throw new Error(`Email failed to send ${err}`);
  }
};
