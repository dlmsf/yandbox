function stringToBoolean(str) {
    // Trim spaces and convert the string to lowercase
    str = str.trim().toLowerCase();

    // Compare the trimmed, lowercase string to "true" and "false"
    if (str === "true") {
        return true;
    } else if (str === "false") {
        return false;
    } else {
        // If the string is not "true" or "false", it's not a valid boolean
        throw new Error("String is not a valid boolean value");
    }
}

export default stringToBoolean