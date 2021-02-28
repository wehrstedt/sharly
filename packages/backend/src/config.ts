export const API_SECRET = getEnvVariable("API_SECRET");
export const DB_HOST = getEnvVariable("DB_HOST");
export const DB_USER = getEnvVariable("DB_USER");
export const DB_PASSWD = getEnvVariable("DB_PASSWD");
export const DB_PORT = parseInt(getEnvVariableOrDefault("DB_PORT", "27017"));

function getEnvVariable(name: string) {
	const variable = process.env[name];
	if (!variable) {
		throw new Error(`Missing required environment variable '${name}'`);
	}

	return variable;
}

function getEnvVariableOrDefault<T>(name: string, defaultValue: T): T {
	return process.env[name] as any || defaultValue;
}
