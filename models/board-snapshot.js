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

BoardSnapshot.methods.parseFromTrello = function(trelloBoard, trelloLists) {
  var matches, i, list

  this.name = trelloBoard.name
  this.lists = {}

  for (i=0; i<trelloLists.length; ++i) {
    list = trelloLists[i]
    this.lists[list.id] = list.name
  }
  this.markModified("list")
}
BoardSnapshot.methods.sumOfPoints = function() {
  var cardGroups = {}
  , result = {}
  , i, card, listName
  , groupName

  for (i=0; i< this.cards.length; ++i) {
    card = this.cards[i]
    listName = this.lists[card.listTrelloId]
    if (cardGroups[listName] === undefined) cardGroups[listName] = [card]
    else cardGroups[listName].push(card)
  }

  for (groupName in cardGroups) {
    result[groupName] = mongoose.model('CardSnapshot').sumOfPoints(cardGroups[groupName])
  }

  return result
}

module.exports.BoardSnapshot = mongoose.model('BoardSnapshot', BoardSnapshot)
module.exports.BoardSnapshotSchema = BoardSnapshot
