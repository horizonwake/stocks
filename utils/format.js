function magnitude(num) {
  const absNum = Math.abs(num);
  if (absNum >= 1e12) {
    return (absNum / 1e12).toFixed(2) + " Trillion";
  } else if (absNum >= 1e9) {
    return (absNum / 1e9).toFixed(2) + " Billion";
  } else if (absNum >= 1e6) {
    return (absNum / 1e6).toFixed(2) + " Million";
  } else if (absNum >= 1e3) {
    return (absNum / 1e3).toFixed(2) + " Thousand";
  } else {
    return absNum.toFixed(2);
  }
}

function toTitleCase(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default { magnitude, toTitleCase };
