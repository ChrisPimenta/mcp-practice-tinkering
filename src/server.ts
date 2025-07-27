import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";

const server = new McpServer({
    name: "test",
    version: "1.0.0",
    description: "A simple MCP server",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {}
    }
});

const userSchema = {
    name: z.string(),
    email: z.string(),
    address: z.string(),
    phone: z.string()
};

const toolAnnotations = {
    title: "Create User",
    // Tells the AI this tool modifies the database
    readOnlyHint: false,
    // This does not delete data
    destructiveHint: false,
    // If you run it multiple times it doesn't matter
    idempotentHint: false,
    // Does it interat with something external to itself
    openWorldHint: true
};

type User = {
    name: string,
    email: string,
    address: string,
    phone: string
}

const createUser = async (user: User) => {
    const users = await import("./data/users.json", {
        with: {type: "json"},
    }).then(m => m.default);

    const id = users.length + 1;

    users.push({ id, ...user });

    await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    
    return id;
}

server.tool(
    "create-user", 
    "Create a new user in the database",
    userSchema,
    toolAnnotations,
    async params => {
        try {
            const id = await createUser(params);
    
            return {
                content: [{type: "text", text: `User ${id} created successfully`}],
            }
        }
        catch {
            return {
                content: [{type: "text", text: "Failed to save user"}],
            }
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();