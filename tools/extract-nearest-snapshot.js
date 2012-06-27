var mongoose = require("mongoose")
  , config = require("../config.js")

require("../models")
var BoardSnapshot = mongoose.model('BoardSnapshot')

function sumOfBoardPoints(err, b) {
  var points, listName, moduleName
    , result = {}

  if (err) throw new Error(err)
  points = b.sumOfPoints()

  for (listName in points) {
    for (moduleName in points[listName]) {
      if (result[moduleName] === undefined) {
        result[moduleName] = {
            done: 0
          , unfinished: 0
          , total: 0
        }
      }
      if (listName.match(/done|qa/i) !== null) {
        result[moduleName].done += points[listName][moduleName]
      } else {
        result[moduleName].unfinished += points[listName][moduleName]
      }
      result[moduleName].total += points[listName][moduleName]
    }
  }

  console.info(result)

  mongoose.connection.close()
  console.info("Mongodb connection closed.")
}

mongoose.connect(config.mongodb.path)
console.info("Mongodb connected.")
BoardSnapshot.findOne(sumOfBoardPoints)
