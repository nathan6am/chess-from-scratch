import React from "react";

const annotationCategories = [
  {
    name: "Move Classification",
    allowMultiple: false,
    options: [
      {
        code: 1,
        description: "Good Move",
        unicode: "\u0021",
      },
      {
        code: 2,
        description: "Mistake",
        unicode: "\u003F",
      },
      {
        code: 3,
        description: "Brilliant Move",
        unicode: "\u203C",
      },
      {
        code: 4,
        description: "Blunder",
        unicode: "\u2047",
      },
      {
        code: 5,
        description: "Interesting Move",
        unicode: "\u2049",
      },
      {
        code: 6,
        description: "Dubious Move",
        unicode: "\u2048",
      },
      {
        code: 7,
        description: "Forced Move",
        unicode: "\u25A1",
      },
    ],
  },
  {
    name: "Positional Assesments",
    allowMultiple: false,
    options: [
      {
        code: 10,
        description: "Equal Position",
        unicode: "\u003D",
      },
      {
        code: 13,
        description: "Unclear Position",
        unicode: "\u221E ",
      },
      {
        code: 14,
        description: "White has slight advantage",
        unicode: "\u2A72",
      },
      {
        code: 15,
        description: "Black has slight advantage",
        unicode: "\u2A71",
      },
      {
        code: 16,
        description: "white has moderate advantage",
        unicode: "\u00B1",
      },
      {
        code: 17,
        description: "Black has moderate advantage",
        unicode: "\u2213",
      },
      {
        code: 18,
        description: "White has decisive advantage",
        unicode: "\u002B\u002D",
      },
      {
        code: 19,
        description: "Black has decisive advantage",
        unicode: "\u002D\u002B",
      },
    ],
  },
  {
    name: "Other Annotations",
    allowMultiple: true,
    options: [
      {
        code: 22,
        description: "Zugzwang (white)",
        unicode: "\u2A00",
      },
      {
        code: 23,
        description: "Zugzwang (black)",
        unicode: "\u2A00",
      },
      {
        code: 26,
        description: "Space sdvantage (white)",
        unicode: "\u25CB ",
      },
      {
        code: 27,
        description: "Space sdvantage (black)",
        unicode: "\u25CB ",
      },
      {
        code: 32,
        description: "Time/development Advantage (white)",
        unicode: "\u27F3  ",
      },
      {
        code: 32,
        description: "Time/development Advantage (black)",
        unicode: "\u27F3  ",
      },
      {
        code: 36,
        description: "Initiative (white)",
        unicode: "\u2191",
      },
      {
        code: 37,
        description: "Initiative (black)",
        unicode: "\u2191",
      },
      {
        code: 40,
        description: "White has the attack",
        unicode: "\u2192",
      },
      {
        code: 41,
        description: "Black has the attack",
        unicode: "\u2192",
      },
      {
        code: 132,
        description: "Counterplay (black)",
        unicode: "\u21C6",
      },
    ],
  },
];

export default function Annotations() {
  return <div>Annotations</div>;
}
