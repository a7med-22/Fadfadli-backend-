import cors from "cors";
import path from "node:path";
import checkConnectionDB from "./DB/connection.js";
import userModel from "./DB/models/user.model.js";
import messageRouter from "./modules/message/message.controller.js";
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
  app.use("/messages", messageRouter);

  // Admin-only endpoint to list all users (mounted at /users)
  app.get("/users", async (req, res, next) => {
    try {
      const users = await userModel.find({}, { password: 0, oldPasswords: 0 });
      return res.json({ message: "users fetched successfully", data: users });
    } catch (err) {
      next(err);
    }
  });

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`404 url not found ${req.originalUrl}`, { cause: 404 });
  });

  // the global error handler (error handling middleware)
  app.use(globalErrorHandling);
};
export default bootstrap;
