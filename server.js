import express from "express";
import bodyParser, { json } from "body-parser";
import { MongoClient } from "mongodb";

const app = express();
app.use(bodyParser.json());

const articlesInfo = {
  "learn-react": {
    upvotes: 0,
    comments: [],
  },
  "learn-node": {
    upvotes: 0,
    comments: [],
  },
  "my-thoughts-on-resumes": {
    upvotes: 0,
    comments: [],
  },
};

//Common method for db activities
const withDb = async (operations) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Soemthnig went wrong", error });
  }
};

// refactored db get method ,using db utility method
app.get("/api/articles/:name", async (req, res) => {
  withDb(async (db) => {
    const articleName = req.params.name;
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articlesInfo);
  });
});

// refactored db commnet method ,using db utility method
app.post("/api/articles/:name/add-comment", async (req, res) => {
  const articleName = req.params.name;
  const { userName, text } = req.body;
  withDb(async (db) => {
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articlesInfo.comments.concat({ userName, text }),
        },
      }
    );
    const upDatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(upDatedArticleInfo);
  }, res);
});

// Raw upvote endpoint , not using db utility class
app.post("/api/articles/:name/upvote", async (req, res) => {
  try {
    const articleName = req.params.name;
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articlesInfo.upvotes + 1,
        },
      }
    );
    const upDatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(upDatedArticleInfo);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Soemthnig went wrong", error });
  }
});

/*For Learning*/

app.post("/api/articles/:name/upvote/without-db", (req, res) => {
  const articleName = req.params.name;

  articlesInfo[articleName].upvotes += 1;
  res
    .status(200)
    .send(
      `${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`
    );
});

app.post("/api/articles/:name/add-comment/without-db", (req, res) => {
  const articleName = req.params.name;
  const { userName, text } = req.body;
  articlesInfo[articleName].comments.push({ userName, text });
  res.status(200).send(articlesInfo[articleName]);
});

//GET
app.get("/hello", (req, res) => res.send("Hello Plain"));
//GET with params
app.get("/hello/:name", (req, res) => res.send(`Hello ${req.params.name}!`));
//POST with req body
app.post("/hello", (req, res) => res.send(`Hello ${req.body.name}!`));

app.listen(8000, () => console.log("Listening on Port 8000"));
