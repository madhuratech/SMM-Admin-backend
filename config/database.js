const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    // Some local/router DNS resolvers refuse Atlas SRV records even though
    // normal DNS lookups work. Allow the resolver to be configured for Atlas.
    const dnsServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (dnsServers.length > 0) {
      dns.setServers(dnsServers);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", {
      name: error.name,
      code: error.code,
      message: error.message,
      reason: error.reason?.message
    });
    process.exit(1);
  }
};

module.exports = connectDB;
