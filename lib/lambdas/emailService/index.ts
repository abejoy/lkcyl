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
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { Maybe, Player, Team } from "../helpers/types/graphql-types";
import mime from "mime-types";
import { PDFDocument, PDFForm, rgb, StandardFonts } from "pdf-lib";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";

export enum EmailTemplate {
  Captain = "Captain",
  Manager = "Manager",
  Director = "Director",
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
  sponsersImages: string;
};
const emailBucketName = process.env.EMAIL_BUCKET_NAME;
const Source: string = "london.region.kcyl@gmail.com";

const sesClient = new SESClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

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

const createPDFBase64 = async (
  players: string[],
  directorName: string,
  directorMobile: string,
  directorEmail: string,
  teamName: string,
  unit: string
): Promise<string> => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add a page to the document
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points (width x height)
  const form = pdfDoc.getForm();

  // Define reusable styles
  const fontSize = 12;
  const margin = 50;
  let currentY = 800;

  // Load standard fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to draw labeled boxes
  const drawLabeledBox = (label: string, value: string, y: number): number => {
    page.drawText(label, { x: margin, y, size: fontSize, font: boldFont });
    page.drawRectangle({
      x: margin + 130,
      y: y - 6,
      width: 360,
      height: 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    page.drawText(value, {
      x: margin + 135,
      y: y - 1,
      size: fontSize,
      font,
    });
    return y - 33;
  };

  // Helper function to draw a player table
  const drawPlayerTable = (
    startY: number,
    title: string,
    playerList: string[] = [],
    form: PDFForm
  ): number => {
    page.drawText(title, {
      x: margin,
      y: startY,
      size: fontSize,
      font: boldFont,
    });
    page.drawText("Please tick", {
      x: margin + 440,
      y: startY,
      size: fontSize,
      font: boldFont,
    });
    const rowHeight = 22;
    let y = startY - 20;

    for (let i = 0; i < playerList.length; i++) {
      // Draw row number
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: 30,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      page.drawText((i + 1).toString(), {
        x: margin + 10,
        y: y - rowHeight + 6,
        size: fontSize,
        font,
      });

      // Draw player name field
      page.drawRectangle({
        x: margin + 30,
        y: y - rowHeight,
        width: 400,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      if (playerList[i]) {
        page.drawText(playerList[i], {
          x: margin + 35,
          y: y - rowHeight + 6,
          size: fontSize,
          font,
        });
      }
      // Add a checkbox next to the player's name
      const checkbox = form.createCheckBox(`player_checkbox_${i + 1}`);
      checkbox.addToPage(page, {
        x: margin + 460,
        y: y - rowHeight + 4, // Adjust Y position to align with the row
        width: 15,
        height: 15,
      });

      y -= rowHeight;
    }

    return y - 10;
  };

  // Helper function to draw a signature section
  const drawSignatureSection = (
    label: string,
    y: number,
    form: PDFForm
  ): number => {
    page.drawText(label, { x: margin, y, size: fontSize, font: boldFont });
    page.drawText("E-Signature (Print Name): _________________________", {
      x: margin + 10,
      y: y - 20,
      size: fontSize,
      font,
    });
    const signatureField = form.createTextField(
      `${label.toLowerCase().replace(/\s+/g, "_")}_signature`
    );
    signatureField.addToPage(page, {
      x: margin + 150, // Position the field next to the label
      y: y - 23,
      width: 200,
      height: 18,
    });
    page.drawText("Date: ______________________________", {
      x: margin + 10,
      y: y - 40,
      size: fontSize,
      font,
    });
    const dateFeild = form.createTextField(
      `${label.toLowerCase().replace(/\s+/g, "_")}_date`
    );
    dateFeild.addToPage(page, {
      x: margin + 41, // Position the field next to the label
      y: y - 43,
      width: 200,
      height: 18,
    });
    return y - 60;
  };

  // HEADER

  const lkcyllogoBytes =
    (await fetchAndEncodeFile("sponsers/lkcyl-logo.png")) || "";
  const lkcyllogoImage = await pdfDoc.embedPng(lkcyllogoBytes);

  const lkcalogoBytes =
    (await fetchAndEncodeFile("sponsers/lkca-logo.png")) || "";
  const lkcaLogoImage = await pdfDoc.embedPng(lkcalogoBytes);

  page.drawImage(lkcyllogoImage, {
    x: 50,
    y: currentY - 58,
    width: 70,
    height: 70,
  });
  page.drawImage(lkcaLogoImage, {
    x: 480,
    y: currentY - 58,
    width: 70,
    height: 88,
  });
  page.drawText("LKCYL Football Tournament", {
    x: 160,
    y: currentY,
    size: 18,
    font: boldFont,
  });
  currentY -= 30;
  page.drawText("Verification Form", {
    x: 240,
    y: currentY,
    size: 14,
    font: boldFont,
  });

  // INSTRUCTIONS
  currentY -= 50;
  const instructions = `This form is to be completed by the ${unit} Director ${directorName}, who was nominated by the ${teamName} and created with your ${unit}'s KCYL members, to verify participants from ${unit} and to ensure that the team and its players comply with LKCYL Football Tournament Rules and Regulations.`;
  page.drawText(instructions, {
    x: margin,
    y: currentY,
    size: fontSize,
    font,
    maxWidth: 500,
    lineHeight: 14,
  });

  // BOXED FIELDS
  currentY -= 80;
  currentY = drawLabeledBox("Director's Name:", directorName, currentY);
  currentY = drawLabeledBox("Unit Name:", unit, currentY);
  currentY = drawLabeledBox("Mobile Number:", directorMobile, currentY);
  currentY = drawLabeledBox("Email Address:", directorEmail, currentY);

  // PLAYER TABLE
  currentY -= 10;
  currentY = drawPlayerTable(
    currentY,
    "Names of Players (7 Players minimum + 4 additional players)",
    players,
    form
  );

  // SIGNATURES SECTION
  currentY -= 20;
  currentY = drawSignatureSection(
    `Unit Director ${directorName} (Primary Unit):`,
    currentY,
    form
  );
  currentY = drawSignatureSection(
    "Unit Director B (Secondary Unit): (Required for Combined Teams)",
    currentY,
    form
  );

  // FOOTER
  currentY -= 30;
  const footerText =
    "By signing above, Unit Directors confirm that the listed participants have reviewed and agreed to comply with all LKCYL Football Tournament Rules and Regulations.";
  page.drawText(footerText, {
    x: margin,
    y: currentY,
    size: fontSize,
    font,
    maxWidth: 500,
    lineHeight: 14,
  });

  page.drawText("LKCYL Executive Committee", {
    x: 200,
    y: currentY - 40,
    size: fontSize,
    font: boldFont,
  });

  // Save the PDF and return it
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString("base64");
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

const getSignedUrlOfObject = async (objectPath: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.EMAIL_BUCKET_NAME, // Replace with your S3 bucket name
    Key: objectPath, // Path to the image in S3
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
};

const fetchS3Response = async (
  Key: string
): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({
    Bucket: emailBucketName,
    Key,
  });
  return s3Client.send(command);
};
const fetchAndEncodeFile = async (Key: string): Promise<string | undefined> => {
  const response = await fetchS3Response(Key);
  return streamToBase64(response.Body as NodeJS.ReadableStream);
};

const sendEmailWithAttachment = async (
  recipients: string[],
  subject: string,
  bodyHtml: string,
  attachmentFillePathsInBucket: string[],
  pdfContent?: string
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
    if (pdfContent) {
      rawMessage += `
--${boundary}
Content-Type: application/pdf
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="verification-form.pdf"

${pdfContent}
`;
    }

    // End the MIME message
    rawMessage += `--${boundary}--`;

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

const getAllPlayersList = (players: Maybe<Maybe<Player>[]>): string[] => {
  return players?.map((player) => player?.name || "") || [];
};

const getAllPlayersAsFormatedString = (
  players: Maybe<Maybe<Player>[]> = []
): string => {
  const playersString: string[] = getAllPlayersList(players);
  return playersString.join("<br/>");
};

const getTeamDetailsText = (team: Team | string): string => {
  if (typeof team === "string") {
    return team;
  }
  const players: string = getAllPlayersAsFormatedString(team.players);
  return `<br/>Team Name: ${team.teamName}<br/><br/>Manager Details<br/>Name: ${team.managerName}<br/>Number:${team.managerPhone}<br/>Email:${team.managerEmail}<br/><br/>Captain Details:<br/>Name:${team.captainName}<br/>Number:${team.captainPhone}<br/>Email:${team.captainEmail}<br/><br/>Team Colour:${team.teamColor}<br/><br/>KcylUnit:${team.kcylUnit}<br/><br/>Aditional Message:${team.additionalMessage}<br/><br/>Players:<br/>${players}`;
};

const listFilesInAttachmentsFolder = async (
  subfolder: string
): Promise<string[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: emailBucketName,
      Prefix: `attachments/${subfolder}`, // Specify the folder prefix
    });

    const response = await s3Client.send(command);

    // Extract file names from the response
    const fileNames =
      response.Contents?.map((item) => item.Key?.split("/").pop() || "") || [];

    return fileNames.map((fileName) => `attachments/${subfolder}/${fileName}`);
  } catch (error) {
    console.error("Error listing files in attachments folder:", error);
    throw error;
  }
};

const getSponseredImageTag = async (): Promise<string> => {
  const lkcylImageUrl = await getSignedUrlOfObject("sponsers/lkcyl-logo.png");
  const ampleImageUrl = await getSignedUrlOfObject("sponsers/ample.jpg");
  const cjImageUrl = await getSignedUrlOfObject("sponsers/cj.jpg");

  const imageTagTemplate = `
      <p>Our Sponsors:</p>
      <a href="https://www.lkcyl.com/" style="padding: 10px" target="_blank">
        <img src="${lkcylImageUrl}" alt="LKCYL Logo" style="width: 20%"/>
      </a>

      <a href="https://amplemortgages.co.uk/" style="padding: 10px" target="_blank">
      <img src="${ampleImageUrl}" alt="LKCYL Logo" style="width: 33%"/>
      </a>

      <a href="https://www.instagram.com/christie_johns_/" style="padding: 10px" target="_blank">
      <img src="${cjImageUrl}" alt="LKCYL Logo" style="width: 33%"/>
      </a>
    `;

  return imageTagTemplate;
};

export const handler = async (event: any) => {
  try {
    const toret: any = [];
    const emailsToSend: EmailToSend[] = event.emailsToSend;
    if (!Array.isArray(emailsToSend) || emailsToSend.length === 0) {
      throw new Error("No emails to send");
    }

    const adminEmailsToSend: string[] = await fetchAdminEmails();
    const attachmentsFileNames: string[] = await listFilesInAttachmentsFolder(
      "everyone"
    );

    const sponsersImages: string = await getSponseredImageTag();

    let emailSentData: any;
    for (const emailToSend of emailsToSend) {
      const ToAddresses = emailToSend.emailAddressToSend;
      const players = emailToSend.emailArgs?.players || [];
      const sub = "National 7 aside Football Tournament";
      const allPlayers: string = getAllPlayersAsFormatedString(players);
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
        case EmailTemplate.Director:
          const name = emailToSend.emailArgs?.directorName || "";
          const directorPhone = emailToSend.emailArgs?.directorPhone || "";
          const directorEmail = emailToSend.emailArgs?.directorEmail || "";

          const directorReplacementParams: ReplacementArgs = {
            name,
            teamName,
            unit,
            gender,
            allPlayers,
            role: emailToSend.emailTemplate,
            color,
            teamDetails,
            sponsersImages,
          };
          const directorAttachmentsFileNames: string[] =
            await listFilesInAttachmentsFolder("director");
          const directorHtmlBody: string =
            (await getHtmlBody(
              "emailbody/directorEmail.txt",
              directorReplacementParams
            )) || "";
          const pdfContent = await createPDFBase64(
            getAllPlayersList(players),
            name,
            directorPhone,
            directorEmail,
            teamName,
            unit
          );
          emailSentData = await sendEmailWithAttachment(
            emailToSend.emailAddressToSend,
            sub,
            directorHtmlBody,
            [...attachmentsFileNames, ...directorAttachmentsFileNames],
            pdfContent
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
            sponsersImages,
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
            [...attachmentsFileNames]
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
            sponsersImages,
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
            [...attachmentsFileNames]
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
            sponsersImages,
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
