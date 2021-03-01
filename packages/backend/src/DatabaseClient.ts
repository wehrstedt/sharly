import { Collection, Db, FilterQuery, MongoClient, Timestamp } from "mongodb";
import { DB_HOST, DB_PASSWD, DB_PORT, DB_USER } from "./config";

export class DatabaseClient {

	private static DB_NAME = "sharly";
	private static COLLECTON_NAME = "tokens";

	private client: MongoClient;
	private database: Db;
	private collection: Collection<Token>;

	constructor() {
		this.client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, {
			auth: {
				user: DB_USER,
				password: DB_PASSWD,
			}
		});
	}

	public async connect() {
		this.client = await this.client.connect();
		this.database = this.client.db(DatabaseClient.DB_NAME);
		this.collection = await this.database.collection(DatabaseClient.COLLECTON_NAME);
	}

	public async getExpiredTokens(): Promise<Token[]>{
		const result = await this.collection.find({
			validUntil: {
				$lte: Date.now()
			}
		});

		return result.toArray();
	}

	public async getToken(token: string): Promise<Token> {
		const result = await this.collection.findOne({
			token
		});

		if (!result) {
			throw new Error(`Cannot find token with id ${token}.`);
		}

		return result;
	}

	public async insertToken(validUntil: Date | number, text: string, files: File[]): Promise<Token> {
		const token = new Token(validUntil, text, files);
		await this.collection.insertOne(token);
		return token;
	}

	public async removeToken(token: Token) {
		await this.collection.deleteOne(token);
	}
}

export class Token {
	token: string;
	validUntil: number;

	constructor(validUntil: Date | number, public text: string, public files: File[] = []) {
		if (!text && files.length === 0) {
			throw new Error(`Please pass a text or at least one file to create a token.`);
		}

		this.validUntil = validUntil instanceof Date ? validUntil.getTime() : validUntil;
		this.token = "";
		for (let i = 0; i < 5; i++) {
			this.token += this.getRandomInt(0, 9).toString();
		}
	}

	private getRandomInt(min: number, max: number): number {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}
}

export interface File {
	name: string;
	path: string;
}
