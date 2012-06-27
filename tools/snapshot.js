var async = require("async")
  , trello = require("node-trello")
  , mongoose = require("mongoose")
  , dateFormat = require("dateformat")
  , config = require("../config.js")

require("../models")
var CardSnapshot = mongoose.model('CardSnapshot')
  , BoardSnapshot = mongoose.model('BoardSnapshot')

var trelloClient = new trello(config.trello.APIKey, config.trello.token)

function getBoard(cb) {
  console.info("Loading Board...")
  trelloClient.get("/1/boards/"+config.trello.boardId
    , function(err, board) {
      if (err) throw new Error(err)
      else cb(board)
    })
}

function getOpenLists(cb) {
  console.info("Loading Lists...")
  trelloClient.get("/1/boards/"+config.trello.boardId+"/lists?open"
    , function(err, lists) {
      if (err) throw new Error(err)
      else cb(lists)
    })
}

function getOpenCards(cb) {
  console.info("Loading Cards...")
  trelloClient.get("/1/boards/"+config.trello.boardId+"/cards?open"
    , function(err, cards) {
      if (err) throw new Error(err)
      else cb(cards)
    })
}

function getMetadataList(card, cb) {
  console.info("Loading Card - "+card.name+"...")
  trelloClient.get("/1/cards/"+card.id+"/checklists"
    , function(err, checklists) {
        var i, cl
        if (err) throw new Error(err)
        cl = {checkItems:[]}
        for (i=0; i<checklists.length; ++i) {
          if (checklists[i].name.toLowerCase() ===
              (config.trello.metadataListName ? config.trello.metadataListName : "metadata")) {
              cl = checklists[i]
            }
        }
        cb(cl)
    })
}

function genAsyncFuncList(cards) {
  var fns, i
  fns = []
  for (i=0; i<cards.length; ++i) {
    fns.push(
      (function(cb){
          getMetadataList(this
            , (function(checklist) {
                cb(null, {card:this, checklist:checklist})
              }).bind(this)
          )
        }).bind(cards[i])
    )
  }
  return fns
}
    
mongoose.connect(config.mongodb.path)
console.info("Mongodb connected.")

var board = new BoardSnapshot()
console.info('Snapshot Time: '+dateFormat(board.shotTime, "isoDateTime"));
board.trelloId = config.trello.boardId
async.series([
    function(cb){
      getBoard(function(board){cb(null, board)})
    }
    , function(cb){
      getOpenCards(function(cards){cb(null, cards)})
    }
    , function(cb){
      getOpenLists(function(lists){cb(null, lists)})
    }
  ], function(err, results){
    var trelloBoard = results[0]
      , trelloCards = results[1]
      , trelloLists = results[2]

      console.info("Updating Lists...")

      board.parseFromTrello(trelloBoard, trelloLists)

      async.parallel(genAsyncFuncList(trelloCards)
        , function(err, results) {
            var card, i
            console.info("Updating Cards...")
            for (i=0; i<results.length; ++i) {
              card = new CardSnapshot()
              card.parseFromTrello(results[i].card, results[i].checklist)
              board.cards.push(card)
            }
            board.save(function(err){
              if (err) throw new Error(err)
              console.info("Updated.")
              mongoose.connection.close()
              console.info("Mongodb connection closed.")
            })
          }
      )
  }
)
