var mongoose = require("mongoose")
  , util = require("util")
  , Schema = mongoose.Schema

var CardSnapshot = new Schema({
    trelloId : String
  , name : String
  , listTrelloId : String
  , shotTime : { type : Date, default: Date.now }
  , eop : {type: Schema.Types.Mixed } // estimation of points, {moduleName1: points1, moduleName2: points2}
})

CardSnapshot.methods = {
  parseFromTrello: function(trelloCard, trelloChecklist) {
    var matches, i

    this.trelloId= trelloCard.id
    this.name = trelloCard.name
    this.listTrelloId = trelloCard.idList
    this.eop = {}

    for (i=0; i<trelloChecklist.checkItems.length; ++i) {
      // eop format is "moduleName: 0.5"
      matches = trelloChecklist.checkItems[i].name.match(/(^[0-9a-zA-Z]+):(\d*(\.\d+)?)/)
      if (matches !== null && matches[0] !== null) {
        this.eop[matches[1].toLowerCase()] = parseFloat(matches[2])
      }
    }
    this.markModified("eop");
  }
}

CardSnapshot.statics = {
  sumOfPoints : function(snapshotArr) {
    var result = {}
      , i, eop
      , moduleName

    for (i=0; i< snapshotArr.length; ++i) {
      eop = snapshotArr[i].eop
      for (moduleName in eop) {
        if (result[moduleName] === undefined) result[moduleName] = eop[moduleName]
        else result[moduleName] += eop[moduleName]
      }
    }

    return result
  }
}

module.exports.CardSnapshot = mongoose.model('CardSnapshot', CardSnapshot)
module.exports.CardSnapshotSchema = CardSnapshot
