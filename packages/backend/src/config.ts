export const SHARLY_PASSWD = getEnvVariable("SHARLY_PASSWD");
export const SHARLY_PORT = parseInt(getEnvVariableOrDefault("SHARLY_PORT", "8082"), 10);
export const DB_HOST = getEnvVariable("DB_HOST");
export const DB_USER = getEnvVariable("DB_USER");
export const DB_PASSWD = getEnvVariable("DB_PASSWD");
export const DB_PORT = parseInt(getEnvVariableOrDefault("DB_PORT", "27017"), 10);
export const FILE_UPLD_DIR = getEnvVariableOrDefault("FILE_UPLD_DIR", "files");
export const FILE_TMP_DIR = getEnvVariableOrDefault("FILE_TMP_DIR", "files-tmp");

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
