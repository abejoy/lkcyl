import { PDFDocument, PDFForm, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";

const createPDFBase64 = async (
  players: string[],
  directorName: string,
  directorMobile: string,
  directorEmail: string,
  teamName: string,
  unit: string
): Promise<Uint8Array> => {
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
  const lkcyllogoBytes = fs.readFileSync("lkcyl-logo.png");
  const lkcyllogoImage = await pdfDoc.embedPng(lkcyllogoBytes);

  const lkcalogoBytes = fs.readFileSync("lkca-logo.png");
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
  return await pdfDoc.save();
};

// Example Usage
(async () => {
  const players = [
    "Player One",
    "Player Two",
    "Player Three",
    "Player Four",
    "Player Five",
    "Player Six",
    "Player Seven",
  ];

  const pdfBytes = await createPDFBase64(
    players,
    "Alkila",
    "123456789",
    "a@gmail.com",
    "Team Postato",
    "NWL Unit"
  );

  fs.writeFileSync("verification_form.pdf", pdfBytes);
  console.log("✅ PDF created as verification_form.pdf");
})();
