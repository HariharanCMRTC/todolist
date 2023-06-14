
const express = require('express');
const bodyParser = require('body-parser');
const { log } = require('console');
const date = require(__dirname+"/date.js");
const mongoose = require('mongoose');
const { Long } = require('mongodb');
const _ = require('lodash');

const app = express();


// let items = [];
// let workItems= [];
app.use(
    bodyParser.urlencoded({extended: true})
)

app.use(express.static('public'));
app.set('view engine','ejs');


mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB!');
}).on('error', (error) => {
    console.log('MongoDB connection error:', error);
});

const itemsSchema = new mongoose.Schema({
    name: {
        type: String
    }
})

const listSchema = new mongoose.Schema({
    name: {
        type: String
    },
    items: [itemsSchema]
})

const Item = mongoose.model("Item", itemsSchema)
const List = mongoose.model("List", listSchema)

const item1 = new Item({
    name: "Work Notes"
})

const item2 = new Item({
    name: " This to-do list helps to be productive"
})

const item3 = new Item({
    name: "Use it wisely"
})

const defaultArray = [item1, item2, item3]


app.get("/",(req,res)=>{
    //in order to avoid redundant values

    // mongoose find 
    Item.find({})
        .then((FoundItems)=>{
            if(FoundItems.length === 0){
                // insert multiple values
                Item.insertMany(defaultArray)
                    .then(()=>{
                        console.log("Items inserted successfully!");
                    })
                    .catch((err)=>{
                        console.log(err);
                    })
                res.redirect("/");
            } else{
                res.render("list",{listTitle: "Today", newItems: FoundItems})
            }
        })
        .catch((err)=>{
            console.log("Document find error occured: "+err);
        })
    // let day = date();
    
})

// app.get("/work",(req,res)=>{
//     res.render("list",{listTitle: "Work list",newItems: workItems})
// }); 

app.get("/about",(req,res)=>{
    res.render("about");
})

app.get("/:topic",(req,res)=>{
    const customListName = _.capitalize(req.params.topic);

    List.findOne({name: customListName})
        .then((foundList)=>{
            if(!foundList){
                // create a new list 
                const list = new List({
                    name: customListName,
                    items: []
                })
                list.save();
                console.log("Created new list!!");
                res.redirect("/"+customListName)
            } else{
                // show existing list 
                res.render("list",{listTitle: foundList.name, newItems: foundList.items})
                console.log("Exists!");
            }
        })
        .catch((err)=>{
            console.log(err);
        })

})

app.post("/",(req,res)=>{
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })
    if(listName === "Today"){
        // add item to today's list
        item.save()
            .then(()=>{
                console.log("Successfully inserted document");
            })
            .catch((err)=>{
                console.log(err);
            })
        res.redirect("/");
    }else{
        List.findOne({name: listName})
            .then((foundList)=>{
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+listName);
                console.log("Inserting elements in custom list");
            })
            .catch((err)=>{
                console.log("Custom list insert error: "+err);
            })
    }
    
})


app.post("/delete", (req,res)=>{
    const checkboxItemId = req.body.submitBox;
    const listName = req.body.customListName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkboxItemId)
            .then(()=>{
                console.log("Item deleted successfully");
            })
            .catch((err)=>{
                console.log(err);
            })
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxItemId}}})
            .then(()=>{
                console.log("Custom Item deleted successfully");
            })
            .catch((err)=>{
                console.log("Custom delete error: "+err);
            })
        res.redirect("/"+ listName)
    }

})


app.listen(3000,(req,res)=>{
    console.log("Server is running on port 3000...");
})