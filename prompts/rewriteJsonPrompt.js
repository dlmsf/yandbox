function rewriteJsonPrompt(jsonString) {
    let explanation = "This AI rewrites JSON strings with format corrections, displaying each incorrect JSON and its corrected version in a single line without line breaks.";

    let examples = `
    JSON: {name: "Daniel", age: 30}
    Rewrite: {"name": "Daniel", "age": 30} BFINISH

    JSON: {"name": "Daniel", "age": 30,}
    Rewrite: {"name": "Daniel", "age": 30} BFINISH

    JSON: {"name": "Daniel", "age": "30 years"}
    Rewrite: {"name": "Daniel", "age": 30} BFINISH

    JSON: {"name": "Emily", "email": "emily@example.com, "isActive": true}
    Rewrite: {"name": "Emily", "email": "emily@example.com", "isActive": true} BFINISH

    JSON: {date: "2021-01-01", action: "created account"}
    Rewrite: {"date": "2021-01-01", "action": "created account"} BFINISH

    JSON: ["Reading", "Cooking", "Traveling",]
    Rewrite: ["Reading", "Cooking", "Traveling"] BFINISH

    JSON: {"user": {"name": "Alex", "age": "32", "email": "alex@email.com"}}
    Rewrite: {"user": {"name": "Alex", "age": 32, "email": "alex@email.com"}} BFINISH

    JSON: {"items": ["apple", "banana", "pear", ]}
    Rewrite: {"items": ["apple", "banana", "pear"]} BFINISH

    JSON: {"id": 123, name: "Widget", "price": 19.99}
    Rewrite: {"id": 123, "name": "Widget", "price": 19.99} BFINISH

    JSON: {"name": "Alice", "email": "alice@example.com"}
    Rewrite: {"name": "Alice", "email": "alice@example.com"} BFINISH

    JSON: {"users": ["Alice", "Bob", "Charlie",]}
    Rewrite: {"users": ["Alice", "Bob", "Charlie"]} BFINISH

    JSON: {"product": {"id": "1A", name: "Laptop", "price": 799.99}}
    Rewrite: {"product": {"id": "1A", "name": "Laptop", "price": 799.99}} BFINISH

    JSON: {"details": {"height": 180cm, "weight": 75kg}}
    Rewrite: {"details": {"height": 180, "weight": 75}} BFINISH

    JSON: {"order": {"item": "book", "quantity": "three"}}
    Rewrite: {"order": {"item": "book", "quantity": 3}} BFINISH

    JSON: {"config": {"enabled": yes, "timeout": "30 seconds"}}
    Rewrite: {"config": {"enabled": true, "timeout": 30}} BFINISH

    `;

    let userExample = `
    JSON: ${jsonString}
    Rewrite: `;

    let fullPrompt = explanation + "\n\n" + examples + userExample;

    return fullPrompt;
}

export default rewriteJsonPrompt;
