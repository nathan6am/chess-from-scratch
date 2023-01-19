import "reflect-metadata";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "postgres",
  username: "ncadmin",
  port: 5432,
  password: "171874A$10yyz",
  database: "postgres",
  host: "nextchess-test.cgagzcwunlpi.us-east-1.rds.amazonaws.com",
});

(async () => {
  try {
    await datasource.initialize();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
