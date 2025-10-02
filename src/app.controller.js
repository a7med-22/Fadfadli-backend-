import cors from "cors";
import path from "node:path";
import checkConnectionDB from "./DB/connection.js";
import { default as userRouter } from "./modules/user/user.controller.js";
import { globalErrorHandling } from "./utils/response.js";
const bootstrap = (app, express) => {
  app.use(express.json());

  checkConnectionDB();

  app.use(cors());
  app.use("/uploads", express.static(path.resolve("./src/uploads")));
  app.get("/", (req, res) => {
    return res.json({ message: "welcome to Fadfadli App" });
  });

  app.use("/users", userRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`404 url not found ${req.originalUrl}`, { cause: 404 });
  });

  // the global error handler (error handling middleware)
  app.use(globalErrorHandling);
};
export default bootstrap;
