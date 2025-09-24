import mongoose from "mongoose";

const checkConnectionDB = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("successfully connected to database.....😇😍");
    })
    .catch((error) => {
      console.log("failed to connect to database", error.message);
    });
};

export default checkConnectionDB;
