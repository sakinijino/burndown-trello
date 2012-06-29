var mongoose = require("mongoose")
  , CardSnapshot = require("./card-snapshot.js").CardSnapshotSchema
  , Schema = mongoose.Schema

var BoardSnapshot = new Schema({
    trelloId : String
  , name : String
  , shotTime : { type: Date, default: Date.now, index: true }
  , lists : { type: Schema.Types.Mixed } // { listId1: listName1 , listId2: listName2}
  , cards : [CardSnapshot]
})

BoardSnapshot.method('parseFromTrello', function(trelloBoard, trelloLists) {
  var matches, i, list

  this.name = trelloBoard.name
  this.lists = {}

  for (i=0; i<trelloLists.length; ++i) {
    list = trelloLists[i]
    this.lists[list.id] = list.name
  }
  this.markModified("list")
})

/* Sum Of Points Group by List
 * rules: a obj of key-regexp which matches list names, e.g.
   {
       done: {
           match: true
         , regexp: /done|qa/i
       }
     , unfinished: {
           match: false
         , regexp: /done|qa/i
     }
} */
BoardSnapshot.method("sopGroupByList", function(rules) {
  var cardGroups = {}
  , result = {}
  , i, card, listName
  , groupName
  , rule, match

  for (i=0; i< this.cards.length; ++i) {
    card = this.cards[i]
    listName = this.lists[card.listTrelloId]
    if (!rules || rules.toString() !== '[object Object]') {
      if (cardGroups[listName] === undefined) cardGroups[listName] = [card]
      else cardGroups[listName].push(card)
    } else {
      for (groupName in rules) {
        rule = rules[groupName]
        match = listName.match(rule.regexp)
        if (!rule.match) match = !match
        if (match) {
          if (cardGroups[groupName] === undefined) cardGroups[groupName] = [card]
          else cardGroups[groupName].push(card)
        }
      }
    }
  }

  for (groupName in cardGroups) {
    result[groupName] = mongoose.model('CardSnapshot').sumOfPoints(cardGroups[groupName])
  }

  return result
})
BoardSnapshot.method("sopGroupByModule", function(rules) {
  var listName, moduleName
    , result = {}
    , sop = this.sopGroupByList(rules)

  for (listName in sop) {
    for (moduleName in sop[listName]) {
      if (result[moduleName] === undefined) result[moduleName] = {}
      result[moduleName][listName] = sop[listName][moduleName]
    }
  }

  return result
})

module.exports.BoardSnapshot = mongoose.model('BoardSnapshot', BoardSnapshot)
module.exports.BoardSnapshotSchema = BoardSnapshot
