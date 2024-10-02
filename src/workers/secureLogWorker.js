onmessage = function (e) {
  const { text, secretPatterns, componentName } = e.data;

  let secretsFound = [];
  for (const pattern of secretPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern.regex, "gi"))];

    for (const match of matches) {
      const rawValue = match[pattern.secretPosition].trim();

      if (
        pattern.falsePositive &&
        rawValue.match(new RegExp(pattern.falsePositive, "gi"))
      )
        continue;

      secretsFound.push({
        rawValue,
        // line: getLineNumber(text, match.index),
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
