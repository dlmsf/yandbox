function completeAndParseJSON(inputString) {
    const jsonString = '{"action' + inputString;
    try {
        const jsonObject = JSON.parse(jsonString);
        return jsonObject;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null; // or handle the error as you see fit
    }
}

export default completeAndParseJSON