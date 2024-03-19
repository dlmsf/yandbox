function parseJson(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Error parsing JSON:", e.message);
        return null;
    }
}

export default parseJson