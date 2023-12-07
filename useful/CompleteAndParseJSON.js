function completeAndParseJSON(inputString) {
    // Remove the initial colon and space, if present
    let jsonString = inputString.trim();
    if (jsonString.startsWith(':')) {
        jsonString = jsonString.substring(1).trim();
    }

    // Add the missing opening curly brace and action property, if necessary
    if (!jsonString.startsWith('"action"')) {
        jsonString = '{"action": ' + jsonString;
    } else {
        jsonString = '{' + jsonString;
    }

    // Escape double quotes inside command strings, avoiding JSON structure
    jsonString = jsonString.replace(/("command":\s*")([^"]+)(")/g, (match, p1, p2, p3) => {
        let escapedCommand = p2.replace(/(\\)?"/g, (m, escape) => escape ? m : '\\"');
        return p1 + escapedCommand + p3;
    });

    // Ensure the string is properly closed with a closing brace
    if (!jsonString.trim().endsWith('}')) {
        jsonString += '}';
    }

    try {
        const jsonObject = JSON.parse(jsonString);
        return jsonObject;
    } catch (error) {
        //console.error('Error parsing JSON:', error);
        return null;
    }
}

export default completeAndParseJSON