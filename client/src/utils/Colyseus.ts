import { Client } from "colyseus.js";

let client;
if (import.meta.env.VITE_NODE_ENV !== "development") {
    console.log("Production mode");
    client = new Client("/.proxy/colyseus");
} else {
    console.log("Development mode");
    client = new Client("http://localhost:2567");
}
export const colyseusSDK = client;