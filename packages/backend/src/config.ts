// tslint:disable-next-line:max-line-length
export const API_SECRET = ((): string => {
	const secret = process.env.API_SECRET;
	if (!secret) {
		throw new Error("Missing required environment variable 'API_SECRET'");
	}

	return secret;
})();
