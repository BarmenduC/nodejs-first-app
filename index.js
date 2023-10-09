import express, { urlencoded } from "express";
import path from 'path'
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017", {
    dbname: "backend",
})
    .then(() => console.log("Database Connected"))
    .catch(e => console.log(e))

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})

const User = mongoose.model("User", userSchema)

const app = express()

const users = []

//using middlewares
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


//Setting up a view engine
app.set("view engine", "ejs")

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "jshdfhjasdhfkja")

        console.log(decoded)
        req.user = await User.findById(decoded._id)

        next()
    }
    else {
        res.redirect("login")
    }
}

app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user)
    res.render("logout", {name: req.user.name})
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req,res) => {
    res.render("login")
})

// app.get("/add", async (req, res) => {
//     await Messge.create({
//         name: "Champak1",
//         email: "ChampakChacha1@gmail.com"
//     })
//     res.send("Nice")
// })

app.get("/success", (req, res) => {
    res.render("success")
})

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    })
    res.redirect("/")
})

app.post("/login", async(req, res) => {

    const { email, password } = req.body;

    let user = await User.findOne({ email })

    if(!user) return res.redirect("/register")

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) return res.render("login", {email, message:"Incorrect Password"})

    else{
        const token = jwt.sign({ _id: user._id }, "jshdfhjasdhfkja")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    })
    res.redirect("/")
    }
})

app.post("/register", async (req, res) => {
    const { name, email, password } = (req.body)
    
    let user = await User.findOne({email})
    if(user){
        return res.redirect("/login")
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt);

    user = await User.create({
        name,
        email,
        password:hashedPassword,
    })

    const token = jwt.sign({ _id: user._id }, "jshdfhjasdhfkja")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    })
    res.redirect("/")
})

app.listen(8080, () => {
    console.log("Server is working")
})