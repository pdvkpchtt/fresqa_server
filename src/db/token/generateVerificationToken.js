const {
  createVerificationToken,
  deleteVerificationToken,
  getVerificationTokenByEmail,
} = require("./verificationToken");

const generateVerificationToken = async (email) => {
  let token = "";
  // for (let i = 0; i < 6; i++) {
  //   let digit = Math.floor(Math.random() * 10);
  //   token += digit;
  // }
  token = "000000";
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) await deleteVerificationToken(existingToken.id);

  const verificationToken = await createVerificationToken(
    email,
    token,
    expires
  );

  return verificationToken;
};

module.exports = { generateVerificationToken };
