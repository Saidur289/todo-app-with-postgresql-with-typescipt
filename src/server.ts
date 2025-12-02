import dotenv from 'dotenv'
dotenv.config({ path: path.join(process.cwd(), ".env") })
import path from "path"
import express, { Request, Response } from "express"
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
// post data
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
