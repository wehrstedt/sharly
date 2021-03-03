import { Collection, Db, FilterQuery, MongoClient, Timestamp } from "mongodb";
import waitOn from "wait-on";
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
		try {
			await waitOn({
				resources: [
					`tcp:${DB_HOST}:${DB_PORT}`,
				],
				log: true,
				timeout: 1000 * 60
			});
		} catch (err) {
			throw new Error(`Cannot connect to database. Waited for 1 minute on connection at ${DB_HOST}:${DB_PORT}`);
		}

		console.log("Got a response from database. Waiting for 5 seconds before connect...");
		await new Promise(resolve => setTimeout(resolve, 5000));
		this.client = await this.client.connect();
		this.database = this.client.db(DatabaseClient.DB_NAME);
		this.collection = await this.database.collection(DatabaseClient.COLLECTON_NAME);
	}

	public async getExpiredTokens(): Promise<Token[]> {
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
		const tokenId = await this.generateUniqueTokenId();
		const token = new Token(tokenId, validUntil, text, files);
		await this.collection.insertOne(token);
		return token;
	}

	public async removeToken(token: Token) {
		// do not delete tokens to prevent that a token id is generated more then once.
		// just remove the data from the token
		await this.collection.updateOne(token, {
			$set: {
				text: "",
				files: [],
				validUntil: undefined
			}
		});
	}

	private async generateUniqueTokenId(): Promise<string> {
		let token = "";
		for (let i = 0; i < 5; i++) {
			token += this.getRandomInt(0, 9).toString();
		}

		const tokenExists = await this.collection.findOne({
			token
		}) !== null;

		if (tokenExists) {
			return this.generateUniqueTokenId();
		} else {
			return token;
		}
	}

	private getRandomInt(min: number, max: number): number {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}
}

export class Token {

	validUntil: number;

	constructor(public token: string, validUntil: Date | number, public text: string, public files: File[] = []) {
		if (!text && files.length === 0) {
			throw new Error(`Please pass a text or at least one file to create a token.`);
		}

		this.validUntil = validUntil instanceof Date ? validUntil.getTime() : validUntil;
	}

}

export interface File {
	name: string;
	path: string;
}
