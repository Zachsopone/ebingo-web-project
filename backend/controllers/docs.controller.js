// controllers/docs.controller.js
import { db } from "../connect.js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
} from "docx";
import fetch from "node-fetch";
import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

const inchesToPoints = (inch) => inch * 72;
const pointsToTwips = (points) => points * 20;

/** Safely return text for Word */
const safeText = (val) => (val === null || val === undefined ? "" : String(val));

/** Label paragraph */
const labelPara = (text) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: safeText(text),
        bold: true,
        size: 22,
        font: "Arial",
      }),
    ],
    spacing: { after: pointsToTwips(2) },
  });

/** Value paragraph */
const valuePara = (text) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: safeText(text),
        size: 22,
        font: "Arial",
      }),
    ],
    spacing: {
      after: pointsToTwips(12),
      line: pointsToTwips(20),
    },
  });

export const generateMemberDocx = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT m.*, b.sname 
       FROM members m
       LEFT JOIN branches b ON m.branch_id = b.id
       WHERE m.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const member = rows[0];

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}-${d.getFullYear()}`;
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      try {
        return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return "";
      }
    };

    // ---------- ID Image ----------
    let idImageBuffer = null;
    if (member.filename2) {
      try {
        const imageUrl = `http://localhost:12991/valid/${member.filename2}`;
        const response = await fetch(imageUrl);
        if (response.ok) {
          const arrBuf = await response.arrayBuffer();
          if (arrBuf.byteLength > 0) {
            idImageBuffer = Buffer.from(arrBuf);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch ID image:", err.message);
      }
    }

    // ---------- Barcode ----------
    let barcodeBuffer = null;
    try {
      const canvas = createCanvas(300, 80);
      JsBarcode(canvas, safeText(member.idnum), {
        format: "CODE39",
        displayValue: true,
        fontSize: 14,
        textMargin: 2,
        height: 60,
        width: 2,
      });
      barcodeBuffer = canvas.toBuffer("image/png");
    } catch (err) {
      console.warn("Failed to generate barcode:", err.message);
    }

    // ---------- Build Columns ----------
    const col1 = [
      ...[
        { l: "Name:", v: `${safeText(member.fname)} ${safeText(member.mname)} ${safeText(member.lname)}` },
        { l: "Permanent Address:", v: member.permaddress },
        { l: "Present Address:", v: member.presaddress },
        { l: "Age:", v: member.age },
        { l: "Nationality:", v: member.nationality },
        { l: "Registration Date:", v: formatDate(member.created_date) },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),

      new Paragraph({ spacing: { before: pointsToTwips(12) } }),

      ...[
        { l: "Status:", v: member.banned === 1 ? "Ban" : "Not Ban" },
        { l: "Nature of Work:", v: member.now },
        { l: "Reason:", v: member.reason },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),
    ];

    const col2 = [
      ...[
        { l: "Date of Birth:", v: member.birthdate },
        { l: "Contact Number:", v: member.cnumber },
        { l: "Gender:", v: member.gender },
        { l: "Civil Status:", v: member.cstatus },
        { l: "Branch:", v: member.sname },
        { l: "Time:", v: formatTime(member.created_time) },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),

      new Paragraph({ spacing: { before: pointsToTwips(12) } }),

      ...[
        { l: "Email Address:", v: member.email },
        { l: "Source of Fund:", v: member.sof },
        { l: "Risk Assessment:", v: member.risk_assessment },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),
    ];

    const col3 = [
      ...(idImageBuffer
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: idImageBuffer,
                  transformation: { width: 180, height: 140 },
                }),
              ],
              spacing: { after: pointsToTwips(10) },
            }),
          ]
        : []),

      ...[
        { l: "Type of ID:", v: member.typeofid },
        { l: "ID Number:", v: member.idnum },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "System generated:",
            bold: true,
            size: 22,
            font: "Arial",
          }),
        ],
        spacing: { after: pointsToTwips(5) },
      }),

      ...(barcodeBuffer
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: barcodeBuffer,
                  transformation: { width: 200, height: 60 },
                }),
              ],
              spacing: { before: pointsToTwips(10), after: pointsToTwips(40) },
            }),
          ]
        : []),

      ...[
        { l: "Card Number:", v: member.idnum },
        { l: "Monthly Income:", v: member.mi },
      ].flatMap((i) => [labelPara(i.l), valuePara(i.v)]),
    ];

    // ---------- Document ----------
    const doc = new Document({
      sections: [
        {
          page: {
            size: { width: inchesToPoints(8.5), height: inchesToPoints(11) },
            margin: {
              top: inchesToPoints(0.8),
              bottom: inchesToPoints(0.8),
              left: inchesToPoints(0.8),
              right: inchesToPoints(0.8),
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Player’s Registration Form",
                  bold: true,
                  size: 28,
                  font: "Arial",
                }),
              ],
              spacing: { after: pointsToTwips(30) },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: col1 }),
                    new TableCell({ children: col2 }),
                    new TableCell({ children: col3 }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    // ---------- Send ----------
    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Player_Registration_${safeText(member.idnum)}.docx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buffer);
  } catch (error) {
    console.error("DOCX generation error:", error);
    res.status(500).json({ message: "Failed to generate document" });
  }
};
