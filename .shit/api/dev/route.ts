import config from "@/payload.config";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import {
  CustomTableLayout,
  Margins,
  StyleDictionary,
  TDocumentDefinitions
} from "pdfmake/interfaces";
import pdfPrinter from "pdfmake";
import * as pdfM from "pdfmake/build/pdfmake";
import { join } from "path";

const ADMIN_ROLES = new Set(["admin", "editor"]);

interface PDFMakeTextProps {
  text: string;
  fontSize?: number;
  bold?: boolean;
  italics?: boolean;
  margin?: Margins;
  alignment?: "left" | "center" | "right";
  lineHeight?: number;
  style?: string;
}

function txt(
  text: string | PDFMakeTextProps,
  options?: PDFMakeTextProps
) {
  if (typeof text === "string") {
    return { text, ...options };
  }
  return { ...text, ...options };
}

export const GET = async (req: NextRequest) => {
  // Hard-gate: NODE_ENV must be development. Next.js inlines this at build
  // time, so a production bundle physically cannot reach the body below.
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Defense-in-depth: even in dev, only authenticated admin-tier users may
  // exercise the PDF preview. Murphy's law — if someone ever ships a build
  // with NODE_ENV=development, this still fails closed.
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await headers() });
    if (!user) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (!ADMIN_ROLES.has(String(user.role))) {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
  // Convert Node stream to Web ReadableStream
  const fonts = {
    Joly: {
      normal: join(
        process.cwd(),
        "public",
        "assets",
        "fonts",
        "Weaved",
        "JolyTextRegular.otf"
      ),
      italics: join(
        process.cwd(),
        "public",
        "assets",
        "fonts",
        "Weaved",
        "JolyTextRegularItalic.otf"
      ),

      bold: join(
        process.cwd(),
        "public",
        "assets",
        "fonts",
        "Weaved",
        "JolyDisplayBold.otf"
      ),
      bolditalics: join(
        process.cwd(),
        "public",
        "assets",
        "fonts",
        "Weaved",
        "JolyDisplayBoldItalic.otf"
      )
    }
  };
  const PdfPrinter = new pdfPrinter(fonts);

  const info = {
    name: "John Doe",
    address: "123 Main St, Anytown, USA",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    date: new Date(),
    dueDate: new Date(),
    status: "paid",
    total: 100
  };
  const { date, email } = info;
  const docDefinition = {
    header: {
      stack: [
        {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALoAAAB4CAYAAABFLuhOAAAACXBIWXMAABcRAAAXEQHKJvM/AAAIfklEQVR4nO2d7XXbNhSGn/T0f9UJykxgdQIzE8SdwPIEaSewMkGSCaxOEGcC0xNEmaDMBFYncH+ArGSFkgjggh/i+5yDYzUlgEvy5eUlPl8xPrIqjYWySjHk0VZ0S9G3Afu86rn+GTCv0gy4qP5mbMX8O7Cufs+Br51aaMOvwCYw7wfgT0NbuuAe+GPnv3PgofpdVmkNfK/+FqkN+jl1BXvkVbpkK24fNriLlBnalJqScJEDfDOyo0uabN7w0onle/+/Fvwj7kExJbVHz4Ar4C1+r98S+ASsaBbJ7pvgN16+FfpkzdZTFdXvGJHvkuPO8YLt+fZNWaVH3LmWbN++TSyAa9pp4R74Uv2NvoaphL4A3uF/M+5xAi8C6+3qAdjgbugj25t77AanIqc78Re8DDdiHuIMuMXp5BQbtrro4xr/wAxYAk/As2f6TLpwZB5gz6nU95vjEHfYn+sz6T6GM0+bHxLa0oo/CRP4P3Rj+KH6n3APmY/NDwyXJeFi/szhe5iaupFhCI6xkQx340MvbFeesan+Dzv1Z7Q/j3MT+gNb0cxw16Vrodf4ePcnOmqNuiLMiz9XJ9QlTTbke8csDxx37kJf7pWRNxzTJYuG+qMd5k8RxoR65BVwE1ivOH9W+OnjCud8jmoxROgLwj3yPRK5OM0KP53MOSF2X6HnhIu8RCIX7VlhKHYfoc9w4UooN9h1nohpsAI+ehw/x31M/4CP0O8IbyVZMcCBPmIUvMdvUNwCF7e/oK3Q86bMHryPyCumzQZ//ew2HQPthX7rWdEuK+KHqYpps8JPQxl7bexthJ4T13v5d0ReIWo+eR7/jh2v3kbo7zwr2KVEsbmwwXfo7oydcPuU0F8cHID5uGIxWUr8Q+Dr+scpoceIHNwwViGs8B2mm1OFL6eE/jbEmh2KyPxC7BIy2+oK0nr0EnUQCVtC9HQBx4WeB5mypYzML8Q+ITOM5pBW6IOY9iQmTw7HhX4RWcG/kfmFsGJ2TOhDmGUuhAXzY0LPIgtX6CIGwyGh5wZlq8VFDIWjHl2IoZEF5jsYo+eBBQqRkiw0ozy6GBO/hGaU0MWYCG4JTCn0PGHZYprkoRnl0cVYiOrXkdDFWMhjMh8SehFTaMWlQRlC1FyfPuQg60NCt+jsGerSymJ8ZMSFLptDQrfovh/CDhTiPIhZhQKgPBajF5GFg1peRDyx85bhhNC/RBYO8VPxhLglLjIo4Hiri8UM/isUvohwMuIX+3+E40IviRf7jPHtkSmGg8WGEQWcbkf3XR2piVs0iUP4syT+G29DS6EX2HyUxqzEK6bHgviWFtiJSNr0jFqsa35yRwIhKg6ucR7A/+t+thF6ic2yz7XYM4OyxHmywM4hluxEI23HunzELd0bS72f5MKgLHFeLLENcV84Z59BXTfY9JjOcCf0gDqUxPZNbxGT15TsOWbf0YtvsFtPMcedoAQ/TeY4h/cV+/v/wyZfP3sWsMGJ/Q678COv0hrXG1sw7MVJs74N6IGMuCUGM7YDsy5w9zuLsugwH2nQj6/Qa25wPU4/7BUTwbxK9StsjXuw1rRb9esXmtvrrVt6MpwXGuJyHqn6Kx7YLhp7bEXb/aHZXQ/sK0m0X1b9cRmyTXrfKd87l+UAbOojLfeuQz4Am0LSE0ce9NgZRmvgd+AvhunhxHQ42lhiNZXuI/Aav81PhbDihhPjskJj9CY2OM/+HjeQ68WuYGdI/Q0xBKY8yeUGmz6eKK5wLTRP9B/D7ad8z9alR95/GJawFkwzRl+0vUCpVwG4xz1xrxPX0zX3DMebw/R2/6ubuVdtM6QWeoZ76u4S19M1i74N2CN2qtmYKHANIIVPJssYfZcFbnmCPFH5fVMPY/jetyEV130b0AEl7vtvFZLZWug5TgCZcblDZNG3ARNggwvLvhAZnlkJvfZwU3qFClvKKq1xb8oCw11TLIReD87pYrpcPSTgGHkHdkyNgvhdwIuGf2tzP02IFXrKmUMl2wtc//Yhq1KO7RBQcB1jQ9x17y1pHM6bBGWOhhmuPdm6bfQOe69s3Y4+VK5I044+emI8uvVHZ4HrWdVuduEMqW1/UIS2o19h++H5Hvd6HIPIi74NEP6EenSrWdowkLEK4rwJ8egL7EKWFRK56IAQob8zqrse7ShEcnyFnmHXfPUJfTyJjvAVuuUHqCZpiM7wFfqFUb1DmrQgJoCv0K3ClsKoHCFa0ZfQh9h9Ls4YH6EPaeqYEF74CF2L+YvRop2jxSSQ0MUkkNDFJOhL6Fbt8UK0oi+hqwVHdIqP0McwVlyIRnyEri57MVr0MXpeKCQ8gIR+XqhT7wASupgEvkIvUhghRGrk0cUkkNDFJJDQxSSQ0MUkkNDFJJDQxSSQ0MUkkNDFJOhL6LG7JwjhhTy6mAQSupgEfQldkzhEp/QldE3iEJ3Sl9DLnuoVE0VCF5Ogj0VGFZ+LzvEVusWcxNKgDCG86CN0+dZDnWLi+Ag9N6pToYvonD7WRy+MyhGiNV2vj669i0Qv+Aj90qC+wqAMIbzpOkb/26AMIbxpK3SL/UVL9CEqeqKt0K8N6pI3F73RRuhz4j36Bu0UPRYmuVDpDPgKPEemZcd279Nk0xPOrjlwd+CYpvTQreleLAm7P3e4b7BD1+GssRL5E/16ibzBptg01FVrP2N/rs/YfKP1yquGf5sBC+AWG4G+obtmxRzIqnS58zsFa9wH9jfc+ZV0O44nwz1wc9y5zknrUMoqPbJtWBhN48Ir3AVb4C7WDFtvdQOsDMurqW9wRnpB+7BhK4BvOEEUBuVmdCtqH+rz/U4/D3xrlqR53S0S2JrhQqEU9qZKsaHbcgDn4Js+RJxvEn4C7qtUGpS3wXnw16Tx5EIE0RSjZ3up5rLh2Hp9lpKRxWxiWvwH2IZaX6cWMjcAAAAASUVORK5CYII=",
          width: 45,
          margin: [0, 0, 0, 5]
        },
        {
          text: "The Hideaway",
          alignment: "center",
          fontSize: 12,
          margin: [0, 5, 0, 0]
        },
        {
          text: "SEOUL · PARIS",
          fontSize: 6,

          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 3]
        },
        {
          text: "a restored project",
          fontSize: 7.5,

          alignment: "center",

          margin: [0, 0, 0, 0]
        }
      ],
      style: "header",
      alignment: "center",
      margin: [0, 25, 0, 15]
    },
    content: [
      txt({
        text:
          new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          }) || "",
        fontSize: 9,
        alignment: "right",
        margin: [0, 10, 0, 20]
      }),
      {
        columns: [
          {
            stack: [
              {
                text: "Purchased by:",
                italics: true,
                lineHeight: 1.35
              },
              {
                text: info.name,
                lineHeight: 1.1,
                bold: true,
                margin: [0, 0, 0, 0.5]
              },
              { text: "20202 Palm Way", fontSize: 9, lineHeight: 1 },
              {
                text: "Boca Raton, FL 21029",
                fontSize: 9,
                lineHeight: 1
              },
              { text: "South Korea", fontSize: 9, lineHeight: 1 }
            ]
          }
        ],
        margin: [0, 20, 0, 20]
      },
      {
        columns: [
          {
            width: "25%",
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  {
                    text: "Client copy",
                    border: [false, false, false, true],
                    bold: true,
                    italics: true
                  },
                  { text: "", border: [false, false, false, true] }
                ]
              ]
            },
            layout: "invoice"
          }
        ]
      },

      // Product Description Block
      {
        table: {
          widths: ["*", "*", "auto", "auto", "auto"],

          body: [
            [
              {
                text: "Reference",

                border: [false, false, false, false]
              },
              {
                text: "Description",

                border: [false, false, false, false]
              },
              { text: "Quantity", border: [false, false, false, false] },
              {
                text: "Price per unit",
                border: [false, false, false, false]
              },
              { text: "Total Amount", border: [false, false, false, false] }
            ],
            [
              {
                text: "",

                border: [false, false, false, false]
              },
              {
                text: "The Hideaway Membership",
                bold: true,
                border: [false, false, false, false]
              },
              { text: "1", border: [false, false, false, false] },
              {
                text: "1",
                border: [false, false, false, false]
              },
              {
                text: "1",
                border: [false, false, false, false],
                alignment: "right"
              }
            ]
          ]
        },
        layout: "invoice"
      },
      {
        columns: [
          // Table Total
          {
            width: "100%",
            table: {
              alignment: "right",
              widths: ["*", "auto", "auto", "*"],
              headerRows: 2,

              body: [
                [
                  {
                    text: "Subtotal",
                    colSpan: 3,
                    border: [false, false]
                  },
                  "",
                  "$3,900.00",
                  { text: "\t", border: [false, false] }
                ],
                [
                  {
                    text: "Tax",
                    colSpan: 2,
                    border: [false, false, false, false]
                  },
                  "",
                  "1",
                  { text: "\t", border: [false, false] }
                ],
                [
                  {
                    text: "Total",
                    bold: true,
                    colSpan: 3,
                    border: [false, false]
                  },
                  {},
                  "",
                  { text: "$4,270.52", bold: true }
                ]
              ]
            },
            layout: "totalSum",
            margin: [0, 10, 0, 20]
          }
        ]
      }, // Return Policy
      {
        text: "Physical products purchased from The Hideaway may be exchanged or returned for a refund within 7 days of receiving the goods. Returns of products past the initial week of reception will not be guaranteed. Refunds are only issued to the original purchaser via original method of payment. Product must be presented in its original packaging and accompanied by the appropriate sales documentation and International Limited Warranty. Non ready-made products which include, but are not limited to, items from: personalized orders; custom-ordered; airdropped and/or gifted, are void from any guarantee of refund or exchange. Items that show signs of wear also do not qualify for a return or an exchange. Before accepting any return or exchange, The Hideaway reserves its right to verify the product and proceed with necessary evaluations to confirm authenticity. Any services, products or other goods non-physical in form will not be eligible for refund.",
        fontSize: 7.5,
        lineHeight: 1,
        margin: [0, 10, 0, 10]
      },

      // Payment Method
      {
        columns: [
          {
            width: "50%",
            stack: [{ text: "Means of Payment" }, "Cash", "Cash Back"]
          },
          {
            width: "50%",
            stack: [{ text: "Amt." }, "$4,300.00", "$29.48"]
          }
        ],
        margin: [0, 20, 0, 20]
      }
    ],
    footer: {
      stack: [
        {
          text: '"Bridging the gap between the social and the private"',
          alignment: "center",
          fontSize: 9,
          margin: [0, 5, 0, 0]
        },
        {
          text: "Thank You for Your Patronage",
          alignment: "center",
          fontSize: 7,
          margin: [0, 0, 0, 15]
        },

        {
          text: "The Hideaway, a Restored Project™",
          alignment: "center",
          fontSize: 7,
          bold: true,
          margin: [0, 10, 0, 0]
        }
      ]
    },
    pageSize: "A4",
    pageMargins: [30, 110, 30, 90],

    defaultStyle: {
      font: "Joly",
      fontSize: 10
    },
    styles: {
      header: {
        fontSize: 11,
        lineHeight: 1.15,
        bold: true,
        margin: [0, 5, 0, 0] as Margins
      },
      subheader: {
        fontSize: 11,
        lineHeight: 1.15,
        bold: true,
        margin: [0, 5, 0, 0] as Margins
      },
      body: {
        fontSize: 11,
        lineHeight: 1.15
      }
    } as StyleDictionary
  } as TDocumentDefinitions;

  const CHUNK_SIZE = 64 * 1024;
  const tableLayout: { [x: string]: CustomTableLayout } = {
    invoice: {
      hLineWidth: (row, node) => {
        return row === 1 ? 0.5 : 0;
      },
      vLineWidth: () => 0
    },
    totalSum: {
      vLineWidth: () => 0,
      hLineWidth: (rowIndex, node) => {
        if (rowIndex === node.table.body.length - 1) return 0.5;
        return 0;
      }
    }
  };

  const stre = new ReadableStream({
    start(controller) {
      const pdfDoc = PdfPrinter.createPdfKitDocument(docDefinition, {
        tableLayouts: {
          ...pdfM.tableLayouts,
          ...tableLayout
        }
      });
      pdfDoc.on("data", (chunk) => controller.enqueue(chunk));
      pdfDoc.on("end", () => controller.close());
      pdfDoc.end();
    }
  });
  const stream = stre;
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=dev-preview.pdf"
    }
  });
};
