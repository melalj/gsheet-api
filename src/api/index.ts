import compression from "compression";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import morgan from "morgan";

import { type AppError, throwError } from "../utils.js";
import gsheetEndpoint from "./gsheet.js";

const logger = morgan("combined");

const endpoints: Record<string, express.Router> = {
	"/": gsheetEndpoint,
};

// Bootstrap express server
const app = express();

// Add Middlewares
app.disable("x-powered-by");
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);
app.use(express.json({ limit: "10mb" }));
app.use(
	express.urlencoded({ limit: "10mb", extended: true, parameterLimit: 10000 }),
);

// Health check
app.get("/~health", (_req: Request, res: Response) => res.send("ok"));
app.get("/health", (_req: Request, res: Response) => res.send("ok"));

// Remove trailing slashes
app.use((req: Request, res: Response, next: NextFunction) => {
	if (req.path.slice(-1) === "/" && req.path.length > 1) {
		const query = req.url.slice(req.path.length);
		res.redirect(301, req.path.slice(0, -1) + query);
	} else {
		next();
	}
});

// Compression
app.use(compression());

// Logs
app.use(logger);

// Check privateKey
app.use((req: Request, _res: Response, next: NextFunction) => {
	if (
		(process.env.PRIVATE_API_KEY &&
			process.env.PRIVATE_API_KEY !== req.get("X-Private-Api-Key")) ||
		(process.env.PRIVATE_API_KEY_QUERY &&
			process.env.PRIVATE_API_KEY_QUERY !==
				(req.query.key as string | undefined))
	) {
		throwError("Unauthorized", 403);
	}
	return next();
});

// API Endpoints
Object.keys(endpoints).forEach((endpoint) => {
	app.use(endpoint, endpoints[endpoint]);
});

// Page not found
app.use((_req: Request, res: Response) => {
	res.status(404);
	return res.send({ error: "Not found" });
});

// Output Error page
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
	const status = err.status || 500;
	res.status(status);
	if (status >= 500) {
		console.error(`${err.message} (${err.stack?.replace(/\n/g, ", ")})`);
	}
	if (process.env.NODE_ENV === "production") {
		return res.send({ error: err.message });
	}
	res.send({
		error: err.message,
		status,
		trace: err,
		stack: err.stack,
	});
});

export default app;
