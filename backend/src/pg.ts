import { Client } from "pg"

new Client({host: "localhost", port: 5432, user: "postgres", password: process.env.PG_PASS })