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

