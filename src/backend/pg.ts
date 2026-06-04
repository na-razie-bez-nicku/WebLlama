import { Client } from "../node_modules/@types/pg/index.js"

new Client({host: "localhost", port: 5432, user: "postgres", password: process.env.PG_PASS })