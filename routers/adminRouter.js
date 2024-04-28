import bcrypt from "bcrypt";
import express from "express";
import fs from "fs/promises";
import qr from "qrcode";
import requestIp from "request-ip";
import wpw from "whatsapp-web.js";
import {
  addUserRules,
  errorMiddleware,
  userLoginValidatorRules,
} from "../middlewares/validations/index.js";
import Admin from "../models/admin.js";
import Resellers from "../models/resellers.js";
import Users from "../models/users.js";
const { Client, LocalAuth, MessageMedia } = wpw;

import generateToken from "../auth/generateToken.js";
import authMiddleware from "../auth/verifyToken.js";
import Payments from "../models/payments.js";
import scraper from "../websocket-scraper.js";
const router = express.Router();

const initializeClient = () => {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "User4",
    }),
    puppeteer: {
      headless: true,
    },
  });

  return client;
};

// Send message to a single number
/**
 *
 * @param {wpw.Client} client
 */
const sendMessageToNumber = async (client, number, message, media, token) => {
  const numberDetails = await client.getNumberId(number);
  if (numberDetails) {
    try {
      const sendMessageData = await client.sendMessage(
        numberDetails._serialized,
        message,
        { media }
      );
      await fs.appendFile(`./logs/${token}.txt`, `Message Sent to ${number}\n`);
      return sendMessageData;
    } catch (error) {
      await fs.appendFile(
        `logs/${token}.txt`,
        `Unable to send message to ${number}\n`
      );

      console.error(`Error occurred sending message: ${error}`);
      throw error;
      return null;
    }
  } else {
    console.log(`${number} - Mobile number is not registered`);
    return null;
  }
};

