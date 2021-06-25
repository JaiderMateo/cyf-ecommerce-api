const express = require("express");
const app = express();
const { Pool } = require("pg");

const pool = new Pool ({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: '1234',
    port: 5432
})

app.listen(3000, ()=>{
    console.log("Server is listening on port 3000. Ready to accept requests!");
})

app.get("/customers", (request, response)=>{
    pool.query('select * from customers', (error, result)=>{
        response.json(result.rows);
    });
});

app.get("/suppliers", (request, response)=>{
    pool.query('select * from suppliers', (error, result)=>{
        response.json(result.rows);
    })
});