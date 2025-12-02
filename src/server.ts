import dotenv from 'dotenv'
dotenv.config({ path: path.join(process.cwd(), ".env") })
import path from "path"
import express, { NextFunction, Request, Response } from "express"
import { Pool } from "pg"


const app = express()
const port = 5000



app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const pool = new Pool({
    connectionString: process.env.CONNECTION_STR
})

const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            age INT,
            phone VARCHAR(15),
            address TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )`
    );
    await pool.query(`
            CREATE TABLE IF NOT EXISTS todos(
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT false,
            due_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
}

initDB()

// middleware
const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next()
}

// post data
app.get("/",logger, (req: Request, res: Response) => {
  res.send("Hello Next Level Developers!");
});
app.post("/users", async (req: Request, res: Response) => {
    console.log("Body:", req.body);  

    const { name, email } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`,
            [name, email]
        )

        res.status(201).json({
            success: true,
            data: result.rows[0]
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})
//get data
app.get("/users", async(req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM users`);
        res.status(200).json({
            success: true,
            message: "Get All Users",
            data: result.rows
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
})
// single user data 
app.get("/users/:id", async(req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.params.id])
        if(result.rows.length === 0){
             res.status(500).json({
            success: false,
            message: "User not found",
            
        })
        }else{
            res.status(201).json({
            success: true,
            message: "Single user",
            data: result.rows[0]
        })

        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
})
//update single data
app.put("/users/:id", async(req: Request, res: Response) => {
    try {
        const {name, email} = req.body
        const result = await pool.query(`UPDATE users SET name=$1 email=$2 WHERE id=$3 RETURNING *`, [name,email,req.params.id])
        if(result.rows.length === 0){
             res.status(500).json({
            success: false,
            message: "User not found",
            
        })
        }else{
            res.status(201).json({
            success: true,
            message: "Updated Successfully",
            data: result.rows[0]
        })

        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
})
// delete user 
app.delete("/users/:id", async(req: Request, res: Response) => {
    try {
        
        const result = await pool.query(`DELETE FROM users WHERE id = $1`, [,req.params.id])
        if(result.rowCount === 0){
             res.status(500).json({
            success: false,
            message: "User not found",
            
        })
        }else{
            res.status(201).json({
            success: true,
            message: "deleted user",
            data: result.rows
        })

        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
})
//todos crud
app.post("/todos", async (req: Request, res: Response) => {
    console.log("Body:", req.body);  

    const { user_id, title } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO todos(user_id, title) VALUES($1, $2) RETURNING *`,
            [user_id, title]
        )

        res.status(201).json({
            success: true,
            data: result.rows[0]
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})
app.get("/todos", async(req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM todos`);
        res.status(200).json({
            success: true,
            message: "Todos get successfully",
            data: result.rows
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            details: error
        })
    }
})
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
