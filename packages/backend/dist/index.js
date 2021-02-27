"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const DatabaseClient_1 = require("./DatabaseClient");
const app = express_1.default();
const databaseClient = new DatabaseClient_1.DatabaseClient();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.get("/token/:token_id", async (req, res) => {
    const token = await databaseClient.getToken(req.params.token_id);
    res.status(201).send({
        validUntil: token.validUntil,
        text: token.text,
        files: token.files,
    });
});
app.post("/token/", async (req, res) => {
    try {
        const token = req.body;
        if (!token.validUntil) {
            throw new Error("Missing required parameter token.validUntil");
        }
        let createdToken;
        if (token instanceof DatabaseClient_1.FileToken) {
            if (!token.files || token.files.length === 0) {
                throw new Error("Missing required property token.files or property is empty");
            }
            createdToken = await databaseClient.insertFileToken(token.files, token.validUntil);
        }
        else {
            if (!token.text || token.text.length === 0) {
                throw new Error("Missing required property token.text or property is empty");
            }
            createdToken = await databaseClient.insertTextToken(token.text, token.validUntil);
        }
        res.status(201).send({
            token: createdToken.token
        });
    }
    catch (err) {
        const error = (err instanceof Error) ? err.message : err.toString();
        res.status(400).send({
            error
        });
    }
});
// start the express server
const port = 8082;
app.listen(port, async () => {
    // tslint:disable-next-line:no-console
    await databaseClient.connect();
    console.log(`server started at http://localhost:${port}`);
});
