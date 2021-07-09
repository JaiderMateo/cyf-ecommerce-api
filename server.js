const { response } = require("express");
const e = require("express");
const express = require("express");
const app = express();
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});


app.use(express.json())

app.get("/customers", (request, response)=>{
    pool.query('select * from customers', (error, result)=>{
        response.json(result.rows);
    });
});

app.get("/suppliers", (request, response)=>{
    pool.query('select * from suppliers', (error, result)=>{
        response.json(result.rows);
    });
});

app.get("/products", (request, response)=>{
    if(request.query.name){
        let name = request.query.name
        pool.query(`select * from products p where p.product_name like '%${name}%'`, (error, result)=>{
            response.json(result.rows);
        });
    }else{
        pool.query(`select * from products`, (error, result)=>{
            response.json(result.rows);
        });
    }
})

app.get("/customers/:customerId", (request, response)=>{
    let id =  parseInt(request.params.customerId);
    if(id && id > 0){ 
        pool
        .query(`select * from customers c where c.id = ${id}`)
        .then((result)=>response.json(result.rows))
        .catch((e)=>console.error(e));
    }
})

app.post("/customers", (request, response)=>{
    let query = `insert into customers (id, "name", address, city, country) values ($1, $2, $3, $4, $5)`
    let {id, name, address, city, country} = request.body;
    let values = [id, name, address, city, country];
    pool.query(query, values, (error, result)=>{
        if(error) console.error(error);
        
    })
})

app.post("/products", (request, response)=>{
    let query = `insert into products (id, product_name, unit_price, supplier_id) values ($1, $2, $3, $4)`
    let {id, product_name, unit_price, supplier_id} = request.body;
    unit_price = parseInt(unit_price)
    let values = [id, product_name, unit_price, supplier_id];
    pool.query(`select * from suppliers s where s.id = ${supplier_id}`, (error, result)=>{
        if(result.rows.length > 0 && unit_price && unit_price > 0){
            pool.query(query, values, (error, result)=>{
                if(error) console.error(error)
                else response.send("product created");
            })
        }else{
            console.log("error invalid input");
        }
    })
})

app.post("/customers/:customerId/orders", (request, response)=>{
    let customer_id = request.params.customerId;
    pool.query(`select * from customers c where c.id = ${customer_id}`, (error, result)=>{
        if(error || result.rows.length == 0){
            error? console.error(error):console.log("customer not found")
            response.sendStatus(404)
        }else{
            let {id, order_date, order_reference, customer_id} = request.body;
            let values = [id, order_date, order_reference, customer_id]
            pool.query(`insert into orders (id, order_date , order_reference , customer_id) values ($1, $2, $3, $4)`, values, (error, result)=>{
                if(error){
                    console.error(error);
                    response.status(400);
                }else{
                    response.send("user created").json(result.rows);
                }
            })
        }
    })
})

app.put("/customers/:cutomerId", (request, response)=>{
    let customer_id = request.params.cutomerId;
    let {name, address, city, country} = request.body;
    let values = [name, address, city, country, customer_id]
    console.log(request.body, " dfawfasdadf", request.params.cutomerId, values);
    pool.query(`update customers set name = $1, address= $2 , city= $3 , country= $4 where id = $5;`, values, (error, resutl)=>{
        if(error){
            response.send("no se puedco");
        }else{
            response.send("customer modified values:");
        }
    })
})

app.delete("/orders/:orderId", (request, response)=>{
    let order_id = request.params.orderId;
    pool.query(`delete from order_items where order_items.order_id = ${order_id}`, (error, resutl)=>{
        if(error){
            console.error(error);
            response.sendStatus(400);
        }else{
            pool.query(`delete from orders where orders.id = ${order_id}`, (error, result)=>{
                response.send("order and order_items deleted");
            })
        }
    })
})

app.delete("/customers/:customerId", (request, response)=>{
    let customer_id = request.params.customerId
    pool.query(`select * from orders where customer_id = ${customer_id}`, (error, result)=>{
        if(result.rows.length == 0){
            pool.query(`delete from customers where id = ${customer_id}`, (error, result)=>{
                if(error){
                    response.sendStatus(400);
                }else{
                    response.send("user deleted")
                }
            })
        }else{
            response.send("no valid, the customer has some orders")
        }
    })
})

app.get("/customers/:customerId/orders", (request, response)=>{
    let customer_id = request.params.customerId;
    pool.query(`select o.order_reference , o.order_date , p.product_name , p.unit_price , s.supplier_name , oi.quantity from orders o
    inner join order_items oi on o.id = oi.order_id 
    inner join products p on p.id = oi.product_id
    inner join suppliers s on s.id = p.supplier_id 
    where o.customer_id = ${customer_id}`, (error, result)=>{
        if(error){
            console.error(error);
            response.sendStatus(400);
        }else{
            response.json(result.rows);
        }
    })
})

app.get("/products/:product_id", async (request, response)=>{
    let par = parseInt(request.params.product_id)
    let max = 0;
    const queryResult = await pool.query(`select max(p.id) as maximo
    from products p`)
    max = queryResult.rows[0].maximo;
    if(par && (par > 0 && par <= max)){
        pool.query(`select p.product_name , 
    s.supplier_name from suppliers s 
    inner join products p on p.supplier_id = s.id where p.id = ${par}`, (error, result)=>{
        response.json(result.rows);
    });
    }else{
        response.status(400).send("input no valid");
    }
});

app.listen(3000, ()=>{
    console.log("Server is listening on port 3000. Ready to accept requests!");
});
