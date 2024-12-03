import { Client } from "colyseus.js";

let client;
if (import.meta.env.NODE_ENV === "production") {
    console.log("Production mode");
    client = new Client("/.proxy/colyseus");
} else {
    console.log("Development mode");
    client = new Client("http://localhost:2567");
}

export const colyseusSDK = client;