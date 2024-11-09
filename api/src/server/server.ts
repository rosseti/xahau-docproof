import dotenv from "dotenv";

dotenv.config();

import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import connectToDatabase from "../infra/database";

/* c8 ignore next */
const PORT: number = parseInt(`${process.env.PORT || 3000}`);

const app = express();

/* c8 ignore start */
if (process.argv.includes("--run")) app.use(morgan("tiny"));
/* c8 ignore end */

app.use(express.json());

import { router } from '@/shared/infra/http/routes';

app.use("/api", router);

app.get("/api/file/:hash", (req: any, res: any) => {
  const { hash } = req.params;

  const filePath = path.join(process.cwd(), "storage", `${hash}.pdf`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "File not found on filesystem" });
    }

    res.sendFile(filePath, (err: Error) => {
      if (err) {
        res.status(500).json({ message: "Error sending file" });
      }
    });
  });
});

/* c8 ignore start */
if (process.argv.includes("--run"))
  app.listen(PORT, async () => {
    console.log(`Server server running at ${PORT}.`);
    await connectToDatabase();
  });
/* c8 ignore end */

export { app };
