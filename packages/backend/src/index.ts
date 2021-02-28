import { sign, verify } from "jsonwebtoken";
import express from "express";
import bodyParser from "body-parser";
import { DatabaseClient, Token, File } from "./DatabaseClient";
import fileUpload = require("express-fileupload");
import { basename, extname, join } from "path";
import { existsSync } from "fs";
import { mkdir, mv } from "shelljs";
import { v4 } from "uuid";
import { API_SECRET } from "./config";

const FileUploadDir = "files";
const FileTmpDir = "files-tmp";
for (const dir of [FileUploadDir, FileTmpDir]) {
	if (!existsSync(dir)) {
		mkdir("-p", dir);
	}
}

const app = express();
const databaseClient = new DatabaseClient();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get("/token/:token_id", async (req, res) => {
	try {
		const token = await databaseClient.getToken(req.params.token_id);
		res.status(201).send({
			validUntil: token.validUntil,
			text: token.text,
			files: token.files,
		})
	} catch (err) {
		res.status(404).send();
	}
});

app.post("/token/", async (req, res) => {
	try {
		const requestData: Partial<Token> = req.body;
		if (!requestData.validUntil) {
			throw new Error("Missing required parameter token.validUntil");
		}

		let files: File[] = [];
		if (requestData.files) {
			files = requestData.files.map(file => {
				const newFilePath = join(FileUploadDir, basename(file.path));
				mv(join(FileTmpDir, file.path), newFilePath);
				file.path = basename(newFilePath);
				return file;
			});
		}

		const token = await databaseClient.insertToken(requestData.validUntil, requestData.text || "", files);
		res.status(201).send({
			token: token.token
		});
	} catch (err) {
		const error = (err instanceof Error) ? err.message : err.toString();
		res.status(400).send({
			error
		});
	}
});

app.post("/upload/", async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		res.status(400).send('No files were uploaded.');
	} else {
		const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
		const uploadedFiles: File[] = [];

		try {
			for (const file of files) {
				const tmpFileName = `${v4()}${extname(file.name)}`;
				const uploadPath = join(FileTmpDir, tmpFileName);
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
});

app.get('/download-file/:file', function (req, res) {
	const fileName = req.params.file;
	const filePath = join(FileUploadDir, fileName);
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
});

app.post("/auth", function (request, response) {
	try {
		if (request.body) {
			if (request.body.password) {
				if (request.body.password === apiPassword) {
					const webToken = v4();
					webTokens.add(webToken);
					response.status(200).send({
						auth: true,
						token: sign({ webToken }, API_SECRET, {
							expiresIn: "1h"
						}),
					});
				} else {
					response.status(401).send();
				}
			} else if (request.body.token) {
				try {
					const verified = verify(request.body.token, API_SECRET) as any;
					response.status(200).send({
						auth: webTokens.has(verified.webToken)
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
});

// start the express server
const port = 8082;
const apiPassword = "test123";
const webTokens = new Set();
app.listen(port, async () => {
	// tslint:disable-next-line:no-console
	await databaseClient.connect();
	console.log(`server started at http://localhost:${port}`);
});
