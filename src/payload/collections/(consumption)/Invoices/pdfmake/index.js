// playground requires you to assign document definition to a variable called dd

var dd = {
  header: {
    stack: [
      {
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALoAAAB4CAYAAABFLuhOAAAACXBIWXMAABcRAAAXEQHKJvM/AAAIfklEQVR4nO2d7XXbNhSGn/T0f9UJykxgdQIzE8SdwPIEaSewMkGSCaxOEGcC0xNEmaDMBFYncH+ArGSFkgjggh/i+5yDYzUlgEvy5eUlPl8xPrIqjYWySjHk0VZ0S9G3Afu86rn+GTCv0gy4qP5mbMX8O7Cufs+Br51aaMOvwCYw7wfgT0NbuuAe+GPnv3PgofpdVmkNfK/+FqkN+jl1BXvkVbpkK24fNriLlBnalJqScJEDfDOyo0uabN7w0onle/+/Fvwj7kExJbVHz4Ar4C1+r98S+ASsaBbJ7pvgN16+FfpkzdZTFdXvGJHvkuPO8YLt+fZNWaVH3LmWbN++TSyAa9pp4R74Uv2NvoaphL4A3uF/M+5xAi8C6+3qAdjgbugj25t77AanIqc78Re8DDdiHuIMuMXp5BQbtrro4xr/wAxYAk/As2f6TLpwZB5gz6nU95vjEHfYn+sz6T6GM0+bHxLa0oo/CRP4P3Rj+KH6n3APmY/NDwyXJeFi/szhe5iaupFhCI6xkQx340MvbFeesan+Dzv1Z7Q/j3MT+gNb0cxw16Vrodf4ePcnOmqNuiLMiz9XJ9QlTTbke8csDxx37kJf7pWRNxzTJYuG+qMd5k8RxoR65BVwE1ivOH9W+OnjCud8jmoxROgLwj3yPRK5OM0KP53MOSF2X6HnhIu8RCIX7VlhKHYfoc9w4UooN9h1nohpsAI+ehw/x31M/4CP0O8IbyVZMcCBPmIUvMdvUNwCF7e/oK3Q86bMHryPyCumzQZ//ew2HQPthX7rWdEuK+KHqYpps8JPQxl7bexthJ4T13v5d0ReIWo+eR7/jh2v3kbo7zwr2KVEsbmwwXfo7oydcPuU0F8cHID5uGIxWUr8Q+Dr+scpoceIHNwwViGs8B2mm1OFL6eE/jbEmh2KyPxC7BIy2+oK0nr0EnUQCVtC9HQBx4WeB5mypYzML8Q+ITOM5pBW6IOY9iQmTw7HhX4RWcG/kfmFsGJ2TOhDmGUuhAXzY0LPIgtX6CIGwyGh5wZlq8VFDIWjHl2IoZEF5jsYo+eBBQqRkiw0ozy6GBO/hGaU0MWYCG4JTCn0PGHZYprkoRnl0cVYiOrXkdDFWMhjMh8SehFTaMWlQRlC1FyfPuQg60NCt+jsGerSymJ8ZMSFLptDQrfovh/CDhTiPIhZhQKgPBajF5GFg1peRDyx85bhhNC/RBYO8VPxhLglLjIo4Hiri8UM/isUvohwMuIX+3+E40IviRf7jPHtkSmGg8WGEQWcbkf3XR2piVs0iUP4syT+G29DS6EX2HyUxqzEK6bHgviWFtiJSNr0jFqsa35yRwIhKg6ucR7A/+t+thF6ic2yz7XYM4OyxHmywM4hluxEI23HunzELd0bS72f5MKgLHFeLLENcV84Z59BXTfY9JjOcCf0gDqUxPZNbxGT15TsOWbf0YtvsFtPMcedoAQ/TeY4h/cV+/v/wyZfP3sWsMGJ/Q678COv0hrXG1sw7MVJs74N6IGMuCUGM7YDsy5w9zuLsugwH2nQj6/Qa25wPU4/7BUTwbxK9StsjXuw1rRb9esXmtvrrVt6MpwXGuJyHqn6Kx7YLhp7bEXb/aHZXQ/sK0m0X1b9cRmyTXrfKd87l+UAbOojLfeuQz4Am0LSE0ce9NgZRmvgd+AvhunhxHQ42lhiNZXuI/Aav81PhbDihhPjskJj9CY2OM/+HjeQ68WuYGdI/Q0xBKY8yeUGmz6eKK5wLTRP9B/D7ad8z9alR95/GJawFkwzRl+0vUCpVwG4xz1xrxPX0zX3DMebw/R2/6ubuVdtM6QWeoZ76u4S19M1i74N2CN2qtmYKHANIIVPJssYfZcFbnmCPFH5fVMPY/jetyEV130b0AEl7vtvFZLZWug5TgCZcblDZNG3ARNggwvLvhAZnlkJvfZwU3qFClvKKq1xb8oCw11TLIReD87pYrpcPSTgGHkHdkyNgvhdwIuGf2tzP02IFXrKmUMl2wtc//Yhq1KO7RBQcB1jQ9x17y1pHM6bBGWOhhmuPdm6bfQOe69s3Y4+VK5I044+emI8uvVHZ4HrWdVuduEMqW1/UIS2o19h++H5Hvd6HIPIi74NEP6EenSrWdowkLEK4rwJ8egL7EKWFRK56IAQob8zqrse7ShEcnyFnmHXfPUJfTyJjvAVuuUHqCZpiM7wFfqFUb1DmrQgJoCv0K3ClsKoHCFa0ZfQh9h9Ls4YH6EPaeqYEF74CF2L+YvRop2jxSSQ0MUkkNDFJOhL6Fbt8UK0oi+hqwVHdIqP0McwVlyIRnyEri57MVr0MXpeKCQ8gIR+XqhT7wASupgEvkIvUhghRGrk0cUkkNDFJJDQxSSQ0MUkkNDFJJDQxSSQ0MUkkNDFJOhL6LG7JwjhhTy6mAQSupgEfQldkzhEp/QldE3iEJ3Sl9DLnuoVE0VCF5Ogj0VGFZ+LzvEVusWcxNKgDCG86CN0+dZDnWLi+Ag9N6pToYvonD7WRy+MyhGiNV2vj669i0Qv+Aj90qC+wqAMIbzpOkb/26AMIbxpK3SL/UVL9CEqeqKt0K8N6pI3F73RRuhz4j36Bu0UPRYmuVDpDPgKPEemZcd279Nk0xPOrjlwd+CYpvTQreleLAm7P3e4b7BD1+GssRL5E/16ibzBptg01FVrP2N/rs/YfKP1yquGf5sBC+AWG4G+obtmxRzIqnS58zsFa9wH9jfc+ZV0O44nwz1wc9y5zknrUMoqPbJtWBhN48Ir3AVb4C7WDFtvdQOsDMurqW9wRnpB+7BhK4BvOEEUBuVmdCtqH+rz/U4/D3xrlqR53S0S2JrhQqEU9qZKsaHbcgDn4Js+RJxvEn4C7qtUGpS3wXnw16Tx5EIE0RSjZ3up5rLh2Hp9lpKRxWxiWvwH2IZaX6cWMjcAAAAASUVORK5CYII=",
        width: 45,
        margin: [0, 0, 0, 5],
      },
      {
        text: "The Hideaway",
        alignment: "center",
        fontSize: 12,
        margin: [0, 5, 0, 0],
      },
      {
        text: "SEOUL · PARIS",
        fontSize: 6,

        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 3],
      },
      {
        text: "a restored project",
        fontSize: 7.5,

        alignment: "center",

        margin: [0, 0, 0, 0],
      },
    ],
    style: "header",
    alignment: "center",
    margin: [0, 25, 0, 0],
  },
  content: [
    {
      text: "Aug 04, 2021",
      fontSize: 10,

      alignment: "right",
      margin: [0, 10, 0, 20],
    },
    // Customer + Order Info
    {
      columns: [
        {
          stack: [
            {
              text: "Purchased by:",
              italics: true,
              fontSize: 11,
              lineHeight: 1.35,
            },
            {
              text: "Claude Severin",
              fontSize: 11,
              lineHeight: 1.15,
              margin: [0, 0, 0, 0.5],
            },
            { text: "20202 Palm Way", fontSize: 10.5 },
            { text: "Boca Raton, FL 21029", fontSize: 10.5 },
            { text: "South Korea", fontSize: 10.5 },
          ],
        },
      ],
      margin: [0, 20, 0, 20],
    },

    {
      columns: [
        {
          table: {
            widths: ["*", "auto"],

            body: [
              [
                { text: "Invoice number", fontSize: 11 },
                { text: ":11258947", fontSize: 11 },
              ],
              [
                { text: "Order number", fontSize: 11 },
                { text: ":11258947", fontSize: 11 },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 20, 0, 20],
          width: "35%",
        },
      ],
    },

    // Product Description Block
    {
      table: {
        widths: ["*", "auto", "auto", "auto"],
        headerRows: 1,
        body: [
          [
            {
              text: "Client copy\t\t\t\t\t\t\t\t\t",
              lineHeight: 1.75,
              decoration: "underline",
            },
            "",
            "",
            "",
          ],
          ["", "Quantity", "Total Amount", "Tax Amount"],
          [{ text: "Love ring, white gold", bold: true }, "1", "1", "1"],
          [
            {
              text: "Reference: CRFF",
              fontSize: 10,
              margin: [0, -3, 0, 0],
            },
            "",
            "",
            "",
          ],
          [
            {
              text: "INDIVIDUAL NUMBER: NJ1444",
              fontSize: 10,
              margin: [0, -3, 0, 0],
            },
            "",
            "",
            "",
          ],
        ],
      },
      layout: "headerLineOnly",
    },

    {
      columns: [
        // Table Total
        {
          width: "75%",

          table: {
            alignment: "right",
            widths: ["*", "auto"],
            headerRows: 2,

            body: [
              ["Subtotal", "$3,900.00"],
              ["Tax", "$370.52"],
              [
                { text: "Total", bold: true },
                { text: "$4,270.52", bold: true },
              ],
            ],
          },
          layout: "headerLineOnly",
          margin: [0, 10, 0, 20],
        },
        {},
      ],
    }, // Return Policy
    {
      text: "The Hideaway product may be exchanged or returned for a refund or merchandise credit, within 30 days of the original purchase date at the boutique originally purchased. Returns of product over $500.00 are only eligible for merchandise credit. Refunds are only issued to the original purchaser via original method of payment, excluding cash. Product must be presented in its original packaging and accompanied by the appropriate sales documentation and International Limited Warranty. Personalized items, made to order items, or items that show signs of wear do not qualify for a return or an exchange. Before accepting any return or exchange, The Hideaway reserves its right to verify the product and proceed with necessary evaluations to confirm authenticity, whether in the boutique or in a The Hideaway workshop.",
      fontSize: 7.5,
      lineHeight: 1.15,
      margin: [0, 10, 0, 10],
    },

    // Payment Method
    {
      table: {
        layout: "noBorders",
      },
      columns: [
        {
          width: "50%",
          stack: [{ text: "Means of Payment" }, "Cash", "Cash Back"],
        },
        {
          width: "50%",
          stack: [{ text: "Ant." }, "$4,300.00", "$29.48"],
        },
      ],
      margin: [0, 20, 0, 20],
    },
  ],
  footer: {
    stack: [
      {
        text: "SEOUL · TEL (82) (REDACTED)",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: "Thank You for Your Patronage",
        alignment: "center",
        fontSize: 7,
        margin: [0, 0, 0, 15],
      },
      {
        text: "Subscribe to The Hideaway e-newsletter on www.hideawayseoul.com to receive all our latest news.",
        alignment: "center",
        fontSize: 7,
        margin: [0, 5, 0, 0],
      },
    ],
  },
  styles: {
    brand: {
      fontSize: 9,
      bold: true,
    },
  },
  defaultStyle: {
    fontSize: 10,
  },
  pageSize: "A4",
  pageMargins: [30, 110, 30, 55],
};
