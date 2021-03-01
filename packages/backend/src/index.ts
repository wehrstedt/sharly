import { Backend } from "./backend";
import { SHARLY_PORT } from "./config";

const backend = new Backend();
backend.app.listen(SHARLY_PORT, async () => {
	await backend.databaseClient.connect();
	console.log(`Sharly started at http://localhost:${SHARLY_PORT}`);

	removeExpiredWebTokens();
	removeExpiredTokens();
});

// Validate every hour all Web tokens and remove expired
const removeExpiredWebTokens = () => {
	try {
		backend.removeExpiredWebTokens();
		setTimeout(() => {
			removeExpiredWebTokens();
		}, 60 * 60 * 1000);
	} catch (err) {
		// supress errors to keep service alive
		console.error(err);
	}
};

// Check every minute for expired tokens and delete them
const removeExpiredTokens = () => {
	backend.removeExpiredTokens().then(() => {
		setTimeout(removeExpiredTokens, 60 * 1000);
	}).catch((err) => {
		// supress errors to keep service alive
		console.error(err);
	});
};
