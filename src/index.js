import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Client } from "pg";
import { Server } from "socket.io";

const PORT = 5000;
const interval = 10 * 1000;

const app = express();
const server = http.createServer(app);

const io = new Server(server);

dotenv.config();

const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

const connectionData = {
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT
};

const client = new Client(connectionData);

client.connect();

async function averageUsers() {
  const { rows } = await client.query(
    `
  SELECT *
  FROM (
    SELECT COUNT(DISTINCT uid) AS lastDay
    FROM "USER_DATA_TEST"
    WHERE  "last_login" >= (SELECT MAX("last_login") from "USER_DATA_TEST") - INTERVAL '24 HOURS'
    ) AS average`
  );

  return rows;
}

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  console.log(`User connected ID: ${socket.id}`);
  const intervalId = setInterval(async () => {
    const response = await averageUsers();
    const average = Number(response[0].lastday);

    socket.emit("average", average);
  }, interval);

  socket.on("disconnect", () => {
    console.log(`User disconnected ${socket.id}`);
    clearInterval(intervalId);
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
