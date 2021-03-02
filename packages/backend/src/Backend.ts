import { sign, verify } from "jsonwebtoken";
import express from "express";
import bodyParser from "body-parser";
import { DatabaseClient, Token, File } from "./DatabaseClient";
import fileUpload = require("express-fileupload");
import { basename, extname, join } from "path";
import { existsSync } from "fs";
import { mkdir, mv, rm } from "shelljs";
import { v4 } from "uuid";
import { SHARLY_PASSWD, FILE_TMP_DIR, FILE_UPLD_DIR } from "./config";
import { Express, Request, Response } from "express";
import { fips } from "crypto";

export class Backend {

	public app: Express;
	public databaseClient: DatabaseClient;
	private webTokens: Set<string>;
	private API_SECRET: string;

	constructor() {
		this.webTokens = new Set();
		this.API_SECRET = v4();

		for (const dir of [FILE_UPLD_DIR, FILE_TMP_DIR]) {
			if (!existsSync(dir)) {
				mkdir("-p", dir);
			}
		}

		this.databaseClient = new DatabaseClient();
		this.app = express();
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(fileUpload());

		// Routes
		this.app.post("/auth", this.auth.bind(this));
		this.app.post("/token/", this.enforceIsAuthenticated.bind(this, this.createToken));
		this.app.get('/download-file/:file', this.downloadFile.bind(this));
		this.app.get("/token/:token_id", this.getToken.bind(this));
		this.app.post("/upload/", this.enforceIsAuthenticated.bind(this, this.upload));
	}

	public async removeExpiredTokens() {
		const expiredTokens = await this.databaseClient.getExpiredTokens();
		for (const token of expiredTokens) {
			for (const file of token.files) {
				const filePath = this.getFilePath(file.path);
				rm(filePath);
			}

			await this.databaseClient.removeToken(token);
		}
	}

	public removeExpiredWebTokens() {
		for (const token of this.webTokens) {
			verify(token, this.API_SECRET, (err) => {
				if (err && err.name === "TokenExpiredError") {
					this.webTokens.delete(token);
				}
			});
		}
	}

	private async auth(request: Request, response: Response) {
		try {
			if (request.body) {
				if (request.body.password) {
					if (request.body.password === SHARLY_PASSWD) {
						const webToken = v4();
						this.webTokens.add(webToken);
						response.status(200).send({
							auth: true,
							token: sign({ webToken }, this.API_SECRET, {
								expiresIn: "1h"
							}),
						});
					} else {
						response.status(401).send();
					}
				} else if (request.body.token) {
					try {
						const verified = verify(request.body.token, this.API_SECRET) as any;
						response.status(200).send({
							auth: this.webTokens.has(verified.webToken)
						});
					} catch (err) {
						response.status(200).send({
							auth: false
						});
					}
				} else {
					response.status(400).send({
						error: "Missing password or token",
					});
				}
			} else {
				response.status(400).send({
					error: "Missing password or token",
				});
			}
		} catch (err) {
			const errObj = (err instanceof Error) ? err : new Error(err);
			console.error(`${errObj.message}\n\nStack:\n${errObj.stack}\n`);
			response.status(500).send({
				error: errObj.message,
				stack: errObj.stack,
			});
		}
	}

	private async createToken(req: Request, res: Response) {
		try {
			const requestData: Partial<Token> = req.body;
			if (!requestData.validUntil) {
				throw new Error("Missing required parameter token.validUntil");
			}

			let files: File[] = [];
			if (requestData.files) {
				files = requestData.files.map(file => {
					const newFilePath = this.getFilePath(basename(file.path));
					mv(this.getFileTmpPath(file.path), newFilePath);
					file.path = basename(newFilePath);
					return file;
				});
			}

			const token = await this.databaseClient.insertToken(requestData.validUntil, requestData.text || "", files);
			res.status(201).send({
				token: token.token
			});
		} catch (err) {
			const error = (err instanceof Error) ? err.message : err.toString();
			res.status(400).send({
				error
			});
		}
	}

	private async downloadFile(req: Request, res: Response) {
		const fileName = req.params.file;
		const filePath = this.getFilePath(fileName);
		if (existsSync(filePath)) {
			res.download(filePath, (err) => {
				if (err) {
					res.status(500).send({
						message: "Could not download the file. " + err,
					});
				}
			});
		} else {
			res.status(404).send();
		}
	}

	private async enforceIsAuthenticated(next: (req: Request, res: Response) => Promise<any>, request: Request, response: Response) {
		const token = request.headers.authorization;
		if (token) {
			try {
				const verified = verify(token, this.API_SECRET) as any;
				if (this.webTokens.has(verified.webToken)) {
					await next.call(this, request, response);
				}
			} catch (err) {
				response.status(401).send();
			}
		} else {
			response.status(401).send();
		}
	}

	private getFilePath(fileName: string) {
		return join(FILE_UPLD_DIR, fileName);
	}

	private getFileTmpPath(fileName: string) {
		return join(FILE_TMP_DIR, fileName);
	}

	private async getToken(req: Request, res: Response) {
		try {
			const token = await this.databaseClient.getToken(req.params.token_id);
			res.status(201).send({
				validUntil: token.validUntil,
				text: token.text,
				files: token.files,
			})
		} catch (err) {
			res.status(404).send();
		}
	}

	private async upload(req: Request, res: Response) {
		if (!req.files || Object.keys(req.files).length === 0) {
			res.status(400).send('No files were uploaded.');
		} else {
			const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
			const uploadedFiles: File[] = [];

			try {
				for (const file of files) {
					const tmpFileName = `${v4()}${extname(file.name)}`;
					const uploadPath = this.getFileTmpPath(tmpFileName);
					await file.mv(uploadPath);
					uploadedFiles.push({
						name: file.name,
						path: basename(tmpFileName)
					});
				}
			} catch (err) {
				return res.status(500).send(err);
			}

			res.status(201).send({
				uploadedFiles
			});
		}
	}
}
