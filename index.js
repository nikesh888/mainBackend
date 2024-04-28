import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import "./dbConnect.js";
import adminRouter from "./routers/adminRouter.js";
import scraperWs from "./websocket-scraper.js";

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
const PORT = process.env.PORT || 5000;
app.use(express.json()); //json body parser

app.use(cors({ origin: "*" }));
app.listen(PORT, () => console.log(`server started at port: ${PORT}`));

app.get("/test", (req, res) => {
  res.send("it works mate!");
});
scraperWs();

app.use("/api", adminRouter);
