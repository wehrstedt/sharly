import Vue from "vue";
import axios from "axios";

Vue.prototype.$axios = axios;
// ^ ^ ^ this will allow you to use this.$axios
//       so you won't necessarily have to import axios in each vue file

interface Token {
	validUntil: number;
}

export interface FileToken extends Token {
	files: File[];
}

export interface TextToken extends Token {
	text: string;
}
export interface File {
	name: string;
	path: string;
}

const _api = axios.create({ baseURL: "/backend" });
const api = {

	downloadFile: (fileName: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			_api.get(`download-file/${fileName}`, {
				responseType: "blob"
			})
				.then((result) => resolve((result as any).data as any))
				.catch(reject);
		});
	},

	getToken: (tokenId: string): Promise<TextToken | FileToken> => {
		return new Promise((resolve, reject) => {
			_api.get(`token/${tokenId}`)
				.then((result) => resolve((result as any).data as FileToken))
				.catch(reject);
		});
	},

	createTextToken: (text: string, validUntil: number | Date): Promise<string> => {
		return new Promise((resolve, reject) => {
			_api.post("token", {
				text,
				validUntil: validUntil instanceof Date ? validUntil.getTime() : validUntil
			}).then(
				(result) => resolve((result as any).data.token as string)
			).catch(reject);
		});
	},

	createFileToken: (files: File[], validUntil: number | Date): Promise<string> => {
		return new Promise((resolve, reject) => {
			_api.post("token", {
				files,
				validUntil: validUntil instanceof Date ? validUntil.getTime() : validUntil
			}).then(
				(result) => resolve((result as any).data.token as string)
			).catch(reject);
		});
	},

	uploadFiles(formData: any): Promise<File[]> {
		return new Promise((resolve, reject) => {
			_api.post("upload", formData).then(
				(result) => resolve((result as any).data.uploadedFiles as File[])
			).catch(reject);
		});
	}

};

Vue.prototype.$backend = api;
// ^ ^ ^ this will allow you to use this.$api
//       so you can easily perform requests against your app's API

export { axios, api };
