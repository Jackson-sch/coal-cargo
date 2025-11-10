const { PrismaClient } = require("../../prisma/src/generated/prisma/client/index.js");
const prisma = new PrismaClient();
module.exports = { prisma };
