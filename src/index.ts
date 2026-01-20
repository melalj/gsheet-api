import app from "./api/index.js";

export function start(): void {
	const port = Number(process.env.PORT || 80);
	const host = process.env.HOST || "0.0.0.0";
	app.listen(port, host, () => {
		console.log(`gsheet-api listening at http://localhost:${port}`);
	});
}
