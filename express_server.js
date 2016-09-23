/*jshint esversion: 6 */
'use strict';

const express = require("express");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT || 8080;
const MONGODB_URI = "mongodb://127.0.0.1:27017/url_shortener";

const app = express();

app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

MongoClient.connect(MONGODB_URI, (err, db) => {
  if (err) {
    throw err;
  }

  //this function will get entire data entry with a specific shortURL.
  function searchByShortUrl(db, shortURL, cb) {
    let query = { "shortURL": shortURL };
    db.collection("urls").findOne(query, cb);
  }

  app.get("/", (req, res) => {
    res.redirect("/urls");
  });

  app.post("/login", (req, res) => {
    res.cookie("username", req.body.username);
    res.redirect("/");
  });

  app.post("/logout", (req, res) => {
    res.cookie("username", "");
    res.redirect("/");
  });

  app.get("/urls", (req, res) => {
    db.collection("urls").find().toArray((err, results) => {
      res.render("urls_index", {
        database: results,
        username: req.cookies["username"]
      });
    });
  });

  app.get("/urls/new", (req, res) => {
    res.render("urls_new", {
      username: req.cookies["username"]
    });
  });

  //This function will generate a random string of 6 letters or numbers, for
  //the use of shortURL.
  function generateRandomString() {
    const set = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";

    for (let i = 0; i < 6; i++) {
      let randomPosition = Math.floor(Math.random() * 36);
      let randomvarNum = set[randomPosition];
      randomStr += randomvarNum;
    }
    return randomStr;
  }

  app.post("/urls/create", (req, res) => {
    let randomStr = generateRandomString();
    let longURL = req.body.longURL;

    if (longURL.substring(0, 7) !== "http://") {
      res.redirect("/urls/new/");
    } else {
      let doc = {
        shortURL: randomStr,
        longURL: longURL
      };

      db.collection("urls").insert(doc, (err, results) => {
        res.redirect(`http://localhost:8080/urls/${randomStr}`);
      });
    }
  });

  app.get("/urls/:id", (req, res) => {
    let shortURL = req.params.id;

    searchByShortUrl(db, shortURL, (err, result) => {
      if (err || result == null) {
        res.redirect("/urls");
      } else {
        res.render("urls_show", {
          shortURL: shortURL,
          longURL: result.longURL,
          username: req.cookies["username"]
        });
      }
    });
  });

  app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;
    searchByShortUrl(db, shortURL, (err, result) => {
      if (err || result == null) {
        res.redirect('/urls');
      } else {
        res.redirect(result.longURL);
      }
    });
  });

  app.put("/urls/:id", (req, res) => {
    db.collection("urls").update({shortURL: req.params.id}, {shortURL: req.params.id, longURL: req.body.longURL}, function() {
      res.redirect('/urls');
    });
  });

  app.delete("/urls/:id", (req, res) => {
    let shortU = req.params.id;
    db.collection("urls").deleteOne(
      {shortURL: shortU},
      res.redirect('/urls'));
    });



  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });
});
