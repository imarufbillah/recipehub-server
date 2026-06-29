const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_BASE_URL}/api/auth/jwks`),
);

const optionalToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const { payload } = await jwtVerify(token, JWKS);
      req.user = payload;
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { optionalToken };
