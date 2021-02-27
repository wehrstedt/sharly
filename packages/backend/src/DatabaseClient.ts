import { Collection, Db, FilterQuery, MongoClient, Timestamp } from "mongodb";

export class DatabaseClient {

	private static DB_URL = "mongodb://localhost:27017";
	private static DB_USER = "root";
	private static DB_PASSWD = "toor";
	private static DB_NAME = "sharly";
	private static COLLECTON_NAME = "tokens";

	private client: MongoClient;
	private database: Db;
	private collection: Collection<FileToken | TextToken>;

	constructor() {
		this.client = new MongoClient(DatabaseClient.DB_URL, {
			auth: {
				user: DatabaseClient.DB_USER,
				password: DatabaseClient.DB_PASSWD,
			}
		});
	}

	public async connect() {
		this.client = await this.client.connect();
		this.database = this.client.db(DatabaseClient.DB_NAME);
		this.collection = await this.database.collection(DatabaseClient.COLLECTON_NAME);
	}

	public async getToken(token: string): Promise<FileToken | TextToken> {
		const result = await this.collection.findOne({
			token
		});

		if (!result) {
			throw new Error(`Cannot find token with id ${token}.`);
		}

		return result;
	}

	public async insertTextToken(text: string, validUntil: Date | number): Promise<TextToken> {
		const token = new TextToken(text, validUntil);
		await this.collection.insertOne(token);
		return token;
	}

	public async insertFileToken(files: File[], validUntil: Date | number): Promise<FileToken> {
		const token = new FileToken(files, validUntil);
		await this.collection.insertOne(token);
		return token;
	}
}

export abstract class Token {
	token: string;
	validUntil: number;

	constructor(validUntil: Date | number) {
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

export class FileToken extends Token {
	token: string;
	validUntil: number;

	constructor(public files: File[], validUntil: Date | number) {
		super(validUntil);
	}
}

export class TextToken extends Token {
	token: string;
	validUntil: number;

	constructor(public text: string, validUntil: Date | number) {
		super(validUntil);
	}
}

export interface File {
	name: string;
	path: string;
}
