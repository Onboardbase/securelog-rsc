onmessage = function (e) {
  const { text, secretPatterns, componentName } = e.data;

  let secretsFound = [];

  console.log("Securelog RSC scanning...");

  for (const pattern of secretPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern.regex, "gi"))];

    for (const match of matches) {
      const rawValue = match[pattern.secretPosition].trim();

      secretsFound.push({
        rawValue,
        line: getLineNumber(text, match.index),
        detector: pattern.detector,
        componentName,
      });
    }
  }

  postMessage(secretsFound);
};

const getLineNumber = (text, index) => {
  const lines = text.substring(0, index).split("\n");
  return lines.length;
};
