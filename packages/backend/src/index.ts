import express from "express";
import bodyParser from "body-parser";
import { DatabaseClient, FileToken, TextToken, Token, File } from "./DatabaseClient";
import fileUpload = require("express-fileupload");
import { basename, extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { mkdir, mv } from "shelljs";
import { v4 } from "uuid";

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
	const token = await databaseClient.getToken(req.params.token_id);
	res.status(201).send({
		validUntil: token.validUntil,
		text: (token as TextToken).text,
		files: (token as FileToken).files,
	})
});

app.post("/token/", async (req, res) => {
	try {
		const token: Partial<FileToken | TextToken> = req.body;
		if (!token.validUntil) {
			throw new Error("Missing required parameter token.validUntil");
		}

		let createdToken: FileToken | TextToken;
		if (typeof (token as any).text === "undefined") {
			const fileToken = token as FileToken;
			if (!fileToken.files || fileToken.files.length === 0) {
				throw new Error("Missing required property token.files or property is empty");
			}

			const files = fileToken.files.map(file => {
				const newFilePath = join(FileUploadDir, basename(file.path));
				mv(file.path, newFilePath);
				file.path = newFilePath;
				return file;
			});

			createdToken = await databaseClient.insertFileToken(files, token.validUntil);
		} else {
			const textToken = token as TextToken;
			if (!textToken.text || textToken.text.length === 0) {
				throw new Error("Missing required property token.text or property is empty");
			}

			createdToken = await databaseClient.insertTextToken(textToken.text, token.validUntil);
		}

		res.status(201).send({
			token: createdToken.token
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
					path: tmpFileName
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

// start the express server
const port = 8082;
app.listen(port, async () => {
	// tslint:disable-next-line:no-console
	await databaseClient.connect();
	console.log(`server started at http://localhost:${port}`);
});
