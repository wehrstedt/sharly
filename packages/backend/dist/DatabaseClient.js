"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextToken = exports.FileToken = exports.Token = exports.DatabaseClient = void 0;
const mongodb_1 = require("mongodb");
class DatabaseClient {
    constructor() {
        this.client = new mongodb_1.MongoClient(DatabaseClient.DB_URL, {
            auth: {
                user: DatabaseClient.DB_USER,
                password: DatabaseClient.DB_PASSWD,
            }
        });
    }
    async connect() {
        this.client = await this.client.connect();
        this.database = this.client.db(DatabaseClient.DB_NAME);
        this.collection = await this.database.collection(DatabaseClient.COLLECTON_NAME);
    }
    async getToken(token) {
        const result = await this.collection.findOne({
            token
        });
        if (!result) {
            throw new Error(`Cannot find token with id ${token}.`);
        }
        return result;
    }
    async insertTextToken(text, validUntil) {
        const token = new TextToken(text, validUntil);
        await this.collection.insertOne(token);
        return token;
    }
    async insertFileToken(files, validUntil) {
        const token = new FileToken(files, validUntil);
        await this.collection.insertOne(token);
        return token;
    }
}
exports.DatabaseClient = DatabaseClient;
DatabaseClient.DB_URL = "mongodb://localhost:27017";
DatabaseClient.DB_USER = "root";
DatabaseClient.DB_PASSWD = "toor";
DatabaseClient.DB_NAME = "sharly";
DatabaseClient.COLLECTON_NAME = "tokens";
class Token {
    constructor(validUntil) {
        this.validUntil = validUntil instanceof Date ? validUntil.getTime() : validUntil;
        this.token = "";
        for (let i = 0; i < 5; i++) {
            this.token += this.getRandomInt(0, 9).toString();
        }
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
exports.Token = Token;
class FileToken extends Token {
    constructor(files, validUntil) {
        super(validUntil);
        this.files = files;
    }
}
exports.FileToken = FileToken;
class TextToken extends Token {
    constructor(text, validUntil) {
        super(validUntil);
        this.text = text;
    }
}
exports.TextToken = TextToken;
