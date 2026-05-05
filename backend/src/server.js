import { app } from "./app.js";
import { connectDb } from "./config/db.js";

const port = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  await connectDb();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});