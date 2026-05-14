const { Prisma } = require("@prisma/client/extension")

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;