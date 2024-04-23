import { body, validationResult } from "express-validator";

// function userRegisterValidatorRules() {
//     return [
//         body("firstname", "First Name is Required").notEmpty().isLength({ min: 2 }),
//         body("lastname", "Last Name is Required / Min 2 Characters").notEmpty().isLength({ min: 2 }),
//         body("email", "Email is Required").isEmail(),
//         body("password", "Password should be Min 8 Characters, Atleast 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Character")
//             .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
//         body("password2").custom(
//             (value, { req }) => {
//                 if (value !== req.body.password) {
//                     throw new Error("Password & Confirm Password do not match");
//                 } else {
//                     return true;
//                 }
//             }
//         ),
//         body("phone", "Phone Number is not valid").isMobilePhone(),
//         body("usertype").notEmpty().custom(
//             (value, { req }) => {
//                 if (!(value == "user" || value == "team")) {
//                     throw new Error("User Type can only be user or team");
//                 } else {
//                     return true;
//                 }
//             }
//         ),
//     ]
// }

function userLoginValidatorRules() {
  return [
    body("password", "Password is Required").notEmpty(),
    body("email", "Email is Required").isEmail(),
  ];
}

function forgotpasswordValidatorRules() {
  return [body("email", "Email is Required").isEmail()];
}

function verifyforgotpasswordValidatorRules() {
  return [
    body("email", "Email is Required").isEmail(),
    body("otp", "OTP is needed").notEmpty(),
  ];
}

function addUserRules() {
  return [
    body("email", "email cannot be empty").notEmpty(),
    body("name", "name cannot be empty").notEmpty(),
    body("password", "password name cannot be empty").notEmpty(),
    body("phone", "phone name cannot be empty").notEmpty(),
  ];
}

function errorMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

export {
  userLoginValidatorRules,
  forgotpasswordValidatorRules,
  verifyforgotpasswordValidatorRules,
  addUserRules,
  errorMiddleware,
};
