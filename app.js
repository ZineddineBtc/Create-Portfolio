//jshint esversion:6
require("dotenv").config();
const fs = require("fs");
const busboy = require("connect-busboy");
const path = require("path");
const multer = require("multer");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const Card = require("./models/card");


mongoose.connect("mongodb+srv://adminzineddine:adminpassword@cluster0.cj8av.mongodb.net/myFirstDatabase",
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false, 
        useCreateIndex: true
    }
);

const app = express();
app.use(express.static("public"));
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(busboy());
app.set("view engine", "ejs");
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialize: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/index",
    passReqToCallback: true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function(request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({
            username: profile.emails[0].value, 
            googleId: profile.id,
            name: profile.displayName
        }, function (err, user) {return done(err, user);});
  }
));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "zineddine.bettouche.dev@gmail.com",
      pass: process.env.EMAIL_PASSWORD
    }
}); 

let storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads')
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now())
    }
});
let upload = multer({storage: storage});

//////////////////////////////   Index Routes    ///////////////////////////////

app.get("/", function(req, res){
    res.redirect("/index");
});

app.get("/index", function(req, res){
    if(!req.isAuthenticated()){
        res.render("index"); 
    } else {
        res.redirect("/profile");
    } 
});

////////////////////// Login/Register/Logout Routes /////////////////////

app.get("/login", function(req, res){
    if(req.isAuthenticated()) return res.render("profile"); 
    res.render("login"); 
});

app.post("/login", function(req, res, next) {
    passport.authenticate("local", function(error, user, info) {
        if (error) return next(error); 
        if (!user) return res.render("login"); 
        req.logIn(user, function(error) {
            if (error) return next(error); 
            return res.redirect("/profile");
        });
    })(req, res, next);
});

app.get("/register", function(req, res){
    if(req.isAuthenticated()) return res.render("profile"); 
    res.render("register"); 
});

app.post("/register", function(req, res){
    User.register(
        new User({
            username: req.body.username, 
            name:req.body.name
        }), 
        req.body.password, function(error, user){
        if(error){
            console.log(error);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/profile");
        });
    });
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ['https://www.googleapis.com/auth/userinfo.profile',
             'https://www.googleapis.com/auth/userinfo.email']
}));

app.get("/auth/google/index",
    passport.authenticate( "google", {
        successRedirect: "/",
        failureRedirect: "/login"
})); 

app.get("/logout", function(req, res){
    if(!req.isAuthenticated()) return res.render("index"); 
    req.logout();
    res.redirect("/index");
    
});

///////////////////////////   Profile Routes    //////////////////////////

app.get("/profile", function(req, res){
    if(!req.isAuthenticated()) return res.render("index"); 
    let src;
    if(req.user.imgData === null) src = null;
    else src = "data:image/"+req.user.imgContentType+";base64,"+ req.user.imgData.toString("base64");
    let profileLink = "https://create-online-portfolio.herokuapp.com/profiles/"+req.user._id;
    res.render("profile", {
        name: req.user.name,
        bio: req.user.bio,
        src: src,
        sections: req.user.sections,
        profileLink: profileLink
    });
});

app.post("/profile/update/:toUpdate/:name/:bio", function(req, res){
    if(req.isAuthenticated()){
        let toUpdate = req.params.toUpdate;
        if(toUpdate === "update-name") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {name: req.params.name}}, function(error, doc){if(error){console.log(error);}});
            console.log("name updated");
        } else if(toUpdate === "update-bio") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {bio: req.params.bio}}, function(error, doc){if(error){console.log(error);}});
            console.log("bio updated");
        } else if(toUpdate === "update-name-bio") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {name: req.params.name, bio: req.params.bio}}, function(error, doc){if(error){console.log(error);}});
            console.log("name and bio updated");
        }
    }
});

app.post("/profile/upload-photo", upload.single("image"), (req, res, next) => {
    const p = path.join(__dirname + "/" + req.file.filename);
    imgData = fs.readFileSync(p);
    imgContentType = "image/png";
    User.findOneAndUpdate({_id: (req.user._id)}, {$set: {imgData: imgData, imgContentType: imgContentType}}, 
        function(error, doc){
            if(error) console.log(error);
            else {
                fs.unlink(p, (error) => {
                    if (error) throw error;
                    console.log(p + " was deleted");
                }); 
                res.redirect("/profile");
            }
        });
});

