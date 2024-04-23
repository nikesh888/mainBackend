import express from "express";
import adminRouter from "./routers/adminRouter.js";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;
app.use(express.json()); //json body parser
app.use(cors());
app.listen(PORT, () => console.log(`server started at port: ${PORT}`));

app.get("/test", (req, res) => {
  res.send("it works mate!");
});

import "./dbConnect.js";

app.use("/api", adminRouter);
