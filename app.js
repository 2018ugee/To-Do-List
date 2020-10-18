//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose=require('mongoose');
const _=require('lodash');

mongoose.connect("mongodb+srv://pritam-admin:Test123@cluster0.zzkcj.mongodb.net/todolistDB",{useNewUrlParser:true,useUnifiedTopology: true});
const itemSchema=new mongoose.Schema({
  name:String
});
mongoose.set('useFindAndModify', false);
const Item=mongoose.model("Item",itemSchema);


const item1=new Item({
  name:"Let's add your 1st Todo !!!"
});

const defaultItems=[item1];


const listSchema=new mongoose.Schema({
  name:String,
  items:[itemSchema]
});
const List=mongoose.model("List",listSchema);


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const day = date.getDate();


app.get("/", function(req, res) {

  Item.find(function(err,items){
    if(err){
      console.log(err);
    }else{
      //console.log(items);

      if(items.length===0){
        Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          }else{
            //console.log("inserted all default");
            res.redirect("/");
          }
        });
      }else{
          res.render("list", {listTitle: day, newListItems: items});
      }

    }

  });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const title=req.body.title;
  const item=new Item({
    name:itemName
  });

  if(title===day){
    item.save(function(){
      res.redirect('/');
    });
  }else{
    List.findOne({name:title},function(err,list){
      if(!err&&list){
        list.items.push(item);

        list.save(function(){
          res.redirect("/"+list.name);
        });
      }
    });
  }

});

app.post("/delete",function(req,res){
//console.log("delet posted");
  const deleteid=req.body.checkbox;
  const title=req.body.title;
//console.log(req.body);
  if(title===day){
    Item.findByIdAndRemove(deleteid,function(err){
      if(err){
        console.log(err);
      }else{
        //console.log("deletedItem");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:title},{$pull:{items:{_id:deleteid}}},function(err){
      res.redirect("/"+title);
    });
  }
});

app.post("/edit",function(req,res){
//console.log("edit posted");
  const title=req.body.etitle;
  const itemId=req.body.itemid;
  const updatedContent=req.body.etext;

  //console.log(req.body);


  if(title===day){
    Item.findById(itemId,function(err,item){
      if(err)console.log(err);
      item.name=updatedContent;

      item.save(function(){
        res.redirect("/");
      });
    });
  }else{
    List.findOne({name:title},function(err,list){
      if(err)console.log(err);

      for(var i=0;i<list.items.length;i++){
        if(list.items[i]._id ==itemId){
          list.items[i].name=updatedContent;
          break;
        }
      }
      list.save(function(){
        res.redirect("/"+title);
      });
    });
  }
});

app.get("/:newtitle",function(req,res){
  const customtitle=_.capitalize(req.params.newtitle);

  List.findOne({name:customtitle},function(err,foundlist){
    if(!err&&foundlist){
      //console.log("foundlist");
     res.render('list',{listTitle:foundlist.name,newListItems:foundlist.items});
   }else{
     //console.log("not found");
     const list=new List({
       name:customtitle,
       items:defaultItems
     });
     list.save();
     res.redirect("/"+list.name);
   }
  });

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