app.post("/profile/delete-photo", function(req, res) {
    User.findOneAndUpdate(
        {_id: (req.user._id)}, 
        {$set: {imgData: null, imgContentType: null}}, 
        function(error, doc){
            if(error) return console.log(error);
            res.redirect("/profile");
        });
});

app.post("/profile/create-section/:section", function(req, res){
    User.findOneAndUpdate(
        {_id: req.user._id}, 
        {$push: {sections: req.params.section}},
        function (error, success){
            if (error) return res.send(error);
        }
    );
});

app.post("/profile/delete-section/:section", function(req, res){
    Card.deleteMany(
        {userID: req.user._id, section: req.params.section},
        function (error, success){
            if (error) return res.send(error);
        }
    );
    User.findOneAndUpdate(
        {_id: req.user._id}, 
        {$pull: {sections: req.params.section}},
        function (error, success){
            if (error) return res.send(error);
        }
    );
});

app.post("/profile/create-card", function(req, res){
    const section = req.body.section;
    // if section isn't in user-sections => pushed.
    User.find({_id: mongoose.Types.ObjectId(req.user._id)}, 
        function(error, users){
            const sections = users[0].sections;
            if(!sections.includes(section))
                User.findOneAndUpdate({_id: (req.user._id)}, {$push: {sections: section}}, function(error, doc){if(error){console.log(error);}});
        }
    );

    let newCard = new Card();
    newCard.userID = req.user._id;
    newCard.section = section;
    newCard.title = req.body.title;
    newCard.description = req.body.description;
    newCard.datetime = req.body.datetime;
    newCard.url = req.body.url;
    newCard.save(function(error, createdCard){
        if(!error) {
            res.send({
                cardID: createdCard._id,
                cardUserID: createdCard.userID
            });
        } else {
            console.log(error);
        }
    });
});

app.post("/profile/delete-card/:id", function(req, res){
    const id = req.params.id;
    Card.findOneAndRemove({_id: id}, function(error){
        if(error) console.log(error);
    }); 
});

app.post("/profile/get-cards", function(req, res){
    Card.find({userID: req.user._id},
        function(error, cards) {
            if (error) return res.send(err);
            res.send(cards);
        }
    );
});
/////////////////////////// Exterior Profile Visit ///////////////////////////
app.get("/profiles/:id", function(req, res){
    User.findOne({_id: req.params.id}, function (err, user) { 
        let src;
        if(user.imgData === null) src = null;
        else src = "data:image/"+user.imgContentType+";base64,"+ user.imgData.toString("base64");
        res.render("visit-profile",{
            isAuthenticated: req.isAuthenticated(),
            profileID: user._id,
            name: user.name,
            bio: user.bio,
            sections: user.sections,
            src: src
        });
    });
});
app.post("/profiles/:id/get-cards", function(req, res){
    Card.find({userID: req.params.id},
        function(error, cards) {
            if (error) return res.send(err);
            res.send(cards);
        }
    );
});

/////////////////////////// Feedback - sent ///////////////////////////
app.get("/feedback", function(req, res){
    if(!req.isAuthenticated()) return res.render("index"); 
    res.render("feedback", {
        name: req.user.name
    });
}); 

app.post("/feedback", function(req, res){
    let mailBody = "PROJECT: Create Portfolio \n-------------------\n";
    if(req.isAuthenticated()) {
        mailBody += "Username: "+ req.user.username + "\n" +
                   "Name: "+ req.user.name + "\n";
    } else {
        mailBody += "No Username, no name \n";
    }
    mailBody += req.body.feedbackDescription;
    const mailOptions = {
        from: "zineddine.bettouche.dev@gmail.com",
        to: "zineddine.bettouche.dev@gmail.com",
        subject: req.body.feedbackTitle,
        text: mailBody
    };  
    transporter.sendMail(mailOptions, function(error, info){
        if (error){
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);  
            res.redirect("/feedback-sent");
        }
    });
});

app.get("/feedback-sent", function(req, res){
    if(!req.isAuthenticated()) return res.render("index"); 
    res.render("feedback-sent", {
        name: req.user.name
    }); 
}); 






app.listen(process.env.PORT || 3000, function(){
    console.log("Server running on port 3000");
});