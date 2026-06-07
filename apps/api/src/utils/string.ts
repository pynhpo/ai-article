export function parseJsonFromCompletion(content: string) {
  let jsonString = content.trim();
  if (jsonString.startsWith('```')) {
    const lines = jsonString.split('\n');
    if (lines[0].startsWith('```')) {
      // remove first line like ```json
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith('```')) {
      lines.pop();
    }
    jsonString = lines.join('\n');
  }
  return JSON.parse(jsonString) as unknown;
}
