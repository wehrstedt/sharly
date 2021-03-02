import axios from "axios";

const jwt = localStorage.getItem("jwt");
axios.defaults.headers.common.Authorization = jwt;
axios.interceptors.response.use(response => response, error => {
  if (error.response.status === 401) {
    throw new Error("Not authorized");
  }

  throw error;
});

export interface Token {
  validUntil: number;
  files: File[];
  text: string;
}

export interface File {
  name: string;
  path: string;
}

let backendURL = process.env.SHARLY_BACKEND_HOST;
if (backendURL) {
  backendURL += `:${process.env.SHARLY_BACKEND_PORT || "8082"}`;
} else {
  // proxy in quasar.conf
  backendURL = "/sharly-backend";
}

console.log("BACKEND URL: " + backendURL);
const _api = axios.create({ baseURL: backendURL });
const api = {

  auth: (password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      _api.post("auth", {
        password
      })
        .then((result) => {
          localStorage.setItem("jwt", result.data.token);
          resolve(result.data.token);
        })
        .catch(reject);
    });
  },

  downloadFile: (fileName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      _api.get(`download-file/${fileName}`, {
        responseType: "blob"
      })
        .then((result) => resolve((result as any).data))
        .catch(reject);
    });
  },

  getToken: (tokenId: string): Promise<Token> => {
    return new Promise((resolve, reject) => {
      _api.get(`token/${tokenId}`)
        .then((result) => resolve((result as any).data as Token))
        .catch(reject);
    });
  },

  isAuthorized(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      _api.post("auth", {
        token: localStorage.getItem("jwt")
      })
        .then((result) => resolve(result.data.auth))
        .catch(reject);
    });
  },

  createToken: (validUntil: number | Date, text = "", files: File[] = []): Promise<string> => {
    return new Promise((resolve, reject) => {
      _api.post("token", {
        text,
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

export { axios, api, backendURL };