router.get("/getQR", async (req, res) => {
  try {
    const loggedInFile = await fs.readFile(
      "./image/alreadyLoggedIn.txt",
      "utf-8"
    );
    const client = initializeClient();

    client.on("qr", async (qrData) => {
      try {
        // Generate QR code image from the data
        const qrImage = await qr.toDataURL(qrData);
        // Log the QR code data to console
        res.send(qrImage);
      } catch (error) {
        console.log(error);
      }
    });
    client.on("ready", async () => {
      setTimeout(async () => {
        await client.destroy();
        try {
          res.send(loggedInFile);
        } catch (error) {
          console.log(error);
        }
      }, 2000);
    });
    client.initialize();
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
router.post(
  "/login",
  userLoginValidatorRules(),
  errorMiddleware,
  async (req, res) => {
    try {
      //Destructuring Req.Body
      let { email, password } = req.body;

      let userData = await Admin.findOne({ email });

      if (!userData) {
        userData = await Resellers.findOne({ email });
      }
      if (!userData)
        return res.status(404).json({ error: "Invalid Credentials" });

      const passValid = await bcrypt.compare(password, userData.password);
      if (!passValid)
        return res.status(401).json({ error: "Invalid Credentials" });

      let payload = {
        email: userData.email,
        _id: userData._id,
        type: userData.userType,
      };
      let token = generateToken(payload);
      const clientip = requestIp.getClientIp(req);

      // res.cookie("token", token).send();
      res
        .status(200)
        .json({ token, role: userData.userType, clientip, id: userData._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
router.post(
  "/userlogin",
  userLoginValidatorRules(),
  errorMiddleware,
  async (req, res) => {
    try {
      //Destructuring Req.Body
      let { email, password } = req.body;

      let userData = await Users.findOne({ email });

      if (!userData)
        return res.status(404).json({ error: "Invalid Credentials" });

      const passValid = await bcrypt.compare(password, userData.password);
      if (!passValid)
        return res.status(401).json({ error: "Invalid Credentials" });

      let payload = {
        email: userData.email,
        _id: userData._id,
        type: userData.userType,
      };
      let token = generateToken(payload);
      const clientip = requestIp.getClientIp(req);

      // res.cookie("token", token).send();
      res.status(200).json({
        token,
        role: userData.userType,
        clientip,
        whatsapp: userData.whatsapp,
        database: userData.database,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/adduser",
  authMiddleware,
  addUserRules(),
  errorMiddleware,
  async (req, res) => {
    try {
      let owner = req.payload.email;

      let ownerData = await Admin.findOne({ email: owner });
      if (!ownerData) {
        ownerData = await Resellers.findOne({ email: owner });
      }
      let { email, password, name, phone, database, whatsapp } = req.body;

      console.log(req.body);

      let userData = await Users.findOne({ email });

      if (userData) {
        return res.status(409).json({ error: "user already registered" });
      }

      req.body.password = await bcrypt.hash(password, 12);

      /*
          Pushing the project name inside the
          project array & saving it
      */
      let user = new Users(req.body);
      userData = user;
      user.owner = req.payload.email;

      await ownerData.save();
      await userData.save();

      res.status(200).json({ success: `User added successfuly` });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.post(
  "/addressellers",
  authMiddleware,
  addUserRules(),
  errorMiddleware,
  async (req, res) => {
    try {
      let owner = req.payload.email;

      let ownerData = await Admin.findOne({ email: owner });
      if (!ownerData) {
        return res.status(409).json({ error: "You are not an admin!" });
      }

      let { email, password, name, phone } = req.body;

      let userData = await Resellers.findOne({ email });

      if (userData) {
        return res
          .status(409)
          .json({ error: "Reseller Email Already Registered" });
      }

      req.body.password = await bcrypt.hash(password, 12);

      /*
          Pushing the project name inside the
          project array & saving it
      */
      let user = new Resellers(req.body);
      user.owner = req.payload.email;
      userData = user;

      await userData.save();

      res.status(200).json({ success: `Resseller added successfuly` });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.put(
  "/updateBranding",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let email = req.payload.email;

      console.log(email);
      let userData = await Admin.findOne({ email });
      if (!userData) {
        userData = await Resellers.findOne({ email });
      }

      let { name, logo } = req.body;

      userData.companyName = name;
      userData.companylogo = logo;

      await userData.save();

      res.status(200).json({ success: `updated` });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.get(
  "/getBranding",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let email = req.payload.email;

      let userData = await Admin.findOne({ email });
      if (!userData) {
        userData = await Resellers.findOne({ email });
      }

      let name = userData.companyName;
      let logo = userData.companylogo;

      res.status(200).json({ name, logo });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.get(
  "/getressellers",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let email = req.payload.email;
      console.log(email);

      let userData = await Admin.findOne({ email });

      if (!userData) {
        userData = await Resellers.findOne({ email });

        if (!userData)
          return res.status(404).json({ error: "Invalid Credentials" });
      }

      let data = await Resellers.find();

      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.get(
  "/getallusers",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let email = req.payload.email;

      let userData = await Admin.findOne({ email });

      // if (!userData) {
      //   userData = await Resellers.findOne({ email });

      //   if (!userData)
      //     return res.status(404).json({ error: "Invalid Credentials" });
      // }

      let data = await Users.find({ owner: email });

      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.post("/getdata", errorMiddleware, async (req, res) => {
  try {
    let { keyword, pincode } = req.body;

    let results = await scraper(keyword, pincode);

    return res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: `Internal Server Issue` });
  }
});

router.post("/sendmsg", async (req, res) => {
  try {
    const { numbers, message, fileToSend, token, type, fileName } = req.body;

    // Initialize WhatsApp client
    const client = initializeClient();

    client.on("ready", async () => {
      // Send messages to numbers
      for (const number of numbers) {
        console.log(`Sending message to ${number}`);
        let media = undefined;
        if (fileToSend[0] && type[0]) {
          media = fileToSend
            ? new MessageMedia(type[0], fileToSend[0], fileName[0])
            : undefined;
        }
        await sendMessageToNumber(client, number, message, media, token);
      }
      res.send("Messages sent successfully!");
      setTimeout(() => {
        client.destroy();
      }, 5000);
    });

    // Initialize the client
    client.initialize();
  } catch (err) {
    res.send("internal server error");
  }
});

router.post("/getLogs", async (req, res) => {
  const token = req.body.id;

  // Check if token is present
  if (!token) {
    return res.status(400).send("Token is required");
  }

  // Read logs from file
  const logsFilePath = `./logs/${token}.txt`;

  try {
    const data = await fs.readFile(logsFilePath, "utf8");

    // Split logs by newline character and wrap each line in a span tag
    const logsArray = data.split("\n");
    const logsHTML = logsArray.map((log) => log).join("\n");

    // Send the logs in HTML format
    res.send(logsHTML);
  } catch (err) {
    // Handle file read error
    res.status(204).send("Error reading logs");
  }
});
router.post(
  "/addpayments",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let owner = req.payload.email;

      let ownerData = await Admin.findOne({ email: owner });
      if (!ownerData) {
        ownerData = await Resellers.findOne({ email: owner });
      }
      let { email, name, phone, amount, method } = req.body;
      let paymentData = Payments.find();
      let payment = new Payments(req.body);
      payment.owner = owner;
      payment.date = new Date();
      paymentData = payment;

      await paymentData.save();

      res.status(200).json({
        success: `Payments added successfuly`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

router.get(
  "/getpayments",
  authMiddleware,
  errorMiddleware,
  async (req, res) => {
    try {
      let email = req.payload.email;

      // if (!userData) {
      //   userData = await Resellers.findOne({ email });

      //   if (!userData)
      //     return res.status(404).json({ error: "Invalid Credentials" });
      // }

      let data = await Payments.find({ owner: email });

      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Internal Server Issue` });
    }
  }
);

export default router;
